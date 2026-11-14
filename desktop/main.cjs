const { app, BrowserWindow, shell, session } = require('electron');
const path = require('node:path');

const APP_URL = process.env.MCONNECT_DESKTOP_URL || 'https://mconnect-app.keysire.com/';
const APP_ORIGIN = new URL(APP_URL).origin;
const GOOGLE_AUTH_ORIGIN = 'https://accounts.google.com';

function isTrustedAppUrl(value) {
  try {
    const url = new URL(value);
    return url.origin === APP_ORIGIN;
  } catch {
    return false;
  }
}

function openExternalUrl(value) {
  try {
    const url = new URL(value);
    if (url.protocol === 'https:' || url.protocol === 'mailto:') {
      void shell.openExternal(url.toString());
    }
  } catch {
    // Ignore malformed or unsupported external URLs.
  }
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1360,
    height: 900,
    minWidth: 900,
    minHeight: 640,
    autoHideMenuBar: true,
    backgroundColor: '#f7fafc',
    icon: path.join(__dirname, 'resources', 'mconnect.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    }
  });

  window.webContents.setWindowOpenHandler(({ url }) => {
    if (isTrustedAppUrl(url) || url.startsWith(`${GOOGLE_AUTH_ORIGIN}/`)) {
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          autoHideMenuBar: true,
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true
          }
        }
      };
    }

    openExternalUrl(url);
    return { action: 'deny' };
  });

  window.webContents.on('will-navigate', (event, url) => {
    if (isTrustedAppUrl(url) || url.startsWith(`${GOOGLE_AUTH_ORIGIN}/`)) return;
    event.preventDefault();
    openExternalUrl(url);
  });

  void window.loadURL(APP_URL);
}

app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback, details) => {
    let requestingOrigin = '';
    try {
      requestingOrigin = new URL(details.requestingUrl || webContents.getURL()).origin;
    } catch {
      callback(false);
      return;
    }

    const allowed = requestingOrigin === APP_ORIGIN && ['media', 'notifications'].includes(permission);
    callback(allowed);
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
