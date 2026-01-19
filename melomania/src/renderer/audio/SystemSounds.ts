/**
 * SystemSounds - Модуль управления системными звуками
 * 
 * Категории звуков:
 * - timer: Фоновая музыка во время таймера
 * - break: Музыка перерыва
 * - blanks: Музыка во время сбора бланков
 * - correct: Звук правильного ответа
 * - wrong: Звук неправильного ответа
 * - roundStart: Звук начала раунда
 * - gameEnd: Звук окончания игры
 * - tick: Тиканье таймера (последние секунды)
 */

import { Howl, Howler } from 'howler';

// Типы звуков
export type SoundCategory = 'timer' | 'break' | 'blanks' | 'intro' | 'ambient' | 'correct' | 'wrong' | 'roundStart' | 'gameEnd' | 'tick';

interface SoundTrack {
  howl: Howl;
  name: string;
  path: string;
  duration: number;
}

interface CategoryConfig {
  folder: string;
  loop: boolean;
  volume: number;
}

const CATEGORY_CONFIG: Record<SoundCategory, CategoryConfig> = {
  timer: { folder: 'timer-music', loop: true, volume: 0.4 },
  break: { folder: 'break-music', loop: true, volume: 0.3 },
  blanks: { folder: 'blanks-music', loop: true, volume: 0.3 },
  intro: { folder: 'intro-music', loop: true, volume: 0.3 },
  ambient: { folder: 'ambient-music', loop: true, volume: 0.25 },
  correct: { folder: 'sfx', loop: false, volume: 0.7 },
  wrong: { folder: 'sfx', loop: false, volume: 0.7 },
  roundStart: { folder: 'sfx', loop: false, volume: 0.8 },
  gameEnd: { folder: 'sfx', loop: false, volume: 0.8 },
  tick: { folder: 'sfx', loop: false, volume: 0.6 },
};

class SystemSoundsManager {
  private tracks: Map<SoundCategory, SoundTrack[]> = new Map();
  private currentPlaying: Map<SoundCategory, Howl | null> = new Map();
  private volumes: Map<SoundCategory, number> = new Map();
  private masterVolume = 1.0;
  private isInitialized = false;
  private selectedTracks: Map<SoundCategory, number> = new Map(); // Индекс выбранного трека

  // Сгенерированные звуки (если файлы не найдены)
  private generatedSounds: Map<string, Howl> = new Map();
  
  // Кастомные SFX звуки (загруженные пользователем)
  private customSfx: Map<SoundCategory, Howl | null> = new Map();

  async init(): Promise<void> {
    if (this.isInitialized) return;

    Howler.autoUnlock = true;

    // Инициализируем громкости по умолчанию
    Object.entries(CATEGORY_CONFIG).forEach(([cat, config]) => {
      this.volumes.set(cat as SoundCategory, config.volume);
      this.currentPlaying.set(cat as SoundCategory, null);
      this.selectedTracks.set(cat as SoundCategory, 0);
    });

    // Загружаем звуки
    await this.scanAndLoadAll();

    // Генерируем базовые звуки если нет файлов
    this.generateDefaultSounds();

    this.isInitialized = true;
    console.log('[SystemSounds] Initialized');
  }

  // Сканируем и загружаем все звуки
  private async scanAndLoadAll(): Promise<void> {
    const categories: Array<{ cat: SoundCategory; folder: string }> = [
      { cat: 'timer', folder: 'timer-music' },
      { cat: 'break', folder: 'break-music' },
    ];
    
    for (const { cat, folder } of categories) {
      const config = CATEGORY_CONFIG[cat];
      const tracks = await this.scanFolderViaIPC(folder, config.loop);
      this.tracks.set(cat, tracks);
      console.log(`[SystemSounds] ${cat}: loaded ${tracks.length} tracks`);
    }
  }

  // Сканируем папку через IPC (Electron)
  private async scanFolderViaIPC(folder: string, loop: boolean): Promise<SoundTrack[]> {
    const tracks: SoundTrack[] = [];

    try {
      // Используем Electron IPC для сканирования
      const electronAPI = (window as any).electronAPI;
      if (electronAPI?.scanAudioFolder) {
        const files = await electronAPI.scanAudioFolder(folder);
        
        if (files && files.length > 0) {
          console.log(`[SystemSounds] Found files in ${folder}:`, files);
          
          for (const file of files) {
            // Пробуем загрузить с encoded путём, потом с оригинальным
            let track = await this.loadTrack(file.path, file.name, loop);
            if (!track) {
              track = await this.loadTrack(file.originalPath, file.name, loop);
            }
            if (track) {
              tracks.push(track);
            }
          }
          return tracks;
        }
      }
    } catch (e) {
      console.log('[SystemSounds] IPC scan failed, using fallback:', e);
    }

    // Fallback: пробуем загрузить известные паттерны имён
    return this.scanFolderFallback(folder, loop);
  }

  // Fallback сканирование (без IPC)
  private async scanFolderFallback(folder: string, loop: boolean): Promise<SoundTrack[]> {
    const tracks: SoundTrack[] = [];
    const basePath = `./assets/${folder}`;

    const knownPatterns = [
      // Русские названия (как у пользователя) - с URL encoding
      encodeURIComponent('БИГ КВИЗ - Фон для раунда весёлый.mp3'),
      encodeURIComponent('БИГ КВИЗ - Фон для раунда игривый.mp3'),
      encodeURIComponent('БИГ КВИЗ - Фон для раунда размеренный.mp3'),
      encodeURIComponent('БИГ КВИЗ - Фон для раунда серьезный.mp3'),
      encodeURIComponent('БИГ КВИЗ - Фон для раунда спокойный.mp3'),
      // Английские паттерны
      'music_1.mp3', 'music_2.mp3', 'music_3.mp3', 'music_4.mp3', 'music_5.mp3',
      'track_1.mp3', 'track_2.mp3', 'track_3.mp3',
      'timer_1.mp3', 'timer_2.mp3', 'timer_3.mp3',
      'background_1.mp3', 'background_2.mp3', 'background_3.mp3',
      'break_1.mp3', 'break_2.mp3', 'break_3.mp3',
      'thinking.mp3', 'countdown.mp3', 'quiz.mp3',
    ];

    const loadPromises = knownPatterns.map(async (file) => {
      const filePath = `${basePath}/${file}`;
      const name = decodeURIComponent(file).replace(/\.(mp3|wav|ogg)$/i, '');
      return this.loadTrack(filePath, name, loop);
    });

    const results = await Promise.allSettled(loadPromises);
    results.forEach((result) => {
      if (result.status === 'fulfilled' && result.value) {
        tracks.push(result.value);
      }
    });

    return tracks;
  }

  // Загрузка одного трека
  private loadTrack(path: string, name: string, loop: boolean): Promise<SoundTrack | null> {
    return new Promise((resolve) => {
      const howl = new Howl({
        src: [path],
        loop,
        preload: true,
        onload: () => {
          resolve({
            howl,
            name: name.replace(/\.(mp3|wav|ogg)$/i, ''),
            path,
            duration: howl.duration(),
          });
        },
        onloaderror: () => {
          resolve(null);
        },
      });
    });
  }

  // Генерируем базовые звуки программно
  private generateDefaultSounds(): void {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;

    // Звук правильного ответа (приятный аккорд)
    this.generatedSounds.set('correct', this.createToneSound([523, 659, 784], 0.3, 'correct'));
    
    // Звук неправильного ответа (низкий тон)
    this.generatedSounds.set('wrong', this.createToneSound([200, 180], 0.4, 'wrong'));
    
    // Тик таймера
    this.generatedSounds.set('tick', this.createToneSound([880], 0.08, 'tick'));
    
    // Старт раунда (фанфары)
    this.generatedSounds.set('roundStart', this.createToneSound([392, 523, 659, 784], 0.5, 'fanfare'));
    
    // Конец игры
    this.generatedSounds.set('gameEnd', this.createToneSound([784, 659, 523, 392, 523, 784], 0.8, 'ending'));

    console.log('[SystemSounds] Generated default sounds');
  }

  // Создание тонального звука
  private createToneSound(frequencies: number[], duration: number, type: string): Howl {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const sampleRate = ctx.sampleRate;
    const frames = Math.floor(sampleRate * duration);
    const buffer = ctx.createBuffer(1, frames, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < frames; i++) {
      const t = i / sampleRate;
      let sample = 0;

      frequencies.forEach((freq, idx) => {
        const delay = idx * 0.05; // Небольшая задержка между нотами
        if (t >= delay) {
          const localT = t - delay;
          const envelope = Math.exp(-localT * (type === 'tick' ? 30 : 5));
          sample += Math.sin(2 * Math.PI * freq * localT) * envelope;
        }
      });

      data[i] = (sample / frequencies.length) * 0.5;
    }

    const wavBlob = this.bufferToWav(buffer);
    const wavUrl = URL.createObjectURL(wavBlob);
    ctx.close();

    return new Howl({
      src: [wavUrl],
      format: ['wav'],
      volume: 0.7,
      preload: true,
    });
  }

  // Конвертация AudioBuffer в WAV
  private bufferToWav(buffer: AudioBuffer): Blob {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1;
    const bitDepth = 16;

    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;
    const dataLength = buffer.length * blockAlign;
    const bufferLength = 44 + dataLength;

    const arrayBuffer = new ArrayBuffer(bufferLength);
    const view = new DataView(arrayBuffer);

    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, bufferLength - 8, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(36, 'data');
    view.setUint32(40, dataLength, true);

    const channelData = buffer.getChannelData(0);
    let offset = 44;
    for (let i = 0; i < buffer.length; i++) {
      const sample = Math.max(-1, Math.min(1, channelData[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }

  // ==================== PUBLIC API ====================

  // Воспроизвести звук категории
  play(category: SoundCategory, trackIndex?: number): void {
    // Для SFX используем кастомные или сгенерированные звуки
    if (['correct', 'wrong', 'tick', 'roundStart', 'gameEnd'].includes(category)) {
      // Сначала проверяем кастомный SFX
      const customSound = this.customSfx.get(category);
      if (customSound) {
        customSound.volume(this.getVolume(category) * this.masterVolume);
        customSound.play();
        return;
      }
      
      // Если нет кастомного - используем сгенерированный
      const sound = this.generatedSounds.get(category);
      if (sound) {
        sound.volume(this.getVolume(category) * this.masterVolume);
        sound.play();
      }
      return;
    }

    // Для музыки
    const tracks = this.tracks.get(category);
    if (!tracks || tracks.length === 0) {
      console.log(`[SystemSounds] No tracks for ${category}`);
      return;
    }

    // Остановить текущий если играет
    this.stop(category);

    // Выбираем трек
    const idx = trackIndex ?? this.selectedTracks.get(category) ?? 0;
    const track = tracks[idx % tracks.length];

    track.howl.volume(this.getVolume(category) * this.masterVolume);
    track.howl.play();
    this.currentPlaying.set(category, track.howl);

    console.log(`[SystemSounds] Playing ${category}: ${track.name}`);
  }

  // Воспроизвести случайный трек
  playRandom(category: SoundCategory): void {
    const tracks = this.tracks.get(category);
    if (!tracks || tracks.length === 0) return;

    const randomIdx = Math.floor(Math.random() * tracks.length);
    this.play(category, randomIdx);
  }

  // Воспроизвести следующий трек (для смены на каждый вопрос)
  playNext(category: SoundCategory, shuffle: boolean = false): void {
    const tracks = this.tracks.get(category);
    if (!tracks || tracks.length === 0) return;

    // Остановить текущий
    this.stop(category);

    let nextIdx: number;
    if (shuffle) {
      // Случайный трек
      nextIdx = Math.floor(Math.random() * tracks.length);
    } else {
      // Следующий по порядку
      const currentIdx = this.selectedTracks.get(category) ?? 0;
      nextIdx = (currentIdx + 1) % tracks.length;
    }

    this.selectedTracks.set(category, nextIdx);
    this.play(category, nextIdx);
  }

  // Остановить звук категории
  stop(category: SoundCategory): void {
    const current = this.currentPlaying.get(category);
    if (current) {
      current.stop();
      this.currentPlaying.set(category, null);
    }
  }

  // Остановить все звуки
  stopAll(): void {
    this.currentPlaying.forEach((howl, category) => {
      if (howl) {
        howl.stop();
        this.currentPlaying.set(category, null);
      }
    });
  }

  // Пауза
  pause(category: SoundCategory): void {
    const current = this.currentPlaying.get(category);
    if (current) current.pause();
  }

  // Продолжить
  resume(category: SoundCategory): void {
    const current = this.currentPlaying.get(category);
    if (current) current.play();
  }

  // Плавное затухание
  fadeOut(category: SoundCategory, duration: number = 1000): void {
    const current = this.currentPlaying.get(category);
    if (current) {
      const vol = this.getVolume(category) * this.masterVolume;
      current.fade(vol, 0, duration);
      setTimeout(() => this.stop(category), duration);
    }
  }

  // Плавное нарастание
  fadeIn(category: SoundCategory, duration: number = 1000): void {
    const tracks = this.tracks.get(category);
    if (!tracks || tracks.length === 0) return;

    const idx = this.selectedTracks.get(category) ?? 0;
    const track = tracks[idx % tracks.length];
    const vol = this.getVolume(category) * this.masterVolume;

    track.howl.volume(0);
    track.howl.play();
    track.howl.fade(0, vol, duration);
    this.currentPlaying.set(category, track.howl);
  }

  // Установить громкость категории (0-1)
  setVolume(category: SoundCategory, volume: number): void {
    const vol = Math.max(0, Math.min(1, volume));
    this.volumes.set(category, vol);

    const current = this.currentPlaying.get(category);
    if (current) {
      current.volume(vol * this.masterVolume);
    }
  }

  // Получить громкость категории
  getVolume(category: SoundCategory): number {
    return this.volumes.get(category) ?? CATEGORY_CONFIG[category]?.volume ?? 0.5;
  }

  // Установить мастер-громкость
  setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    
    // Обновляем громкость всех играющих
    this.currentPlaying.forEach((howl, category) => {
      if (howl) {
        howl.volume(this.getVolume(category) * this.masterVolume);
      }
    });
  }

  getMasterVolume(): number {
    return this.masterVolume;
  }

  // Выбрать трек для категории
  selectTrack(category: SoundCategory, index: number): void {
    this.selectedTracks.set(category, index);
  }

  // Получить список треков категории
  getTracks(category: SoundCategory): { name: string; path: string; duration: number }[] {
    const tracks = this.tracks.get(category);
    if (!tracks) return [];
    return tracks.map(t => ({ name: t.name, path: t.path, duration: t.duration }));
  }

  // Получить индекс выбранного трека
  getSelectedTrack(category: SoundCategory): number {
    return this.selectedTracks.get(category) ?? 0;
  }

  // Проверить наличие треков
  hasTracksFor(category: SoundCategory): boolean {
    const tracks = this.tracks.get(category);
    return (tracks?.length ?? 0) > 0;
  }

  // Проверить играет ли что-то
  isPlaying(category: SoundCategory): boolean {
    const current = this.currentPlaying.get(category);
    return current?.playing() ?? false;
  }

  // Добавить кастомный трек из файла
  async addCustomTrack(category: SoundCategory, filePath: string): Promise<boolean> {
    const config = CATEGORY_CONFIG[category];
    const name = filePath.split('/').pop() || 'custom';
    
    const track = await this.loadTrack(filePath, name, config.loop);
    if (track) {
      const tracks = this.tracks.get(category) || [];
      tracks.push(track);
      this.tracks.set(category, tracks);
      return true;
    }
    return false;
  }

  // Очистить треки категории и загрузить новые из списка файлов
  async replaceTracksFromFiles(category: SoundCategory, files: { name: string; path: string }[]): Promise<void> {
    // Останавливаем текущий звук
    this.stop(category);
    
    // Выгружаем старые треки
    const oldTracks = this.tracks.get(category) || [];
    oldTracks.forEach(t => t.howl.unload());
    
    // Загружаем новые
    const config = CATEGORY_CONFIG[category];
    const newTracks: SoundTrack[] = [];
    
    for (const file of files) {
      const track = await this.loadTrack(file.path, file.name, config.loop);
      if (track) {
        newTracks.push(track);
      }
    }
    
    this.tracks.set(category, newTracks);
    this.selectedTracks.set(category, 0);
    console.log(`[SystemSounds] Replaced ${category} tracks: ${newTracks.length} loaded`);
  }

  // Загрузить кастомный SFX из файла
  async loadCustomSfx(category: SoundCategory, filePath: string): Promise<boolean> {
    return new Promise((resolve) => {
      // Выгружаем предыдущий кастомный SFX
      const existing = this.customSfx.get(category);
      if (existing) {
        existing.unload();
      }

      const howl = new Howl({
        src: [filePath],
        loop: false,
        preload: true,
        onload: () => {
          this.customSfx.set(category, howl);
          console.log(`[SystemSounds] Loaded custom SFX for ${category}: ${filePath}`);
          resolve(true);
        },
        onloaderror: () => {
          console.error(`[SystemSounds] Failed to load custom SFX: ${filePath}`);
          resolve(false);
        },
      });
    });
  }

  // Удалить кастомный SFX (вернуться к сгенерированному)
  clearCustomSfx(category: SoundCategory): void {
    const existing = this.customSfx.get(category);
    if (existing) {
      existing.unload();
      this.customSfx.delete(category);
      console.log(`[SystemSounds] Cleared custom SFX for ${category}`);
    }
  }

  // Проверить есть ли кастомный SFX
  hasCustomSfx(category: SoundCategory): boolean {
    return this.customSfx.has(category);
  }

  // Перезагрузить все треки
  async reload(): Promise<void> {
    this.stopAll();
    this.tracks.clear();
    await this.scanAndLoadAll();
  }

  // Освободить ресурсы
  destroy(): void {
    this.stopAll();
    this.tracks.forEach(tracks => tracks.forEach(t => t.howl.unload()));
    this.tracks.clear();
    this.generatedSounds.forEach(s => s.unload());
    this.generatedSounds.clear();
    this.isInitialized = false;
  }
}

// Singleton
export const systemSounds = new SystemSoundsManager();
export default systemSounds;
