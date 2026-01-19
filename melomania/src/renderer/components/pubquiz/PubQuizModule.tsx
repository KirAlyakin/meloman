import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PubQuizGame, Team, ThemeId } from '../../types/game';
import { getTheme, themeList } from '../../themes';
import { getDS, getStyles } from './designSystem';
import PubQuizEditor from './PubQuizEditor';
import PubQuizHost from './PubQuizHost';
import { downloadAllBlanks } from './BlankGenerator';
import { SoundSettings } from './ui';
import { v4 as uuidv4 } from 'uuid';
import { useResponsive, useOptimalAnimations } from '../../hooks/useResponsive';

type ViewMode = 'library' | 'editor' | 'setup' | 'game';

interface PubQuizModuleProps {
  theme: ThemeId;
  onSetTheme: (theme: ThemeId) => void;
  onBack: () => void;
  onSyncToPublic: (state: any) => void;
}

const STORAGE_KEY = 'melomania_pubquiz_games';

// Move storage functions outside component to prevent recreation
const loadGames = (): PubQuizGame[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const saveGamesToStorage = (games: PubQuizGame[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
};

const defaultTeamColors = [
  '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899',
  '#06b6d4', '#84cc16', '#f97316', '#6366f1', '#14b8a6', '#e11d48'
];

// Memoized ThemeButton component for better performance
const ThemeButton = memo(({ 
  t, 
  isSelected, 
  ds, 
  onSelect 
}: { 
  t: { id: ThemeId; emoji: string; name: string }; 
  isSelected: boolean; 
  ds: ReturnType<typeof getDS>; 
  onSelect: () => void;
}) => (
  <motion.button
    onClick={onSelect}
    whileHover={{ x: 4 }}
    whileTap={{ scale: 0.98 }}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: 'clamp(8px, 1.5vw, 10px) clamp(10px, 2vw, 14px)',
      background: isSelected ? `${ds.accent}15` : 'transparent',
      border: isSelected ? `1px solid ${ds.accent}` : '1px solid transparent',
      borderRadius: 10,
      color: isSelected ? ds.accent : ds.textSecondary,
      cursor: 'pointer',
      textAlign: 'left',
      fontSize: 'clamp(0.75rem, 1.5vw, 0.85rem)',
      fontWeight: 500,
      transition: 'all 0.2s ease',
      width: '100%',
      minHeight: '44px',
      touchAction: 'manipulation',
    }}
  >
    <span style={{ fontSize: '1.1rem' }}>{t.emoji}</span>
    <span>{t.name}</span>
  </motion.button>
));

ThemeButton.displayName = 'ThemeButton';

const PubQuizModule: React.FC<PubQuizModuleProps> = ({ theme, onSetTheme, onBack, onSyncToPublic }) => {
  // Responsive hooks
  const responsive = useResponsive();
  const { shouldAnimate, particleCount } = useOptimalAnimations();
  
  // Memoize theme-dependent values
  const colors = useMemo(() => getTheme(theme).colors, [theme]);
  const ds = useMemo(() => getDS(theme), [theme]);
  const styles = useMemo(() => getStyles(ds), [ds]);

  const [viewMode, setViewMode] = useState<ViewMode>('library');
  const [games, setGames] = useState<PubQuizGame[]>(loadGames);
  const [selectedGame, setSelectedGame] = useState<PubQuizGame | null>(null);
  const [editingGame, setEditingGame] = useState<PubQuizGame | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [waitingIcon, setWaitingIcon] = useState(() => {
    return localStorage.getItem('melomania_waiting_icon') || '🍺';
  });
  
  const waitingIcons = ['🍺', '🎯', '🎲', '🎮', '🧠', '💡', '🏆', '⭐', '🎪', '🎭'];
  
  const [zoom, setZoom] = useState(() => {
    const saved = localStorage.getItem('melomania_zoom');
    return saved ? parseInt(saved) : 100;
  });
  
  const [showSoundSettings, setShowSoundSettings] = useState(false);

  useEffect(() => {
    document.documentElement.style.fontSize = `${zoom}%`;
    localStorage.setItem('melomania_zoom', zoom.toString());
  }, [zoom]);

  // Используем стили из designSystem
  const cardStyle = styles.card;
  const btnGradient = styles.btnPrimary;
  const btnSecondary = styles.btnSecondary;
  const inputStyle = styles.input;

  // Кэшируем стили для sidebar items
  const sidebarItemStyles = React.useMemo(() => ({
    active: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '14px 18px',
      borderRadius: 12,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      background: `${ds.accent}15`,
      color: ds.accent,
      fontWeight: 600,
      border: `1px solid ${ds.accent}30`,
    } as React.CSSProperties,
    inactive: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '14px 18px',
      borderRadius: 12,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      background: 'transparent',
      color: ds.textSecondary,
      fontWeight: 500,
      border: '1px solid transparent',
    } as React.CSSProperties,
  }), [ds.accent, ds.textSecondary]);

  const sidebarItemStyle = (active: boolean) => active ? sidebarItemStyles.active : sidebarItemStyles.inactive;

  const handleSaveGame = useCallback((game: PubQuizGame) => {
    setGames(prevGames => {
      const existingIndex = prevGames.findIndex(g => g.id === game.id);
      let newGames: PubQuizGame[];
      
      if (existingIndex >= 0) {
        newGames = prevGames.map((g, i) => i === existingIndex ? game : g);
      } else {
        newGames = [...prevGames, game];
      }
      
      saveGamesToStorage(newGames);
      return newGames;
    });
    setEditingGame(null);
    setViewMode('library');
  }, []);

  const handleDeleteGame = useCallback((gameId: string) => {
    if (!confirm('Удалить квиз?')) return;
    setGames(prevGames => {
      const newGames = prevGames.filter(g => g.id !== gameId);
      saveGamesToStorage(newGames);
      return newGames;
    });
  }, []);

  const handleImportGame = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const filePath = (file as any).path || ''; // Electron даёт path
    // Получаем директорию файла (basePath для относительных путей к медиа)
    const lastSlash = Math.max(filePath.lastIndexOf('/'), filePath.lastIndexOf('\\'));
    const fileDir = lastSlash > 0 ? filePath.substring(0, lastSlash) : '';

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const game = JSON.parse(event.target?.result as string) as PubQuizGame;
        
        // Валидация структуры
        if (!game.name || !Array.isArray(game.rounds)) {
          alert('❌ Неверный формат файла.\n\nОжидается JSON с полями "name" и "rounds".');
          return;
        }
        
        // Проверка раундов
        const invalidRounds = game.rounds.filter(r => !r.name || !Array.isArray(r.questions));
        if (invalidRounds.length > 0) {
          alert(`❌ Некорректные раунды: ${invalidRounds.length}\n\nКаждый раунд должен иметь "name" и "questions".`);
          return;
        }
        
        game.id = uuidv4();
        game.updatedAt = new Date().toISOString();
        if (!game.mode) game.mode = 'pub-quiz';
        
        // Сохраняем basePath для разрешения относительных путей к медиа
        if (fileDir) {
          game.basePath = fileDir;
        }
        
        // Подсчёт статистики
        const totalQuestions = game.rounds.reduce((sum, r) => sum + r.questions.length, 0);
        const mediaCount = game.rounds.reduce((sum, r) => {
          let count = 0;
          if (r.introImagePath) count++;
          if (r.introMusicPath) count++;
          r.questions.forEach(q => { if (q.mediaPath) count++; });
          return sum + count;
        }, 0);
        
        // Настройки по умолчанию если нет
        if (!game.settings) {
          game.settings = {
            answerMethod: 'paper',
            showTimer: true,
            showQuestionNumber: true,
            autoAdvance: false,
            teamCount: 6
          };
        }
        
        const newGames = [...games, game];
        setGames(newGames);
        saveGamesToStorage(newGames);
        
        let message = `✅ Квиз "${game.name}" импортирован!\n\n`;
        message += `📋 Раундов: ${game.rounds.length}\n`;
        message += `❓ Вопросов: ${totalQuestions}\n`;
        if (mediaCount > 0) {
          message += `📁 Медиафайлов: ${mediaCount}\n\n`;
          message += `ℹ️ Если медиа не отображается, проверьте:\n`;
          message += `• JSON лежит рядом с папками медиа\n`;
          message += `• Пути в вопросах относительные (images/photo.jpg)`;
        }
        alert(message);
        
      } catch (err) {
        alert('❌ Ошибка чтения файла.\n\nУбедитесь что это корректный JSON файл.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExportGame = (game: PubQuizGame) => {
    // Собираем список всех медиафайлов
    const mediaFiles: string[] = [];
    game.rounds.forEach(round => {
      if (round.introImagePath) mediaFiles.push(round.introImagePath);
      if (round.introMusicPath) mediaFiles.push(round.introMusicPath);
      round.questions.forEach(q => {
        if (q.mediaPath) mediaFiles.push(q.mediaPath);
      });
    });

    // Создаём копию без basePath для переносимости
    const exportGame = { ...game };
    delete (exportGame as any).basePath; // Не экспортируем абсолютный путь
    
    const blob = new Blob([JSON.stringify(exportGame, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${game.name.replace(/[^a-zA-Zа-яА-Я0-9]/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);

    // Предупреждение о медиафайлах
    if (mediaFiles.length > 0) {
      const uniqueFiles = [...new Set(mediaFiles)];
      const hasAbsolutePaths = uniqueFiles.some(f => f.includes(':') || f.startsWith('/'));
      
      let message = `✅ Квиз "${game.name}" экспортирован!\n\n`;
      message += `📁 Медиафайлов: ${uniqueFiles.length}\n\n`;
      
      if (hasAbsolutePaths) {
        message += `⚠️ Некоторые пути абсолютные!\n`;
        message += `Для переносимости:\n`;
        message += `1. Создайте папку с названием квиза\n`;
        message += `2. Положите туда JSON и все медиафайлы\n`;
        message += `3. В редакторе укажите "Папку с медиа"\n`;
        message += `4. Пересохраните квиз\n`;
      } else {
        message += `✓ Пути относительные — квиз переносим!\n`;
        message += `Положите JSON рядом с папками медиа.\n`;
      }
      
      alert(message);
    }
  };

  const handleSelectGame = useCallback((game: PubQuizGame) => {
    setSelectedGame(game);
    const newTeams: Team[] = [];
    for (let i = 0; i < game.settings.teamCount; i++) {
      newTeams.push({
        id: uuidv4(),
        name: `Команда ${i + 1}`,
        score: 0,
        color: defaultTeamColors[i % defaultTeamColors.length]
      });
    }
    setTeams(newTeams);
    setViewMode('setup');
  }, []);

  const handleStartGame = useCallback(() => {
    if (teams.length === 0) {
      alert('Добавьте хотя бы одну команду');
      return;
    }
    setViewMode('game');
  }, [teams.length]);

  const openProjectorWindow = () => {
    const projector = window.open('', 'projector', 'width=1920,height=1080');
    if (projector) {
      projector.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>МелоМания - Проектор</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Manrope', system-ui, sans-serif; 
              background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%);
              color: #f1f5f9;
              min-height: 100vh;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
            }
            .logo { 
              width: 140px; height: 140px; 
              background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%);
              border-radius: 32px; 
              display: flex; align-items: center; justify-content: center; 
              font-size: 70px; margin-bottom: 32px;
              box-shadow: 0 20px 50px rgba(59, 130, 246, 0.4);
            }
            h1 { font-size: 56px; font-weight: 800; margin-bottom: 16px; }
            p { font-size: 24px; color: #94a3b8; }
            .hint { position: fixed; bottom: 20px; font-size: 14px; color: #64748b; }
          </style>
        </head>
        <body>
          <div class="logo">${waitingIcon}</div>
          <h1>МелоМания</h1>
          <p>Ожидание начала игры...</p>
          <p class="hint">Нажмите F11 для полноэкранного режима</p>
          <script>
            window.addEventListener('message', (event) => {
              if (event.data.type === 'pubquiz_update') {
                document.body.innerHTML = event.data.html;
                // Re-initialize video controller after HTML update
                initVideoController();
              }
              // Lightweight timer update - no full page reload
              if (event.data.type === 'pubquiz_timer') {
                const timer = document.getElementById('timer');
                const progress = document.getElementById('progress');
                const time = event.data.time;
                const timeLimit = event.data.timeLimit || 60;
                const isWarn = time <= 10;
                
                if (timer) {
                  const m = Math.floor(time / 60);
                  const s = time % 60;
                  timer.textContent = m + ':' + s.toString().padStart(2, '0');
                  timer.className = 'timer' + (isWarn ? ' warn' : '');
                }
                if (progress) {
                  const pct = timeLimit > 0 ? (time / timeLimit) * 100 : 0;
                  progress.style.width = pct + '%';
                  progress.className = 'progress-bar' + (isWarn ? ' warn' : '');
                }
              }
              // Video control from host
              if (event.data.type === 'pubquiz_video') {
                const video = document.getElementById('q-video');
                if (!video) return;
                
                const action = event.data.action;
                const startTime = parseFloat(video.dataset.start) || 0;
                
                if (action === 'play') {
                  if (video.currentTime < startTime) video.currentTime = startTime;
                  video.play();
                } else if (action === 'pause') {
                  video.pause();
                } else if (action === 'stop') {
                  video.pause();
                  video.currentTime = startTime;
                } else if (action === 'seek') {
                  video.currentTime = event.data.time || startTime;
                } else if (action === 'fullscreen') {
                  if (video.requestFullscreen) {
                    video.requestFullscreen();
                  } else if (video.webkitRequestFullscreen) {
                    video.webkitRequestFullscreen();
                  }
                }
              }
            });
            
            // Video controller initialization
            function initVideoController() {
              const video = document.getElementById('q-video');
              if (!video) return;
              
              const playBtn = document.getElementById('video-play');
              const pauseBtn = document.getElementById('video-pause');
              const stopBtn = document.getElementById('video-stop');
              const timeEl = document.getElementById('video-time');
              
              const startTime = parseFloat(video.dataset.start) || 0;
              const endTime = parseFloat(video.dataset.end) || 0;
              
              // Set initial time
              video.addEventListener('loadedmetadata', function() {
                if (startTime > 0) video.currentTime = startTime;
              });
              
              // Update time display
              video.addEventListener('timeupdate', function() {
                const t = Math.floor(video.currentTime);
                const m = Math.floor(t / 60);
                const s = t % 60;
                if (timeEl) timeEl.textContent = m + ':' + s.toString().padStart(2, '0');
                
                // Stop at endTime if set
                if (endTime > 0 && video.currentTime >= endTime) {
                  video.pause();
                  video.currentTime = endTime;
                }
              });
              
              // Button handlers
              if (playBtn) playBtn.onclick = function() {
                if (video.currentTime < startTime) video.currentTime = startTime;
                video.play();
              };
              if (pauseBtn) pauseBtn.onclick = function() { video.pause(); };
              if (stopBtn) stopBtn.onclick = function() {
                video.pause();
                video.currentTime = startTime;
              };
            }
          </script>
        </body>
        </html>
      `);
      (window as any).projectorWindow = projector;
    }
  };

  const addTeam = useCallback(() => {
    setTeams(prevTeams => {
      if (prevTeams.length >= 12) return prevTeams;
      const newTeam: Team = {
        id: uuidv4(),
        name: `Команда ${prevTeams.length + 1}`,
        score: 0,
        color: defaultTeamColors[prevTeams.length % defaultTeamColors.length]
      };
      return [...prevTeams, newTeam];
    });
  }, []);

  const removeTeam = useCallback((id: string) => {
    setTeams(prevTeams => prevTeams.filter(t => t.id !== id));
  }, []);

  const updateTeamName = useCallback((id: string, name: string) => {
    setTeams(prevTeams => prevTeams.map(t => t.id === id ? { ...t, name } : t));
  }, []);

  const handleUpdateTeamScore = useCallback((teamId: string, score: number) => {
    setTeams(prevTeams => prevTeams.map(t => t.id === teamId ? { ...t, score } : t));
  }, []);

  const handleEndGame = useCallback(() => {
    setViewMode('library');
    setSelectedGame(null);
  }, []);

  // Memoize filtered games for better performance
  const filteredGames = useMemo(() => 
    games.filter(g => g.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [games, searchQuery]
  );

  // Check if mobile layout should be used
  const isMobileLayout = responsive.deviceType === 'mobile' || responsive.width < 768;
  const isTabletLayout = responsive.deviceType === 'tablet' || (responsive.width >= 768 && responsive.width < 1024);

  // Memoized responsive container style
  const containerStyle = useMemo(() => ({
    display: 'flex', 
    flexDirection: isMobileLayout ? 'column' as const : 'row' as const,
    minHeight: '100dvh', // Dynamic viewport height (fallback to 100vh in older browsers via CSS)
    background: ds.isDark 
      ? 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)' 
      : 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 50%, #f8fafc 100%)',
    fontFamily: "'Manrope', system-ui, sans-serif",
    overflowX: 'hidden' as const,
  }), [ds.isDark, isMobileLayout]);

  // Sidebar width calculation
  const sidebarWidth = isMobileLayout ? '100%' : isTabletLayout ? '200px' : 'clamp(220px, 20vw, 280px)';

  // Memoized sidebar style with responsive width
  const sidebarStyle = useMemo(() => ({
    width: sidebarWidth,
    padding: isMobileLayout ? '12px 16px' : 'clamp(16px, 3vw, 24px)',
    position: isMobileLayout ? 'relative' as const : 'fixed' as const,
    height: isMobileLayout ? 'auto' : '100dvh',
    display: 'flex',
    flexDirection: isMobileLayout ? 'row' as const : 'column' as const,
    flexWrap: isMobileLayout ? 'wrap' as const : 'nowrap' as const,
    alignItems: isMobileLayout ? 'center' : 'stretch',
    gap: isMobileLayout ? '12px' : '0',
    background: ds.bgCard,
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRight: isMobileLayout ? 'none' : `1px solid ${ds.border}`,
    borderBottom: isMobileLayout ? `1px solid ${ds.border}` : 'none',
    zIndex: 10,
    overflowY: isMobileLayout ? 'visible' as const : 'auto' as const,
    overflowX: 'hidden' as const,
    contain: 'layout style',
  }), [ds.bgCard, ds.border, isMobileLayout, sidebarWidth]);

  // Memoized main content style
  const mainStyle = useMemo(() => ({
    flex: 1,
    marginLeft: isMobileLayout ? 0 : sidebarWidth,
    padding: isMobileLayout ? '16px' : 'clamp(20px, 4vw, 40px)',
    contain: 'layout',
    width: '100%',
    maxWidth: isMobileLayout ? '100%' : `calc(100% - ${sidebarWidth})`,
  }), [isMobileLayout, sidebarWidth]);

  return (
    <div style={containerStyle}>
      {/* Sidebar */}
      <aside style={sidebarStyle}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 32 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: ds.gradientBrand,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.6rem',
            boxShadow: ds.shadowPrimary
          }}>🍺</div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: ds.textPrimary, letterSpacing: '-0.5px' }}>Паб-квиз</h1>
            <span style={{ fontSize: '0.8rem', color: ds.textMuted }}>МелоМания</span>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div 
            onClick={() => setViewMode('library')} 
            style={sidebarItemStyle(viewMode === 'library')}
          >
            📚 Библиотека
          </div>
          <div 
            onClick={() => { setEditingGame(null); setViewMode('editor'); }} 
            style={sidebarItemStyle(viewMode === 'editor')}
          >
            ✏️ Создать квиз
          </div>
          {(viewMode === 'setup' || viewMode === 'game') && (
            <div style={sidebarItemStyle(true)}>
              🎮 Текущая игра
            </div>
          )}
        </nav>

        {/* Theme Selection */}
        <div style={{ marginTop: 32, padding: '16px', background: ds.bgTertiary, borderRadius: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: '1rem' }}>🎨</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: ds.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Тема</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {themeList.map(t => (
              <motion.button
                key={t.id}
                onClick={() => onSetTheme(t.id)}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 14px',
                  background: theme === t.id ? `${ds.accent}15` : 'transparent',
                  border: theme === t.id ? `1px solid ${ds.accent}` : '1px solid transparent',
                  borderRadius: 10,
                  color: theme === t.id ? ds.accent : ds.textSecondary,
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  transition: 'all 0.2s ease',
                  width: '100%'
                }}
              >
                <span style={{ fontSize: '1.1rem' }}>{t.emoji}</span>
                <span>{t.name}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Zoom */}
        <div style={{ marginTop: 16, padding: '16px', background: ds.bgTertiary, borderRadius: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: '1rem' }}>🔍</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: ds.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Масштаб</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => setZoom(Math.max(80, zoom - 10))}
              style={{
                width: 36, height: 36, borderRadius: 8,
                border: `1px solid ${ds.border}`,
                background: ds.bgSecondary,
                color: ds.textPrimary,
                cursor: 'pointer',
                fontSize: '1.1rem',
                fontWeight: 600,
                transition: 'all 0.2s'
              }}
            >−</button>
            <div style={{
              flex: 1, textAlign: 'center',
              padding: '8px',
              background: ds.bgSecondary,
              borderRadius: 8,
              fontWeight: 700,
              color: ds.textPrimary
            }}>{zoom}%</div>
            <button
              onClick={() => setZoom(Math.min(150, zoom + 10))}
              style={{
                width: 36, height: 36, borderRadius: 8,
                border: `1px solid ${ds.border}`,
                background: ds.bgSecondary,
                color: ds.textPrimary,
                cursor: 'pointer',
                fontSize: '1.1rem',
                fontWeight: 600,
                transition: 'all 0.2s'
              }}
            >+</button>
          </div>
        </div>

        {/* Sound Settings */}
        <button 
          onClick={() => setShowSoundSettings(true)}
          style={{
            marginTop: 16,
            width: '100%',
            padding: '14px 18px',
            borderRadius: 12,
            background: `${ds.accentSuccess}15`,
            border: `1px solid ${ds.accentSuccess}30`,
            color: ds.accentSuccess,
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            transition: 'all 0.2s ease',
          }}
        >
          <span style={{ fontSize: '1.1rem' }}>🔊</span>
          <span>Настройки звука</span>
        </button>

        <div style={{ flex: 1 }} />
        
        <button 
          onClick={onBack} 
          style={{ 
            ...btnSecondary, 
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8
          }}
        >
          ← Главное меню
        </button>
      </aside>

      {/* Main Content */}
      <main style={mainStyle}>
        <AnimatePresence mode="wait">
          {/* Library */}
          {viewMode === 'library' && (
            <motion.div key="library" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap',
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: 28,
                gap: 16 
              }}>
                <h1 style={{ margin: 0, fontSize: 'clamp(1.2rem, 3vw, 1.6rem)', fontWeight: 800, color: ds.textPrimary, letterSpacing: '-0.5px' }}>📚 Мои квизы</h1>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    placeholder="🔍 Поиск..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ ...inputStyle, width: 'clamp(150px, 20vw, 220px)', minHeight: '44px' }}
                  />
                  <label style={{ 
                    ...btnSecondary, 
                    cursor: 'pointer', 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: 8,
                    minHeight: '44px',
                  }}>
                    📥 Импорт
                    <input type="file" accept=".json" onChange={handleImportGame} style={{ display: 'none' }} />
                  </label>
                  <button 
                    onClick={() => { setEditingGame(null); setViewMode('editor'); }} 
                    style={{ ...btnGradient, minHeight: '44px' }}
                  >
                    + Создать квиз
                  </button>
                </div>
              </div>

              {filteredGames.length === 0 ? (
                <div style={{ ...cardStyle, textAlign: 'center', padding: 80 }}>
                  <div style={{
                    width: 100, height: 100, borderRadius: 28,
                    background: ds.gradientBrand,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 24px', fontSize: '3rem',
                    boxShadow: ds.shadowPrimary
                  }}>🍺</div>
                  <h3 style={{ marginBottom: 12, fontSize: '1.4rem', color: ds.textPrimary }}>Нет квизов</h3>
                  <p style={{ color: ds.textMuted, marginBottom: 28, fontSize: '1rem' }}>Создайте свой первый паб-квиз или импортируйте готовый!</p>
                  <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                    <button onClick={() => setViewMode('editor')} style={btnGradient}>+ Создать квиз</button>
                    <label style={{ ...btnSecondary, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      📥 Импортировать
                      <input type="file" accept=".json" onChange={handleImportGame} style={{ display: 'none' }} />
                    </label>
                  </div>
                </div>
              ) : (
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))', 
                  gap: 'clamp(12px, 2vw, 20px)',
                  contain: 'layout style',
                }}>
                  {filteredGames.map(game => (
                    <motion.div
                      key={game.id}
                      whileHover={{ scale: 1.02, y: -4 }}
                      style={{ 
                        ...cardStyle, 
                        cursor: 'pointer', 
                        borderTop: `4px solid ${ds.accent}`,
                        transition: 'all 0.3s ease',
                        contain: 'layout style',
                      }}
                      onClick={() => handleSelectGame(game)}
                    >
                      <h3 style={{ margin: 0, marginBottom: 10, fontSize: 'clamp(0.95rem, 2vw, 1.1rem)', color: ds.textPrimary }}>{game.name}</h3>
                      <p style={{ color: ds.textMuted, fontSize: 'clamp(0.8rem, 1.5vw, 0.9rem)', marginBottom: 16 }}>{game.description || 'Без описания'}</p>
                      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', color: ds.textMuted, fontSize: '0.85rem', marginBottom: 20 }}>
                        <span>📋 {game.rounds.length} раундов</span>
                        <span>❓ {game.rounds.reduce((s, r) => s + r.questions.length, 0)} вопросов</span>
                      </div>
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <button onClick={(e) => { e.stopPropagation(); setEditingGame(game); setViewMode('editor'); }} 
                          style={{ ...btnSecondary, fontSize: '0.85rem', padding: '8px 14px', minHeight: '44px' }}>✏️</button>
                        <button onClick={(e) => { e.stopPropagation(); handleExportGame(game); }} 
                          style={{ ...btnSecondary, fontSize: '0.85rem', padding: '8px 14px', minHeight: '44px' }} title="Экспорт">📤</button>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteGame(game.id); }} 
                          style={{ ...btnSecondary, fontSize: '0.85rem', padding: '8px 14px', color: ds.accentDanger, minHeight: '44px' }}>🗑️</button>
                        <button onClick={(e) => { e.stopPropagation(); handleSelectGame(game); }} 
                          style={{ ...btnGradient, fontSize: '0.85rem', padding: '8px 16px', marginLeft: 'auto', minHeight: '44px' }}>Играть →</button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Editor */}
          {viewMode === 'editor' && (
            <motion.div key="editor" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <PubQuizEditor theme={theme} initialGame={editingGame} onSave={handleSaveGame} onCancel={() => setViewMode('library')} />
            </motion.div>
          )}

          {/* Setup */}
          {viewMode === 'setup' && selectedGame && (
            <motion.div key="setup" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div style={{ maxWidth: 900, margin: '0 auto' }}>
                <div style={{ ...cardStyle, marginBottom: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20 }}>
                    <div style={{
                      width: 64, height: 64, borderRadius: 16,
                      background: ds.gradientBrand,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', 
                      fontSize: '2rem',
                      boxShadow: ds.shadowPrimary
                    }}>{waitingIcon}</div>
                    <div style={{ flex: 1 }}>
                      <h2 style={{ margin: 0, fontSize: '1.4rem', color: ds.textPrimary }}>{selectedGame.name}</h2>
                      <p style={{ margin: 0, marginTop: 4, color: ds.textMuted }}>
                        {selectedGame.rounds.length} раундов · {selectedGame.rounds.reduce((s, r) => s + r.questions.length, 0)} вопросов
                      </p>
                    </div>
                  </div>
                  
                  {/* Выбор иконки */}
                  <div style={{ marginBottom: 16 }}>
                    <p style={{ color: ds.textMuted, fontSize: '0.85rem', marginBottom: 8 }}>Иконка ожидания:</p>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {waitingIcons.map(icon => (
                        <button
                          key={icon}
                          onClick={() => { setWaitingIcon(icon); localStorage.setItem('melomania_waiting_icon', icon); }}
                          style={{
                            width: 44, height: 44, borderRadius: 10,
                            background: waitingIcon === icon ? ds.gradientBrand : ds.bgTertiary,
                            border: waitingIcon === icon ? 'none' : `1px solid ${ds.border}`,
                            fontSize: '1.3rem', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: waitingIcon === icon ? ds.shadowPrimary : 'none',
                          }}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <button 
                      onClick={openProjectorWindow} 
                      style={{ 
                        ...btnGradient,
                        background: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)'
                      }}
                    >
                      📺 Открыть экран проектора
                    </button>
                    <button 
                      onClick={() => setShowSoundSettings(true)} 
                      style={{ 
                        ...btnSecondary,
                        background: `${ds.accentSuccess}15`,
                        borderColor: ds.accentSuccess,
                        color: ds.accentSuccess,
                      }}
                    >
                      🔊 Настройки звука
                    </button>
                    <button 
                      onClick={() => downloadAllBlanks(selectedGame, teams.length || 10)} 
                      style={btnSecondary}
                    >
                      🖨️ Печать бланков ({teams.length || 10} команд)
                    </button>
                  </div>
                </div>

                <div style={{ ...cardStyle, marginBottom: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: ds.textPrimary }}>👥 Команды ({teams.length})</h3>
                    <button onClick={addTeam} disabled={teams.length >= 12} style={btnSecondary}>+ Добавить</button>
                  </div>

                  {teams.length === 0 ? (
                    <p style={{ color: ds.textMuted, textAlign: 'center', padding: 32 }}>Добавьте команды для начала игры</p>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
                      {teams.map((team, index) => (
                        <div key={team.id} style={{ 
                          padding: '14px 16px', 
                          background: ds.bgTertiary, 
                          borderRadius: 12, 
                          borderLeft: `4px solid ${team.color}`, 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 12 
                        }}>
                          <span style={{ 
                            width: 32, height: 32, borderRadius: 10, 
                            background: team.color, 
                            display: 'flex', alignItems: 'center', justifyContent: 'center', 
                            color: '#fff', fontSize: '0.85rem', fontWeight: 700 
                          }}>{index + 1}</span>
                          <input 
                            value={team.name} 
                            onChange={(e) => updateTeamName(team.id, e.target.value)} 
                            style={{ ...inputStyle, flex: 1, padding: '8px 12px' }} 
                          />
                          <button 
                            onClick={() => removeTeam(team.id)} 
                            style={{ 
                              background: 'none', 
                              border: 'none', 
                              color: ds.accentDanger, 
                              cursor: 'pointer',
                              fontSize: '1.2rem',
                              padding: 4
                            }}
                          >×</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button 
                  onClick={handleStartGame} 
                  disabled={teams.length === 0} 
                  style={{ 
                    ...btnGradient, 
                    width: '100%', 
                    padding: 18, 
                    fontSize: '1.15rem', 
                    opacity: teams.length === 0 ? 0.5 : 1 
                  }}
                >
                  🎮 Начать игру
                </button>
              </div>
            </motion.div>
          )}

          {/* Game */}
          {viewMode === 'game' && selectedGame && (
            <motion.div key="game" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <PubQuizHost 
                game={selectedGame} 
                teams={teams} 
                theme={theme} 
                onUpdateTeamScore={handleUpdateTeamScore} 
                onEnd={handleEndGame} 
                onSyncToPublic={onSyncToPublic}
                onOpenProjector={openProjectorWindow}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Sound Settings Modal */}
      <SoundSettings
        isOpen={showSoundSettings}
        onClose={() => setShowSoundSettings(false)}
        colors={{
          background: ds.bgPrimary,
          backgroundSecondary: ds.bgSecondary,
          text: ds.textPrimary,
          textMuted: ds.textMuted,
          accent: ds.accent,
          border: ds.border,
        }}
      />
    </div>
  );
};

export default PubQuizModule;
