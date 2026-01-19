import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  syncState: (state: unknown) => ipcRenderer.send('sync-state', state),
  
  onStateUpdate: (callback: (state: unknown) => void) => {
    ipcRenderer.on('state-update', (_event, state) => callback(state));
  },
  
  openPublicWindow: () => ipcRenderer.send('open-public-window'),
  closePublicWindow: () => ipcRenderer.send('close-public-window'),
  togglePublicFullscreen: () => ipcRenderer.send('toggle-public-fullscreen'),

  // Аудио файлы
  scanAudioFolder: (folder: string) => ipcRenderer.invoke('scan-audio-folder', folder),
  getAppPath: () => ipcRenderer.invoke('get-app-path'),
  
  // Выбор папки через диалог
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  scanCustomFolder: (folderPath: string) => ipcRenderer.invoke('scan-custom-folder', folderPath),
  
  // Выбор одного аудио файла
  selectAudioFile: () => ipcRenderer.invoke('select-audio-file'),
});
