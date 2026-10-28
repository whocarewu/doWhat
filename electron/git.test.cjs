const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { getGitLogs, getGitUser, getRepoInfo, scanRepositories } = require('./git.cjs');

test('自动读取仓库 Git 用户，并只获取该用户的提交', async t => {
  const tempRoot = path.resolve(os.tmpdir());
  const dir = fs.mkdtempSync(path.join(tempRoot, 'dowhat-test-'));
  t.after(() => {
    if (path.dirname(path.resolve(dir)) === tempRoot && path.basename(dir).startsWith('dowhat-test-')) fs.rmSync(dir, { recursive: true, force: true });
  });
  const git = (...args) => execFileSync('git', ['-C', dir, ...args], {
    encoding: 'utf8', stdio: 'pipe', env: { ...process.env, GIT_AUTHOR_DATE: '2025-06-01T12:00:00+08:00', GIT_COMMITTER_DATE: '2025-06-01T12:00:00+08:00' }
  });
  git('init');
  git('config', 'user.name', 'Alice Example');
  git('config', 'user.email', 'alice@example.test');
  fs.writeFileSync(path.join(dir, 'a.txt'), 'first');
  git('add', 'a.txt');
  git('commit', '-m', 'feat: first');
  git('config', 'user.name', 'Bob Example');
  git('config', 'user.email', 'bob@example.test');
  fs.writeFileSync(path.join(dir, 'a.txt'), 'second');
  git('add', 'a.txt');
  git('commit', '-m', 'fix: second');

  assert.match(git('log', '-1', '--format=%ae'), /bob@example\.test/);
  assert.match(git('log', '--since=2025-01-01 00:00:00', '--until=2025-12-31 23:59:59', '--author=bob@example.test', '--format=%s'), /fix: second/);
  assert.deepEqual(await getGitUser(dir), { name: 'Bob Example', email: 'bob@example.test' });
  const query = { since: '2025-01-01 00:00:00', until: '2025-12-31 23:59:59', repoPaths: [{ name: 'demo', path: dir }] };
  const result = await getGitLogs(query);
  assert.equal(result.errors.length, 0);
  assert.equal(result.users[0].email, 'bob@example.test');
  assert.deepEqual(result.logs.map(log => log.message), ['fix: second']);
  const manual = await getGitLogs({ ...query, author: 'alice@example.test' });
  assert.deepEqual(manual.logs.map(log => log.message), ['feat: first']);
});

test('扫描项目目录、排除依赖目录，并将仓库子目录归一到根目录', async t => {
  const tempRoot = path.resolve(os.tmpdir());
  const dir = fs.mkdtempSync(path.join(tempRoot, 'dowhat-test-'));
  t.after(() => {
    if (path.dirname(path.resolve(dir)) === tempRoot && path.basename(dir).startsWith('dowhat-test-')) fs.rmSync(dir, { recursive: true, force: true });
  });
  const project = path.join(dir, 'projects', 'first');
  const other = path.join(dir, 'second');
  const ignored = path.join(dir, 'node_modules', 'package');
  const nested = path.join(project, 'src');
  for (const folder of [nested, other, ignored]) fs.mkdirSync(folder, { recursive: true });
  for (const folder of [project, other, ignored]) execFileSync('git', ['-C', folder, 'init'], { stdio: 'pipe' });
  const info = await getRepoInfo(nested);
  assert.equal(fs.statSync(info.path).ino, fs.statSync(project).ino);
  const scan = await scanRepositories(dir);
  assert.deepEqual(scan.repos.map(repo => repo.name).sort(), ['first', 'second']);
  assert.equal(scan.truncated, false);
  const limited = await scanRepositories(dir, { maxDirectories: 1 });
  assert.equal(limited.truncated, true);
});
