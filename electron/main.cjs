//electron/main.cjs
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const simpleGit = require('simple-git');

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // 这里一定要指向 preload.js 的绝对路径
      contextIsolation: true,    // 一般必须开启，提高安全性
      nodeIntegration: false     // 关闭渲染进程直接访问 Node，安全策略
    }
  });

  // 开发环境加载 vite 开发服务器地址
  win.loadURL('http://localhost:5213');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ==== 可配置：你的 Git 仓库路径们 ====
const repoPaths = [
  { name: 'orderBase-order-service', path: 'D:/GSXM/HouDuan/OrderBase/order-service' },
  { name: 'orderBase-platform-system', path: 'D:/GSXM/HouDuan/OrderBase/platform-system' },
];
// 封装 Git 日志函数
async function getGitLogs({ author, since, until }) {
  const options = {
    '--author': author || undefined,
    '--since': since || undefined,
    '--until': until || undefined,
    n: 100,
  };
  const filteredOptions = Object.fromEntries(Object.entries(options).filter(([_, v]) => v));

  const allLogs = [];

  for (const repo of repoPaths) {
    const git = simpleGit(path.resolve(repo.path));
    try {
      const log = await git.log(filteredOptions);
      const logsWithSource = log.all.map(item => ({
        ...item,
        repo: repo.name
      }));
      allLogs.push(...logsWithSource);
    } catch (err) {
      console.warn(`仓库 ${repo.name} 获取日志失败：`, err.message);
    }
  }

  // 排序
  return allLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

// 监听前端调用
ipcMain.handle('git:getLogs', async (_, queryParams) => {
  return await getGitLogs(queryParams);
});
