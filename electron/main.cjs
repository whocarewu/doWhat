const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs/promises');
const { getGitLogs, getGitUser, getRepoInfo, scanRepositories } = require('./git.cjs');
const StoreModule = require('electron-store');
const Store = StoreModule.default || StoreModule;
const store = new Store();

function createWindow() {
  const win = new BrowserWindow({
    width: 1360, height: 880, minWidth: 900, minHeight: 640,
    frame: false, backgroundColor: '#fafbfe', title: 'DoWhat',
    webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, nodeIntegration: false }
  });
  win.on('maximize', () => win.webContents.send('window:maximized', true));
  win.on('unmaximize', () => win.webContents.send('window:maximized', false));
  if (!app.isPackaged) win.loadURL('http://localhost:5213');
  else win.loadFile(path.join(__dirname, '../dist/index.html'));
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });

ipcMain.handle('git:getLogs', (_, params) => getGitLogs(params));
ipcMain.handle('git:getUser', (_, repoPath) => getGitUser(repoPath));
ipcMain.handle('git:getRepoInfo', (_, repoPath) => getRepoInfo(repoPath));
ipcMain.handle('git:scanRepositories', (_, rootPath) => scanRepositories(rootPath));
ipcMain.handle('window:minimize', event => BrowserWindow.fromWebContents(event.sender)?.minimize());
ipcMain.handle('window:toggleMaximize', event => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return false;
  if (win.isMaximized()) win.unmaximize(); else win.maximize();
  return win.isMaximized();
});
ipcMain.handle('window:isMaximized', event => BrowserWindow.fromWebContents(event.sender)?.isMaximized() ?? false);
ipcMain.handle('window:close', event => BrowserWindow.fromWebContents(event.sender)?.close());

ipcMain.handle('dialog:chooseRepo', async event => {
  const result = await dialog.showOpenDialog(BrowserWindow.fromWebContents(event.sender), { title: '选择 Git 仓库（可多选）', properties: ['openDirectory', 'multiSelections'] });
  return result.canceled ? [] : result.filePaths;
});
ipcMain.handle('dialog:chooseScanFolder', async event => {
  const result = await dialog.showOpenDialog(BrowserWindow.fromWebContents(event.sender), { title: '选择存放项目的文件夹', properties: ['openDirectory'] });
  return result.canceled ? null : result.filePaths[0];
});
ipcMain.handle('dialog:saveReport', async (event, { content, filename }) => {
  const result = await dialog.showSaveDialog(BrowserWindow.fromWebContents(event.sender), {
    defaultPath: filename, filters: [{ name: 'Markdown', extensions: ['md'] }, { name: 'Text', extensions: ['txt'] }]
  });
  if (result.canceled || !result.filePath) return false;
  await fs.writeFile(result.filePath, content, 'utf8');
  return true;
});
ipcMain.handle('store-get', (_, key) => store.get(key));
ipcMain.handle('store-set', (_, key, value) => { store.set(key, value); return true; });
ipcMain.handle('store-delete', (_, key) => { store.delete(key); return true; });
