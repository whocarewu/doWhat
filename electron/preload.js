// electron/preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getGitLogs: (params) => ipcRenderer.invoke('git:getLogs', params),
});