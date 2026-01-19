/**
 * SoundSettings - Расширенные настройки системных звуков
 * 
 * Возможности:
 * - Выбор кастомной папки для музыки
 * - Мультивыбор треков (чекбоксы) + "выбрать все"
 * - Режим воспроизведения: случайный / по порядку
 * - Кастомные SFX с возможностью отключения
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { systemSounds, SoundCategory } from '../../../audio/SystemSounds';

interface TrackInfo {
  name: string;
  path: string;
  duration: number;
}

interface SoundConfig {
  enabled: boolean;
  tracks: TrackInfo[];
  selectedTracks: Set<number>;
  volume: number;
  shuffle: boolean;
  customFolder: string | null;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  colors: {
    background: string;
    backgroundSecondary: string;
    text: string;
    textMuted: string;
    accent: string;
    border: string;
  };
}

// Ключ для localStorage
const STORAGE_KEY = 'melomania_sound_settings';

const SoundSettings: React.FC<Props> = ({ isOpen, onClose, colors }) => {
  // Конфигурации для каждой категории
  const [timerConfig, setTimerConfig] = useState<SoundConfig>({
    enabled: true,
    tracks: [],
    selectedTracks: new Set(),
    volume: 0.4,
    shuffle: true,
    customFolder: null,
  });

  const [breakConfig, setBreakConfig] = useState<SoundConfig>({
    enabled: true,
    tracks: [],
    selectedTracks: new Set(),
    volume: 0.3,
    shuffle: true,
    customFolder: null,
  });

  const [blanksConfig, setBlanksConfig] = useState<SoundConfig>({
    enabled: true,
    tracks: [],
    selectedTracks: new Set(),
    volume: 0.3,
    shuffle: true,
    customFolder: null,
  });

  const [introConfig, setIntroConfig] = useState<SoundConfig>({
    enabled: true,
    tracks: [],
    selectedTracks: new Set(),
    volume: 0.3,
    shuffle: true,
    customFolder: null,
  });

  const [ambientConfig, setAmbientConfig] = useState<SoundConfig>({
    enabled: true,
    tracks: [],
    selectedTracks: new Set(),
    volume: 0.25,
    shuffle: true,
    customFolder: null,
  });

  // SFX настройки
  const [sfxConfig, setSfxConfig] = useState({
    enabled: true,
    volume: 0.7,
    tick: true,
    correct: true,
    wrong: true,
    roundStart: true,
    gameEnd: true,
  });
  
  // Кастомные SFX пути
  const [customSfxPaths, setCustomSfxPaths] = useState<Record<string, string | null>>({
    tick: null,
    correct: null,
    roundStart: null,
    gameEnd: null,
  });

  const [masterVolume, setMasterVolume] = useState(1.0);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'timer' | 'break' | 'blanks' | 'intro' | 'ambient' | 'sfx'>('timer');

  // Загрузка при открытии
  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  // Сохранение настроек
  const saveSettings = () => {
    const settings = {
      timer: {
        enabled: timerConfig.enabled,
        selectedTracks: Array.from(timerConfig.selectedTracks),
        volume: timerConfig.volume,
        shuffle: timerConfig.shuffle,
        customFolder: timerConfig.customFolder,
      },
      break: {
        enabled: breakConfig.enabled,
        selectedTracks: Array.from(breakConfig.selectedTracks),
        volume: breakConfig.volume,
        shuffle: breakConfig.shuffle,
        customFolder: breakConfig.customFolder,
      },
      blanks: {
        enabled: blanksConfig.enabled,
        selectedTracks: Array.from(blanksConfig.selectedTracks),
        volume: blanksConfig.volume,
        shuffle: blanksConfig.shuffle,
        customFolder: blanksConfig.customFolder,
      },
      intro: {
        enabled: introConfig.enabled,
        selectedTracks: Array.from(introConfig.selectedTracks),
        volume: introConfig.volume,
        shuffle: introConfig.shuffle,
        customFolder: introConfig.customFolder,
      },
      ambient: {
        enabled: ambientConfig.enabled,
        selectedTracks: Array.from(ambientConfig.selectedTracks),
        volume: ambientConfig.volume,
        shuffle: ambientConfig.shuffle,
        customFolder: ambientConfig.customFolder,
      },
      sfx: sfxConfig,
      customSfxPaths,
      masterVolume,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  };

  // Загрузка настроек
  const loadSettings = async () => {
    setIsLoading(true);
    await systemSounds.init();

    // Загружаем сохранённые настройки
    const savedStr = localStorage.getItem(STORAGE_KEY);
    const saved = savedStr ? JSON.parse(savedStr) : null;

    // Если есть кастомные папки - загружаем треки из них
    const electronAPI = (window as any).electronAPI;
    
    // Загрузка треков для timer
    if (saved?.timer?.customFolder && electronAPI?.scanCustomFolder) {
      try {
        const files = await electronAPI.scanCustomFolder(saved.timer.customFolder);
        if (files && files.length > 0) {
          await systemSounds.replaceTracksFromFiles('timer', files);
        }
      } catch (e) {
        console.error('Failed to load timer custom folder:', e);
      }
    }

    // Загрузка треков для break
    if (saved?.break?.customFolder && electronAPI?.scanCustomFolder) {
      try {
        const files = await electronAPI.scanCustomFolder(saved.break.customFolder);
        if (files && files.length > 0) {
          await systemSounds.replaceTracksFromFiles('break', files);
        }
      } catch (e) {
        console.error('Failed to load break custom folder:', e);
      }
    }

    // Загрузка треков для blanks (сбор бланков)
    if (saved?.blanks?.customFolder && electronAPI?.scanCustomFolder) {
      try {
        const files = await electronAPI.scanCustomFolder(saved.blanks.customFolder);
        if (files && files.length > 0) {
          await systemSounds.replaceTracksFromFiles('blanks', files);
        }
      } catch (e) {
        console.error('Failed to load blanks custom folder:', e);
      }
    }

    // Загрузка треков для intro (правила раунда)
    if (saved?.intro?.customFolder && electronAPI?.scanCustomFolder) {
      try {
        const files = await electronAPI.scanCustomFolder(saved.intro.customFolder);
        if (files && files.length > 0) {
          await systemSounds.replaceTracksFromFiles('intro', files);
        }
      } catch (e) {
        console.error('Failed to load intro custom folder:', e);
      }
    }

    // Загрузка треков для ambient (фоновая музыка)
    if (saved?.ambient?.customFolder && electronAPI?.scanCustomFolder) {
      try {
        const files = await electronAPI.scanCustomFolder(saved.ambient.customFolder);
        if (files && files.length > 0) {
          await systemSounds.replaceTracksFromFiles('ambient', files);
        }
      } catch (e) {
        console.error('Failed to load ambient custom folder:', e);
      }
    }

    // Загружаем треки
    const timerTracks = systemSounds.getTracks('timer');
    const breakTracks = systemSounds.getTracks('break');
    const blanksTracks = systemSounds.getTracks('blanks');
    const introTracks = systemSounds.getTracks('intro');
    const ambientTracks = systemSounds.getTracks('ambient');

    // Применяем сохранённые настройки или дефолты
    setTimerConfig(prev => ({
      ...prev,
      tracks: timerTracks,
      selectedTracks: saved?.timer?.selectedTracks 
        ? new Set(saved.timer.selectedTracks.filter((i: number) => i < timerTracks.length))
        : new Set(timerTracks.map((_, i) => i)), // По умолчанию все выбраны
      volume: saved?.timer?.volume ?? 0.4,
      shuffle: saved?.timer?.shuffle ?? true,
      customFolder: saved?.timer?.customFolder ?? null,
      enabled: saved?.timer?.enabled ?? true,
    }));

    setBreakConfig(prev => ({
      ...prev,
      tracks: breakTracks,
      selectedTracks: saved?.break?.selectedTracks 
        ? new Set(saved.break.selectedTracks.filter((i: number) => i < breakTracks.length))
        : new Set(breakTracks.map((_, i) => i)),
      volume: saved?.break?.volume ?? 0.3,
      shuffle: saved?.break?.shuffle ?? true,
      customFolder: saved?.break?.customFolder ?? null,
      enabled: saved?.break?.enabled ?? true,
    }));

    setBlanksConfig(prev => ({
      ...prev,
      tracks: blanksTracks,
      selectedTracks: saved?.blanks?.selectedTracks 
        ? new Set(saved.blanks.selectedTracks.filter((i: number) => i < blanksTracks.length))
        : new Set(blanksTracks.map((_, i) => i)),
      volume: saved?.blanks?.volume ?? 0.3,
      shuffle: saved?.blanks?.shuffle ?? true,
      customFolder: saved?.blanks?.customFolder ?? null,
      enabled: saved?.blanks?.enabled ?? true,
    }));

    setIntroConfig(prev => ({
      ...prev,
      tracks: introTracks,
      selectedTracks: saved?.intro?.selectedTracks 
        ? new Set(saved.intro.selectedTracks.filter((i: number) => i < introTracks.length))
        : new Set(introTracks.map((_, i) => i)),
      volume: saved?.intro?.volume ?? 0.3,
      shuffle: saved?.intro?.shuffle ?? true,
      customFolder: saved?.intro?.customFolder ?? null,
      enabled: saved?.intro?.enabled ?? true,
    }));

    setAmbientConfig(prev => ({
      ...prev,
      tracks: ambientTracks,
      selectedTracks: saved?.ambient?.selectedTracks 
        ? new Set(saved.ambient.selectedTracks.filter((i: number) => i < ambientTracks.length))
        : new Set(ambientTracks.map((_, i) => i)),
      volume: saved?.ambient?.volume ?? 0.25,
      shuffle: saved?.ambient?.shuffle ?? true,
      customFolder: saved?.ambient?.customFolder ?? null,
      enabled: saved?.ambient?.enabled ?? true,
    }));

    if (saved?.sfx) {
      setSfxConfig(saved.sfx);
    }
    
    // Загружаем кастомные SFX пути и звуки
    if (saved?.customSfxPaths) {
      setCustomSfxPaths(saved.customSfxPaths);
      // Загружаем кастомные SFX
      for (const [key, path] of Object.entries(saved.customSfxPaths)) {
        if (path) {
          await systemSounds.loadCustomSfx(key as SoundCategory, path as string);
        }
      }
    }

    setMasterVolume(saved?.masterVolume ?? 1.0);
    systemSounds.setMasterVolume(saved?.masterVolume ?? 1.0);

    setIsLoading(false);
  };

  // Выбор кастомной папки
  const handleSelectFolder = async (category: 'timer' | 'break' | 'blanks' | 'intro' | 'ambient') => {
    const electronAPI = (window as any).electronAPI;
    if (!electronAPI?.selectFolder) {
      alert('Выбор папки доступен только в Electron');
      return;
    }

    const folderPath = await electronAPI.selectFolder();
    if (!folderPath) return;

    // Сканируем папку
    const files = await electronAPI.scanCustomFolder(folderPath);
    if (!files || files.length === 0) {
      alert('В выбранной папке нет аудио файлов (MP3, WAV, OGG, M4A)');
      return;
    }

    // Заменяем треки (очищаем старые и загружаем новые)
    await systemSounds.replaceTracksFromFiles(category, files);

    // Получаем обновлённый список треков
    const updatedTracks = systemSounds.getTracks(category);
    
    // Обновляем конфиг
    const setters: Record<string, typeof setTimerConfig> = {
      timer: setTimerConfig,
      break: setBreakConfig,
      blanks: setBlanksConfig,
      intro: setIntroConfig,
      ambient: setAmbientConfig,
    };
    const setter = setters[category];
    setter(prev => ({
      ...prev,
      tracks: updatedTracks,
      selectedTracks: new Set(updatedTracks.map((_, i) => i)),
      customFolder: folderPath,
    }));
  };

  // Переключение трека
  const toggleTrack = (category: 'timer' | 'break' | 'blanks' | 'intro' | 'ambient', index: number) => {
    const setters: Record<string, typeof setTimerConfig> = {
      timer: setTimerConfig,
      break: setBreakConfig,
      blanks: setBlanksConfig,
      intro: setIntroConfig,
      ambient: setAmbientConfig,
    };
    const setter = setters[category];
    setter(prev => {
      const newSelected = new Set(prev.selectedTracks);
      if (newSelected.has(index)) {
        newSelected.delete(index);
      } else {
        newSelected.add(index);
      }
      return { ...prev, selectedTracks: newSelected };
    });
  };

  // Выбрать все / снять все
  const toggleAllTracks = (category: 'timer' | 'break' | 'blanks' | 'intro' | 'ambient', selectAll: boolean) => {
    const configs: Record<string, typeof timerConfig> = {
      timer: timerConfig,
      break: breakConfig,
      blanks: blanksConfig,
      intro: introConfig,
      ambient: ambientConfig,
    };
    const setters: Record<string, typeof setTimerConfig> = {
      timer: setTimerConfig,
      break: setBreakConfig,
      blanks: setBlanksConfig,
      intro: setIntroConfig,
      ambient: setAmbientConfig,
    };
    const config = configs[category];
    const setter = setters[category];
    
    setter(prev => ({
      ...prev,
      selectedTracks: selectAll 
        ? new Set(config.tracks.map((_, i) => i))
        : new Set(),
    }));
  };

  // Воспроизведение превью
  const handlePlayPreview = (category: SoundCategory) => {
    systemSounds.stop(category);
    systemSounds.play(category);
    setTimeout(() => systemSounds.fadeOut(category, 500), 5000);
  };

  // Тест SFX
  const handleTestSfx = (sfx: SoundCategory) => {
    systemSounds.play(sfx);
  };
  
  // Выбор кастомного SFX файла
  const handleSelectCustomSfx = async (sfxKey: string) => {
    const electronAPI = (window as any).electronAPI;
    if (!electronAPI?.selectAudioFile) {
      alert('Выбор файла доступен только в Electron');
      return;
    }

    const file = await electronAPI.selectAudioFile();
    if (!file) return;

    // Загружаем кастомный SFX
    const loaded = await systemSounds.loadCustomSfx(sfxKey as SoundCategory, file.path);
    if (loaded) {
      setCustomSfxPaths(prev => ({ ...prev, [sfxKey]: file.path }));
    } else {
      alert('Не удалось загрузить звуковой файл');
    }
  };

  // Сброс кастомного SFX
  const handleClearCustomSfx = (sfxKey: string) => {
    systemSounds.clearCustomSfx(sfxKey as SoundCategory);
    setCustomSfxPaths(prev => ({ ...prev, [sfxKey]: null }));
  };

  // Сохранение при закрытии
  const handleClose = () => {
    saveSettings();
    onClose();
  };

  // Форматирование времени
  const formatDuration = (seconds: number): string => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Стили
  const cardStyle: React.CSSProperties = {
    background: colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  };

  const btnStyle: React.CSSProperties = {
    padding: '8px 16px',
    borderRadius: 8,
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: 500,
    transition: 'all 0.15s ease',
  };

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '10px 20px',
    borderRadius: 8,
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: 600,
    background: active ? colors.accent : 'rgba(255,255,255,0.1)',
    color: active ? '#fff' : colors.textMuted,
    transition: 'all 0.2s ease',
  });

  // Кастомный чекбокс компонент
  const CustomCheckbox: React.FC<{ checked: boolean; onChange: (checked: boolean) => void; label?: string }> = ({ checked, onChange, label }) => (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
      <div
        onClick={() => onChange(!checked)}
        style={{
          width: 20,
          height: 20,
          borderRadius: 4,
          border: `2px solid ${checked ? colors.accent : colors.textMuted}`,
          background: checked ? colors.accent : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          flexShrink: 0,
        }}
      >
        {checked && (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 6L5 9L10 3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>
      {label && <span style={{ color: colors.textMuted, fontSize: '0.85rem' }}>{label}</span>}
    </label>
  );

  // Рендер секции треков
  const renderTrackSection = (category: 'timer' | 'break' | 'blanks' | 'intro' | 'ambient') => {
    const configs: Record<string, typeof timerConfig> = {
      timer: timerConfig,
      break: breakConfig,
      blanks: blanksConfig,
      intro: introConfig,
      ambient: ambientConfig,
    };
    const setters: Record<string, typeof setTimerConfig> = {
      timer: setTimerConfig,
      break: setBreakConfig,
      blanks: setBlanksConfig,
      intro: setIntroConfig,
      ambient: setAmbientConfig,
    };
    const config = configs[category];
    const setConfig = setters[category];
    const titles: Record<string, string> = {
      timer: '⏱️ Музыка во время вопроса',
      break: '☕ Музыка перерыва',
      blanks: '📝 Музыка при сборе бланков',
      intro: '🎬 Музыка для экрана правил',
      ambient: '🎵 Фоновая музыка (горячая)',
    };
    const folders: Record<string, string> = {
      timer: 'timer-music',
      break: 'break-music',
      blanks: 'blanks-music',
      intro: 'intro-music',
      ambient: 'ambient-music',
    };
    const title = titles[category];
    const folderName = folders[category];

    return (
      <div>
        {/* Заголовок + переключатель */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <span style={{ fontSize: '1rem', fontWeight: 600, color: colors.text }}>{title}</span>
          <CustomCheckbox
            checked={config.enabled}
            onChange={(checked) => setConfig(prev => ({ ...prev, enabled: checked }))}
            label="Включено"
          />
        </div>

        {config.enabled && (
          <>
            {/* Папка */}
            <div style={{ ...cardStyle, padding: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ color: colors.textMuted, fontSize: '0.8rem' }}>📁</span>
                <span style={{ color: colors.text, fontSize: '0.85rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {config.customFolder || `assets/${folderName}/`}
                </span>
                <button
                  onClick={() => handleSelectFolder(category)}
                  style={{ ...btnStyle, background: 'rgba(255,255,255,0.1)', color: colors.text, padding: '6px 12px' }}
                >
                  📂 Выбрать папку
                </button>
              </div>
            </div>

            {/* Список треков */}
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ color: colors.textMuted, fontSize: '0.85rem' }}>
                  Выбрано треков: {Math.min(config.selectedTracks.size, config.tracks.length)} из {config.tracks.length}
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => toggleAllTracks(category, true)}
                    disabled={config.tracks.length === 0}
                    style={{ 
                      ...btnStyle, 
                      background: config.tracks.length > 0 ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)', 
                      color: config.tracks.length > 0 ? colors.text : colors.textMuted, 
                      padding: '4px 10px', 
                      fontSize: '0.75rem',
                      cursor: config.tracks.length > 0 ? 'pointer' : 'not-allowed',
                    }}
                  >
                    ✓ Выбрать все
                  </button>
                  <button
                    onClick={() => toggleAllTracks(category, false)}
                    disabled={config.tracks.length === 0}
                    style={{ 
                      ...btnStyle, 
                      background: config.tracks.length > 0 ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)', 
                      color: config.tracks.length > 0 ? colors.text : colors.textMuted, 
                      padding: '4px 10px', 
                      fontSize: '0.75rem',
                      cursor: config.tracks.length > 0 ? 'pointer' : 'not-allowed',
                    }}
                  >
                    ✗ Снять все
                  </button>
                </div>
              </div>

              {config.tracks.length === 0 ? (
                <div style={{ color: colors.textMuted, fontSize: '0.85rem', padding: '20px 0', textAlign: 'center' }}>
                  Нет аудио файлов.<br/>
                  <span style={{ fontSize: '0.8rem' }}>Добавьте MP3 в папку или выберите другую.</span>
                </div>
              ) : (
                <div style={{ maxHeight: 180, overflow: 'auto' }}>
                  {config.tracks.map((track, idx) => (
                    <label
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '8px 10px',
                        borderRadius: 6,
                        cursor: 'pointer',
                        background: config.selectedTracks.has(idx) ? `${colors.accent}15` : 'transparent',
                        marginBottom: 4,
                        border: config.selectedTracks.has(idx) ? `1px solid ${colors.accent}40` : '1px solid transparent',
                      }}
                    >
                      <div
                        onClick={(e) => { e.preventDefault(); toggleTrack(category, idx); }}
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 4,
                          border: `2px solid ${config.selectedTracks.has(idx) ? colors.accent : colors.textMuted}`,
                          background: config.selectedTracks.has(idx) ? colors.accent : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          flexShrink: 0,
                        }}
                      >
                        {config.selectedTracks.has(idx) && (
                          <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6L5 9L10 3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                      <span style={{ flex: 1, color: colors.text, fontSize: '0.85rem' }}>{track.name}</span>
                      <span style={{ color: colors.textMuted, fontSize: '0.8rem' }}>{formatDuration(track.duration)}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Режим воспроизведения */}
            <div style={{ ...cardStyle, padding: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <span style={{ color: colors.textMuted, fontSize: '0.85rem' }}>Порядок:</span>
                <label 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 8, 
                    cursor: 'pointer',
                    padding: '8px 14px',
                    borderRadius: 8,
                    background: config.shuffle ? `${colors.accent}20` : 'transparent',
                    border: config.shuffle ? `2px solid ${colors.accent}` : '2px solid transparent',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <input
                    type="radio"
                    checked={config.shuffle}
                    onChange={() => setConfig(prev => ({ ...prev, shuffle: true }))}
                    style={{ display: 'none' }}
                  />
                  <span style={{ 
                    width: 18, 
                    height: 18, 
                    borderRadius: '50%', 
                    border: `2px solid ${config.shuffle ? colors.accent : colors.textMuted}`,
                    background: config.shuffle ? colors.accent : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {config.shuffle && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />}
                  </span>
                  <span style={{ color: config.shuffle ? colors.text : colors.textMuted, fontSize: '0.85rem', fontWeight: config.shuffle ? 600 : 400 }}>
                    🎲 Случайный
                  </span>
                </label>
                <label 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 8, 
                    cursor: 'pointer',
                    padding: '8px 14px',
                    borderRadius: 8,
                    background: !config.shuffle ? `${colors.accent}20` : 'transparent',
                    border: !config.shuffle ? `2px solid ${colors.accent}` : '2px solid transparent',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <input
                    type="radio"
                    checked={!config.shuffle}
                    onChange={() => setConfig(prev => ({ ...prev, shuffle: false }))}
                    style={{ display: 'none' }}
                  />
                  <span style={{ 
                    width: 18, 
                    height: 18, 
                    borderRadius: '50%', 
                    border: `2px solid ${!config.shuffle ? colors.accent : colors.textMuted}`,
                    background: !config.shuffle ? colors.accent : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {!config.shuffle && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />}
                  </span>
                  <span style={{ color: !config.shuffle ? colors.text : colors.textMuted, fontSize: '0.85rem', fontWeight: !config.shuffle ? 600 : 400 }}>
                    📋 По порядку
                  </span>
                </label>
              </div>
            </div>

            {/* Громкость */}
            <div style={{ ...cardStyle, padding: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ color: colors.textMuted, fontSize: '0.85rem' }}>🔊 Громкость:</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={config.volume}
                  onChange={(e) => {
                    const vol = Number(e.target.value);
                    setConfig(prev => ({ ...prev, volume: vol }));
                    systemSounds.setVolume(category, vol);
                  }}
                  style={{ flex: 1, accentColor: colors.accent, cursor: 'pointer' }}
                />
                <span style={{ color: colors.text, minWidth: 45, textAlign: 'right', fontSize: '0.85rem' }}>
                  {Math.round(config.volume * 100)}%
                </span>
              </div>
            </div>

            {/* Кнопки управления */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => handlePlayPreview(category)}
                disabled={config.selectedTracks.size === 0}
                style={{
                  ...btnStyle,
                  background: config.selectedTracks.size > 0 ? colors.accent : 'rgba(255,255,255,0.05)',
                  color: config.selectedTracks.size > 0 ? '#fff' : colors.textMuted,
                }}
              >
                ▶️ Прослушать
              </button>
              <button
                onClick={() => systemSounds.stop(category)}
                style={{ ...btnStyle, background: 'rgba(255,255,255,0.1)', color: colors.text }}
              >
                ⏹️ Стоп
              </button>
            </div>
          </>
        )}
      </div>
    );
  };

  // Рендер SFX секции
  const renderSfxSection = () => {
    const sfxItems = [
      { key: 'tick', label: '🕐 Тик таймера', desc: 'Последние 5 секунд' },
      { key: 'correct', label: '✅ Показ ответа', desc: 'При появлении ответа' },
      { key: 'roundStart', label: '🎬 Начало раунда', desc: 'При старте раунда' },
      { key: 'gameEnd', label: '🏆 Конец игры', desc: 'Финальный звук' },
    ];

    return (
      <div>
        {/* Глобальный переключатель */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <span style={{ fontSize: '1rem', fontWeight: 600, color: colors.text }}>🔔 Звуковые эффекты</span>
          <CustomCheckbox
            checked={sfxConfig.enabled}
            onChange={(checked) => setSfxConfig(prev => ({ ...prev, enabled: checked }))}
            label="Включено"
          />
        </div>

        {sfxConfig.enabled && (
          <>
            {/* Индивидуальные SFX */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {sfxItems.map(({ key, label, desc }) => {
                const isChecked = sfxConfig[key as keyof typeof sfxConfig] as boolean;
                return (
                <div
                  key={key}
                  style={{
                    ...cardStyle,
                    padding: 14,
                    background: isChecked ? `${colors.accent}08` : 'rgba(255,255,255,0.02)',
                    border: isChecked ? `1px solid ${colors.accent}20` : `1px solid ${colors.border}`,
                  }}
                >
                  {/* Заголовок + чекбокс */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <label 
                      style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
                      onClick={() => setSfxConfig(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))}
                    >
                      <div
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: 4,
                          border: `2px solid ${isChecked ? colors.accent : colors.textMuted}`,
                          background: isChecked ? colors.accent : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          flexShrink: 0,
                        }}
                      >
                        {isChecked && (
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6L5 9L10 3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                      <div>
                        <span style={{ color: colors.text, fontSize: '0.9rem', fontWeight: 500 }}>{label}</span>
                        <div style={{ color: colors.textMuted, fontSize: '0.75rem' }}>{desc}</div>
                      </div>
                    </label>
                    <button
                      onClick={() => handleTestSfx(key as SoundCategory)}
                      style={{
                        ...btnStyle,
                        background: colors.accent,
                        color: '#fff',
                        padding: '6px 14px',
                      }}
                    >
                      ▶ Тест
                    </button>
                  </div>

                  {/* Кастомный звук */}
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 10, 
                    padding: '8px 12px',
                    background: 'rgba(0,0,0,0.15)',
                    borderRadius: 8,
                  }}>
                    <span style={{ color: colors.textMuted, fontSize: '0.8rem' }}>🎵</span>
                    {customSfxPaths[key] ? (
                      <>
                        <span style={{ 
                          flex: 1, 
                          color: colors.text, 
                          fontSize: '0.8rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {customSfxPaths[key]?.split('/').pop()?.split('\\').pop()}
                        </span>
                        <button
                          onClick={() => handleClearCustomSfx(key)}
                          style={{
                            ...btnStyle,
                            background: 'rgba(239, 68, 68, 0.2)',
                            color: '#ef4444',
                            padding: '4px 10px',
                            fontSize: '0.75rem',
                          }}
                        >
                          ✕ Сбросить
                        </button>
                      </>
                    ) : (
                      <>
                        <span style={{ flex: 1, color: colors.textMuted, fontSize: '0.8rem', fontStyle: 'italic' }}>
                          Встроенный звук
                        </span>
                        <button
                          onClick={() => handleSelectCustomSfx(key)}
                          style={{
                            ...btnStyle,
                            background: 'rgba(255,255,255,0.1)',
                            color: colors.text,
                            padding: '4px 10px',
                            fontSize: '0.75rem',
                          }}
                        >
                          📂 Свой звук
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )})}
            </div>

            {/* Громкость SFX */}
            <div style={{ ...cardStyle, padding: 12, marginTop: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ color: colors.textMuted, fontSize: '0.85rem' }}>🔊 Громкость эффектов:</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={sfxConfig.volume}
                  onChange={(e) => {
                    const vol = Number(e.target.value);
                    setSfxConfig(prev => ({ ...prev, volume: vol }));
                    ['tick', 'correct', 'wrong', 'roundStart', 'gameEnd'].forEach(cat => {
                      systemSounds.setVolume(cat as SoundCategory, vol);
                    });
                  }}
                  style={{ flex: 1, accentColor: colors.accent, cursor: 'pointer' }}
                />
                <span style={{ color: colors.text, minWidth: 45, textAlign: 'right', fontSize: '0.85rem' }}>
                  {Math.round(sfxConfig.volume * 100)}%
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            style={{
              background: colors.background,
              borderRadius: 16,
              padding: 24,
              maxWidth: 650,
              width: '100%',
              maxHeight: '85vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              border: `1px solid ${colors.border}`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Заголовок */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: '1.3rem', color: colors.text }}>
                🔊 Настройки звуков
              </h2>
              <button
                onClick={handleClose}
                style={{ ...btnStyle, background: 'rgba(255,255,255,0.1)', color: colors.text }}
              >
                ✕
              </button>
            </div>

            {isLoading ? (
              <div style={{ textAlign: 'center', padding: 60, color: colors.textMuted }}>
                Загрузка...
              </div>
            ) : (
              <>
                {/* Мастер громкость */}
                <div style={{ ...cardStyle, marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ color: colors.text, fontSize: '0.9rem', fontWeight: 600 }}>🎚️ Общая громкость</span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={masterVolume}
                      onChange={(e) => {
                        const vol = Number(e.target.value);
                        setMasterVolume(vol);
                        systemSounds.setMasterVolume(vol);
                      }}
                      style={{ flex: 1, accentColor: colors.accent, cursor: 'pointer' }}
                    />
                    <span style={{ color: colors.text, minWidth: 45, textAlign: 'right', fontWeight: 600 }}>
                      {Math.round(masterVolume * 100)}%
                    </span>
                  </div>
                </div>

                {/* Табы */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
                  <button onClick={() => setActiveTab('timer')} style={tabStyle(activeTab === 'timer')}>
                    ⏱️ Вопросы
                  </button>
                  <button onClick={() => setActiveTab('break')} style={tabStyle(activeTab === 'break')}>
                    ☕ Перерыв
                  </button>
                  <button onClick={() => setActiveTab('blanks')} style={tabStyle(activeTab === 'blanks')}>
                    📝 Бланки
                  </button>
                  <button onClick={() => setActiveTab('intro')} style={tabStyle(activeTab === 'intro')}>
                    🎬 Правила
                  </button>
                  <button onClick={() => setActiveTab('ambient')} style={tabStyle(activeTab === 'ambient')}>
                    🎵 Фон
                  </button>
                  <button onClick={() => setActiveTab('sfx')} style={tabStyle(activeTab === 'sfx')}>
                    🔔 Эффекты
                  </button>
                </div>

                {/* Контент */}
                <div style={{ flex: 1, overflow: 'auto', paddingRight: 8 }}>
                  {activeTab === 'timer' && renderTrackSection('timer')}
                  {activeTab === 'break' && renderTrackSection('break')}
                  {activeTab === 'blanks' && renderTrackSection('blanks')}
                  {activeTab === 'intro' && renderTrackSection('intro')}
                  {activeTab === 'ambient' && renderTrackSection('ambient')}
                  {activeTab === 'sfx' && renderSfxSection()}
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SoundSettings;
