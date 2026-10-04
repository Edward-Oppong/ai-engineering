const { contextBridge, ipcRenderer } = require('electron');

// Expose safe platform context to the renderer
contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  platform: process.platform,
  /**
   * Write content to a temp file and open it with the OS default editor.
   * Returns { ok: boolean, error?: string }
   */
  openFile: (filename, content) =>
    ipcRenderer.invoke('open-file', { filename, content }),
});
