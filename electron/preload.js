const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectFolder: () => ipcRenderer.invoke('dialog:selectFolder'),
  setDownloadPath: (path) => ipcRenderer.send('app:setDownloadPath', path),
  // Listen for the main process asking to close
  onCloseRequested: (callback) => ipcRenderer.on('app:request-close', () => callback()),
  // Send confirmation back to main process to actually quit
  confirmClose: () => ipcRenderer.send('app:quit-confirmed')
});