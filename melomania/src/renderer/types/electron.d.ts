export interface AudioFileInfo {
  name: string;
  path: string;
  originalPath: string;
}

export interface ElectronAPI {
  syncState: (state: unknown) => void;
  onStateUpdate: (callback: (state: unknown) => void) => void;
  openPublicWindow: () => void;
  closePublicWindow: () => void;
  togglePublicFullscreen: () => void;
  // Аудио
  scanAudioFolder: (folder: string) => Promise<AudioFileInfo[]>;
  getAppPath: () => Promise<string>;
  selectFolder: () => Promise<string | null>;
  scanCustomFolder: (folderPath: string) => Promise<AudioFileInfo[]>;
  selectAudioFile: () => Promise<AudioFileInfo | null>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
