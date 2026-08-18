const { contextBridge } = require('electron');

// Expose safe platform context to the renderer
contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  platform: process.platform,
});
