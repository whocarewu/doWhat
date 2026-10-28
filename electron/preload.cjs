const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  platform: process.platform,
  getGitLogs: params => ipcRenderer.invoke('git:getLogs', params),
  getGitUser: repoPath => ipcRenderer.invoke('git:getUser', repoPath),
  getRepoInfo: repoPath => ipcRenderer.invoke('git:getRepoInfo', repoPath),
  scanRepositories: rootPath => ipcRenderer.invoke('git:scanRepositories', rootPath),
  chooseRepo: () => ipcRenderer.invoke('dialog:chooseRepo'),
  chooseScanFolder: () => ipcRenderer.invoke('dialog:chooseScanFolder'),
  saveReport: params => ipcRenderer.invoke('dialog:saveReport', params),
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  toggleMaximizeWindow: () => ipcRenderer.invoke('window:toggleMaximize'),
  isWindowMaximized: () => ipcRenderer.invoke('window:isMaximized'),
  closeWindow: () => ipcRenderer.invoke('window:close'),
  onWindowMaximized: callback => {
    const listener = (_, maximized) => callback(maximized);
    ipcRenderer.on('window:maximized', listener);
    return () => ipcRenderer.removeListener('window:maximized', listener);
  },
});
contextBridge.exposeInMainWorld('electronStore', {
  get: key => ipcRenderer.invoke('store-get', key),
  set: (key, value) => ipcRenderer.invoke('store-set', key, value),
  delete: key => ipcRenderer.invoke('store-delete', key),
});
