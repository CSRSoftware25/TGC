const { app, BrowserWindow, ipcMain, Menu, dialog } = require('electron');
const path = require('path');
const isDev = process.argv.includes('--dev');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    },
    icon: path.join(__dirname, 'assets/miyavlogooriginal.png'),
    titleBarStyle: 'default',
    title: 'Miyav - CSR Software',
    show: false
  });

  mainWindow.loadFile('index.html');

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

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

// IPC handlers
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('show-error-dialog', async (event, title, content) => {
  const result = await dialog.showErrorBox(title, content);
  return result;
});

ipcMain.handle('show-save-dialog', async (event, options) => {
  const result = await dialog.showSaveDialog(mainWindow, options);
  return result;
});

// Test handlers for debugging auth
ipcMain.handle('create-test-user', async () => {
  if (mainWindow && mainWindow.webContents) {
    return await mainWindow.webContents.executeJavaScript(`
      if (window.authManager) {
        window.authManager.createTestUser();
        return 'Test user created';
      } else {
        return 'AuthManager not found';
      }
    `);
  }
  return 'Window not ready';
});

ipcMain.handle('test-login', async (event, username, password) => {
  if (mainWindow && mainWindow.webContents) {
    return await mainWindow.webContents.executeJavaScript(`
      if (window.authManager) {
        return window.authManager.testLogin('${username}', '${password}');
      } else {
        return false;
      }
    `);
  }
  return false;
});

ipcMain.handle('get-users', async () => {
  if (mainWindow && mainWindow.webContents) {
    return await mainWindow.webContents.executeJavaScript(`
      if (window.authManager) {
        return JSON.stringify(window.authManager.getUsers());
      } else {
        return '[]';
      }
    `);
  }
  return '[]';
});

// Menu setup
const template = [
  {
    label: 'Miyav',
    submenu: [
      {
        label: 'Ayarlar',
        accelerator: 'CmdOrCtrl+,',
        click: () => {
          mainWindow.webContents.send('open-settings');
        }
      },
      { type: 'separator' },
      {
        label: 'Çıkış',
        accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
        click: () => {
          app.quit();
        }
      }
    ]
  },
  {
    label: 'Görünüm',
    submenu: [
      { role: 'resetZoom' },
      { role: 'zoomIn' },
      { role: 'zoomOut' },
      { type: 'separator' },
      { role: 'togglefullscreen' }
    ]
  },
  {
    label: 'Yardım',
    submenu: [
      {
        label: 'Hakkında Miyav',
        click: () => {
          mainWindow.webContents.send('show-about');
        }
      }
    ]
  }
];

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu); 