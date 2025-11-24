const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

// Global reference
let mainWindow;

function createWindow() {
  console.log('--- Creating Window ---');
  
  // 1. Resolve paths
  const preloadPath = path.join(__dirname, 'preload.js');
  const indexPath = path.join(__dirname, '../renderer/index.html');
  
  // 2. Resolve Icon Path (Adjusts based on OS)
  // We go up two levels (../../) from src/main/ to get to root
  const iconPath = process.platform === 'win32'
    ? path.join(__dirname, '../../build-resources/icon.ico')
    : path.join(__dirname, '../../build-resources/icon.png');

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: '#1e1e1e',
    title: "Graphics Editor",
    icon: iconPath, // <--- THIS ADDS THE ICON TO THE WINDOW/TASKBAR
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  mainWindow.loadFile(indexPath).catch(err => console.error('Failed load:', err));
  
  // mainWindow.webContents.openDevTools(); // Uncomment to debug

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
  if (process.platform !== 'darwin') app.quit();
});
