const path = require('path');
const fs = require('fs/promises');
const simpleGit = require('simple-git');

async function openRepo(repoPath) {
  const git = simpleGit(path.resolve(repoPath));
  if (!await git.checkIsRepo()) throw new Error('该路径不是 Git 仓库');
  return git;
}

async function readUser(git) {
  async function config(key) {
    try { return (await git.raw(['config', '--get', key])).trim(); }
    catch { return ''; }
  }
  const [name, email] = await Promise.all([config('user.name'), config('user.email')]);
  return { name, email };
}

async function getGitUser(repoPath) {
  return readUser(await openRepo(repoPath));
}

async function getRepoInfo(repoPath) {
  const git = await openRepo(repoPath);
  const root = await fs.realpath(path.resolve((await git.revparse(['--show-toplevel'])).trim()));
  return { name: path.basename(root), path: root };
}

// Scan a bounded number of directories without following links or dependency folders.
async function scanRepositories(rootPath, options = {}) {
  const maxDepth = options.maxDepth ?? 3;
  const maxDirectories = options.maxDirectories ?? 2000;
  const ignored = new Set(['node_modules', 'vendor', 'target', 'dist', 'build', '.git']);
  const queue = [{ path: path.resolve(rootPath), depth: 0 }];
  const repos = [];
  let visited = 0;
  let skipped = 0;
  while (queue.length && visited < maxDirectories) {
    const current = queue.shift();
    visited++;
    let entries;
    try { entries = await fs.readdir(current.path, { withFileTypes: true }); }
    catch (error) {
      if (current.depth === 0) throw error;
      skipped++;
      continue;
    }
    if (entries.some(entry => entry.name === '.git' && (entry.isDirectory() || entry.isFile()))) {
      try { repos.push(await getRepoInfo(current.path)); }
      catch { skipped++; }
    }
    if (current.depth < maxDepth) {
      for (const entry of entries) {
        if (entry.isDirectory() && !entry.name.startsWith('.') && !ignored.has(entry.name.toLowerCase())) {
          queue.push({ path: path.join(current.path, entry.name), depth: current.depth + 1 });
        }
      }
    }
  }
  return { repos, skipped, truncated: queue.length > 0 };
}

async function getGitLogs({ author, since, until, repoPaths = [] }) {
  const logs = [];
  const errors = [];
  const users = [];
  for (const repo of repoPaths) {
    try {
      const git = await openRepo(repo.path);
      let filter = author?.trim();
      if (!filter) {
        const user = await readUser(git);
        users.push({ repo: repo.name, ...user });
        filter = user.email || user.name;
        if (!filter) throw new Error('未找到 Git 用户名或邮箱，请设置 Git 用户信息或手动填写作者');
      }
      const result = await git.log({ '--since': since, '--until': until, '--author': filter });
      logs.push(...result.all.map(item => ({ ...item, repo: repo.name, repoPath: repo.path })));
    } catch (error) {
      errors.push({ repo: repo.name, message: error.message });
    }
  }
  logs.sort((a, b) => new Date(b.date) - new Date(a.date));
  return { logs, errors, users };
}

module.exports = { getGitUser, getGitLogs, getRepoInfo, scanRepositories };
