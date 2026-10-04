const { app, BrowserWindow, Menu, shell, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1320,
    height: 880,
    minWidth: 900,
    minHeight: 600,
    title: 'AI Engineering from Scratch',
    backgroundColor: '#1c1b1a',
    show: false, // Show once ready to prevent white flash
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
    },
  });

  // Load the React app
  if (isDev && process.env.ELECTRON_START_URL) {
    mainWindow.loadURL(process.env.ELECTRON_START_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Graceful show on ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Handle external links in user's default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:') || url.startsWith('http:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  // Build native application menu
  const menuTemplate = [
    {
      label: 'View',
      submenu: [
        { role: 'reload', accelerator: 'CmdOrCtrl+R' },
        { role: 'forceReload', accelerator: 'CmdOrCtrl+Shift+R' },
        { type: 'separator' },
        { role: 'resetZoom', accelerator: 'CmdOrCtrl+0' },
        { role: 'zoomIn', accelerator: 'CmdOrCtrl+Plus' },
        { role: 'zoomOut', accelerator: 'CmdOrCtrl+-' },
        { type: 'separator' },
        { role: 'togglefullscreen', accelerator: 'F11' },
      ],
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Curriculum Repository',
          click: async () => {
            await shell.openExternal('https://github.com/rohitg00/ai-engineering-from-scratch');
          },
        },
        {
          label: 'Platform Source Code',
          click: async () => {
            await shell.openExternal('https://github.com/Edward-Oppong/ai-engineering');
          },
        },
      ],
    },
  ];

  if (isDev) {
    menuTemplate[0].submenu.push(
      { type: 'separator' },
      { role: 'toggleDevTools', accelerator: 'CmdOrCtrl+Shift+I' }
    );
  }

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ── IPC: open a source file in the OS default editor ───────────────────────
// The renderer sends { filename, content } → we write to a temp file and
// call shell.openPath() so the user's default editor (VS Code, PyCharm, etc.)
// handles it. The temp file is cleaned up after 60 s.
ipcMain.handle('open-file', async (_event, { filename, content }) => {
  try {
    const tmpDir = path.join(os.tmpdir(), 'ai-eng-scripts');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    const filePath = path.join(tmpDir, filename);
    fs.writeFileSync(filePath, content, 'utf8');
    const result = await shell.openPath(filePath);
    // shell.openPath returns '' on success, or an error string
    if (result) return { ok: false, error: result };
    // Cleanup after 60 s — long enough for any editor to read it
    setTimeout(() => { try { fs.unlinkSync(filePath); } catch {} }, 60_000);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

// App lifecycle
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
