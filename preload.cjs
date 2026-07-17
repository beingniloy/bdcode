const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  readWorkspace: () => ipcRenderer.invoke('read-workspace'),
  readFile: (relPath) => ipcRenderer.invoke('read-file', relPath),
  writeFile: (relPath, content) => ipcRenderer.invoke('write-file', relPath, content),
  createFile: (relPath) => ipcRenderer.invoke('create-file', relPath),
  createFolder: (relPath) => ipcRenderer.invoke('create-folder', relPath),
  deleteItem: (relPath) => ipcRenderer.invoke('delete-item', relPath),
  renameItem: (oldRelPath, newRelPath) => ipcRenderer.invoke('rename-item', oldRelPath, newRelPath),
  
  // Desktop OS controls & picks
  windowControl: (action) => ipcRenderer.invoke('window-control', action),
  setTitle: (title) => ipcRenderer.send('set-title', title),
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  getPlatform: () => ipcRenderer.invoke('get-platform'),

  // Auto-update
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  downloadUpdate: () => ipcRenderer.invoke('download-update'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  onUpdateAvailable: (callback) => {
    const handler = (_event, info) => callback(info);
    ipcRenderer.on('update-available', handler);
    return () => ipcRenderer.removeListener('update-available', handler);
  },
  onUpdateNotAvailable: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('update-not-available', handler);
    return () => ipcRenderer.removeListener('update-not-available', handler);
  },
  onUpdateDownloadProgress: (callback) => {
    const handler = (_event, progress) => callback(progress);
    ipcRenderer.on('update-download-progress', handler);
    return () => ipcRenderer.removeListener('update-download-progress', handler);
  },
  onUpdateDownloaded: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('update-downloaded', handler);
    return () => ipcRenderer.removeListener('update-downloaded', handler);
  },

  // Terminal IPC
  sendTerminalInput: (text) => ipcRenderer.send('terminal-input', text),
  onTerminalData: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('terminal-data', handler);
    return () => ipcRenderer.removeListener('terminal-data', handler);
  },
  getTerminalHistory: () => ipcRenderer.invoke('get-terminal-history'),
  isPty: () => ipcRenderer.invoke('is-pty'),
  restartShell: (shellPath) => ipcRenderer.invoke('restart-shell', shellPath),
  
  // Git integrations
  gitStatus: () => ipcRenderer.invoke('git-status'),
  gitCmd: (cmdArgs) => ipcRenderer.invoke('git-cmd', cmdArgs),
  gitCommit: (message) => ipcRenderer.invoke('git-commit', message),

  // Disk-based search & replace
  searchFiles: (opts) => ipcRenderer.invoke('search-files', opts),
  replaceInFiles: (opts) => ipcRenderer.invoke('replace-in-files', opts)
});
