const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

// Global reference to prevent garbage collection
let mainWindow;

function createWindow() {
  console.log('--- Creating Window ---');
  
  // 1. Resolve paths strictly
  const preloadPath = path.join(__dirname, 'preload.js');
  const indexPath = path.join(__dirname, '../renderer/index.html');

  console.log('Preload Path:', preloadPath);
  console.log('Index Path:', indexPath);

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: '#1e1e1e',
    webPreferences: {
      preload: preloadPath, // Make sure this file exists!
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false // Temporarily disable sandbox for easier debugging
    }
  });

  // 2. Load the file and catch errors
  mainWindow.loadFile(indexPath).catch(err => {
      console.error('FAILED TO LOAD INDEX.HTML:', err);
  });
  
  // 3. Open DevTools immediately so you can see renderer errors
  mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    console.log('--- Quitting App ---');
    app.quit();
  }
});