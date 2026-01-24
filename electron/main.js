import { app, BrowserWindow, shell, session, ipcMain, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

// Recreate __dirname for ESM
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 1. SPOOFING: Use standard Chrome User Agent to bypass Google security checks.
const FAKE_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// Store custom download path in memory
let customDownloadPath = '';

const createWindow = () => {
  const isDev = !app.isPackaged;
  
  // Icon path adjustment for dev vs prod
  const iconPath = isDev 
    ? path.join(__dirname, '../public/favicon.svg') 
    : path.join(__dirname, '../dist/favicon.svg');

  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "Script Modifier",
    icon: iconPath,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true, // Important for security
      preload: path.join(__dirname, 'preload.js'),
      partition: 'persist:main', // Separate partition for caching
    },
  });

  // 2. APPLY USER AGENT SPOOFING
  win.webContents.setUserAgent(FAKE_USER_AGENT);

  // Hide menu bar for app-like feel
  win.setMenuBarVisibility(false);

  // 3. Handle external links and popups (Google Login)
  win.webContents.setWindowOpenHandler(({ url }) => {
    // If it's a Google accounts URL, allow it as a popup
    if (url.includes('accounts.google.com')) {
      return { 
        action: 'allow',
        overrideBrowserWindowOptions: {
            autoHideMenuBar: true,
            userAgent: FAKE_USER_AGENT // Apply spoofing to popup
        }
      };
    }
    
    // Open other external links in system browser
    if (url.startsWith('http')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    
    return { action: 'allow' };
  });

  // Force UA on any new windows created
  app.on('browser-window-created', (e, window) => {
      window.webContents.setUserAgent(FAKE_USER_AGENT);
      window.setMenuBarVisibility(false);
  });

  // 4. Network Interception for Headers
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    details.requestHeaders['User-Agent'] = FAKE_USER_AGENT;
    callback({ cancel: false, requestHeaders: details.requestHeaders });
  });

  // Handle downloads
  session.defaultSession.on('will-download', (event, item, webContents) => {
    if (customDownloadPath) {
      item.setSavePath(path.join(customDownloadPath, item.getFilename()));
    }
  });

  // Load App
  if (isDev) {
    win.loadURL('http://localhost:5173').catch(() => {
        // Fallback if dev server isn't running
        win.loadFile(path.join(__dirname, '../dist/index.html'));
    });
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }
};

// --- IPC Handlers ---

ipcMain.handle('dialog:selectFolder', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });
  if (result.canceled) {
    return null;
  } else {
    return result.filePaths[0];
  }
});

ipcMain.on('app:setDownloadPath', (event, path) => {
  customDownloadPath = path;
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});