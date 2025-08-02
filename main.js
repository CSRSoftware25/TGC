const { app, BrowserWindow, ipcMain, Menu, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const isDev = process.argv.includes('--dev');

// Server process
let serverProcess = null;

let mainWindow;

// Start server function
function startServer() {
  return new Promise((resolve, reject) => {
    console.log('🚀 Starting Miyav Server...');
    
    // Check if .env file exists, if not create it
    const fs = require('fs');
    const envPath = path.join(__dirname, 'server', '.env');
    
    if (!fs.existsSync(envPath)) {
      console.log('📝 Creating .env file...');
      const envContent = `# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/miyav

# JWT Configuration
JWT_SECRET=miyav-super-secret-jwt-key-2025

# GitHub OAuth Configuration
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_CALLBACK_URL=http://localhost:3001/auth/github/callback

# Session Configuration
SESSION_SECRET=miyav-session-secret-key-2025

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# Rate Limiting
AUTH_RATE_LIMIT_WINDOW=900000
AUTH_RATE_LIMIT_MAX=5
MESSAGE_RATE_LIMIT_WINDOW=60000
MESSAGE_RATE_LIMIT_MAX=30
UPLOAD_RATE_LIMIT_WINDOW=60000
UPLOAD_RATE_LIMIT_MAX=5

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080

# Logging
LOG_LEVEL=info`;
      
      fs.writeFileSync(envPath, envContent);
      console.log('✅ .env file created');
    }

    // Start server process
    const serverPath = path.join(__dirname, 'server');
    serverProcess = spawn('node', ['server.js'], {
      cwd: serverPath,
      stdio: 'pipe'
    });

    // Handle server output
    serverProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log('📡 Server:', output.trim());
      
      // Check if server is ready
      if (output.includes('Miyav Server running on port 3001')) {
        console.log('✅ Server started successfully');
        resolve();
      }
    });

    serverProcess.stderr.on('data', (data) => {
      const error = data.toString();
      console.error('❌ Server Error:', error.trim());
      
      // Check for common errors
      if (error.includes('EADDRINUSE')) {
        console.log('⚠️  Port 3001 is already in use, server might already be running');
        resolve();
      } else if (error.includes('MODULE_NOT_FOUND')) {
        console.log('📦 Installing server dependencies...');
        const installProcess = spawn('npm', ['install'], { cwd: serverPath });
        installProcess.on('close', () => {
          console.log('✅ Dependencies installed, restarting server...');
          startServer().then(resolve).catch(reject);
        });
      }
    });

    serverProcess.on('error', (error) => {
      console.error('❌ Failed to start server:', error);
      reject(error);
    });

    serverProcess.on('close', (code) => {
      if (code !== 0) {
        console.error(`❌ Server process exited with code ${code}`);
      }
    });

    // Timeout after 10 seconds
    setTimeout(() => {
      console.log('⚠️  Server startup timeout, continuing...');
      resolve();
    }, 10000);
  });
}

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

app.whenReady().then(async () => {
  try {
    // Start server first
    await startServer();
    console.log('🎉 Miyav application ready!');
  } catch (error) {
    console.error('❌ Failed to start server:', error);
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // Kill server process when app closes
  if (serverProcess) {
    console.log('🛑 Stopping server...');
    serverProcess.kill();
  }
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle app quit
app.on('before-quit', () => {
  if (serverProcess) {
    console.log('🛑 Stopping server...');
    serverProcess.kill();
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