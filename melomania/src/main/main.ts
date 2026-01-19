import { app, BrowserWindow, ipcMain, screen, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

let hostWindow: BrowserWindow | null = null;
let publicWindow: BrowserWindow | null = null;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// Отключаем security warning в dev mode (появится только в production если CSP неправильный)
if (isDev) {
  process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';
}

function createHostWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  
  hostWindow = new BrowserWindow({
    width: Math.min(1400, width),
    height: Math.min(900, height),
    title: 'МелоМания — Ведущий',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false, // Разрешаем доступ к file:// для локальных медиа
      preload: path.join(__dirname, 'preload.js')
    }
  });

  if (isDev) {
    hostWindow.loadURL('http://localhost:3000?mode=host');
    hostWindow.webContents.openDevTools();
  } else {
    hostWindow.loadFile(path.join(__dirname, '../renderer/index.html'), { 
      query: { mode: 'host' } 
    });
  }

  hostWindow.on('closed', () => {
    hostWindow = null;
    if (publicWindow) {
      publicWindow.close();
    }
  });
}

function createPublicWindow() {
  const displays = screen.getAllDisplays();
  const externalDisplay = displays.find(d => d.bounds.x !== 0 || d.bounds.y !== 0);
  
  const targetDisplay = externalDisplay || displays[0];
  
  publicWindow = new BrowserWindow({
    x: targetDisplay.bounds.x,
    y: targetDisplay.bounds.y,
    width: targetDisplay.bounds.width,
    height: targetDisplay.bounds.height,
    fullscreen: !!externalDisplay,
    title: 'МелоМания — Игра',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false, // Разрешаем доступ к file:// для локальных медиа
      preload: path.join(__dirname, 'preload.js')
    }
  });

  if (isDev) {
    publicWindow.loadURL('http://localhost:3000?mode=public');
  } else {
    publicWindow.loadFile(path.join(__dirname, '../renderer/index.html'), { 
      query: { mode: 'public' } 
    });
  }

  publicWindow.on('closed', () => {
    publicWindow = null;
  });
}

// IPC: Синхронизация состояния между окнами
ipcMain.on('sync-state', (event, state) => {
  if (publicWindow && !publicWindow.isDestroyed()) {
    publicWindow.webContents.send('state-update', state);
  }
});

// IPC: Открыть публичное окно
ipcMain.on('open-public-window', () => {
  if (!publicWindow) {
    createPublicWindow();
  } else {
    publicWindow.focus();
  }
});

// IPC: Закрыть публичное окно
ipcMain.on('close-public-window', () => {
  if (publicWindow) {
    publicWindow.close();
  }
});

// IPC: Переключить полноэкранный режим публичного окна
ipcMain.on('toggle-public-fullscreen', () => {
  if (publicWindow) {
    publicWindow.setFullScreen(!publicWindow.isFullScreen());
  }
});

// IPC: Получить путь приложения
ipcMain.handle('get-app-path', () => {
  return isDev ? process.cwd() : app.getAppPath();
});

// IPC: Сканировать папку с аудио файлами
ipcMain.handle('scan-audio-folder', async (_event, folder: string) => {
  try {
    const basePath = isDev ? process.cwd() : app.getAppPath();
    const fullPath = path.join(basePath, 'assets', folder);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`[Audio] Folder not found: ${fullPath}`);
      return [];
    }

    const files = fs.readdirSync(fullPath);
    const audioFiles = files.filter(f => 
      f.endsWith('.mp3') || f.endsWith('.wav') || f.endsWith('.ogg') || f.endsWith('.m4a')
    );

    console.log(`[Audio] Found ${audioFiles.length} files in ${folder}:`, audioFiles);
    
    // Возвращаем полные пути для загрузки
    return audioFiles.map(f => ({
      name: f.replace(/\.(mp3|wav|ogg|m4a)$/i, ''),
      path: `./assets/${folder}/${encodeURIComponent(f)}`,
      originalPath: `./assets/${folder}/${f}`,
    }));
  } catch (error) {
    console.error('[Audio] Scan error:', error);
    return [];
  }
});

// IPC: Выбор папки через диалог
ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
    title: 'Выберите папку с музыкой',
  });
  
  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }
  
  return result.filePaths[0];
});

// IPC: Сканировать кастомную папку
ipcMain.handle('scan-custom-folder', async (_event, folderPath: string) => {
  try {
    if (!fs.existsSync(folderPath)) {
      console.log(`[Audio] Custom folder not found: ${folderPath}`);
      return [];
    }

    const files = fs.readdirSync(folderPath);
    const audioFiles = files.filter(f => 
      f.endsWith('.mp3') || f.endsWith('.wav') || f.endsWith('.ogg') || f.endsWith('.m4a')
    );

    console.log(`[Audio] Found ${audioFiles.length} files in custom folder:`, audioFiles);
    
    return audioFiles.map(f => ({
      name: f.replace(/\.(mp3|wav|ogg|m4a)$/i, ''),
      path: `file://${path.join(folderPath, f)}`,
      originalPath: path.join(folderPath, f),
    }));
  } catch (error) {
    console.error('[Audio] Custom scan error:', error);
    return [];
  }
});

// IPC: Выбор одного аудио файла
ipcMain.handle('select-audio-file', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    title: 'Выберите звуковой файл',
    filters: [
      { name: 'Audio Files', extensions: ['mp3', 'wav', 'ogg', 'm4a'] },
    ],
  });
  
  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }
  
  const filePath = result.filePaths[0];
  const fileName = path.basename(filePath).replace(/\.(mp3|wav|ogg|m4a)$/i, '');
  
  return {
    name: fileName,
    path: `file://${filePath}`,
    originalPath: filePath,
  };
});

app.whenReady().then(() => {
  createHostWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (hostWindow === null) {
    createHostWindow();
  }
});
