import { Theme, ThemeId } from '../types/game';

export const themes: Record<ThemeId, Theme> = {
  'nordic-dark': {
    id: 'nordic-dark',
    name: 'Тёмная',
    emoji: '🌙',
    colors: {
      background: '#0f172a',
      backgroundSecondary: 'rgba(30, 41, 59, 0.8)',
      backgroundTertiary: '#334155',
      text: '#f1f5f9',
      textSecondary: '#94a3b8',
      textMuted: '#8494a8',
      accent: '#3b82f6',
      accentSecondary: '#8b5cf6',
      accentMuted: 'rgba(59, 130, 246, 0.15)',
      correct: '#10b981',
      incorrect: '#ef4444',
      border: 'rgba(148, 163, 184, 0.15)',
      shadow: 'rgba(0, 0, 0, 0.4)',
      teamColors: ['#ef4444', '#3b82f6', '#10b981', '#f59e0b']
    },
    particles: {
      type: 'geometric',
      enabled: true,
      color: 'rgba(59, 130, 246, 0.1)',
      secondaryColor: 'rgba(139, 92, 246, 0.1)'
    }
  },
  
  'nordic-light': {
    id: 'nordic-light',
    name: 'Светлая',
    emoji: '☀️',
    colors: {
      background: '#f8fafc',
      backgroundSecondary: 'rgba(255, 255, 255, 0.95)',
      backgroundTertiary: '#f1f5f9',
      text: '#0f172a',
      textSecondary: '#475569',
      textMuted: '#94a3b8',
      accent: '#3b82f6',
      accentSecondary: '#8b5cf6',
      accentMuted: 'rgba(59, 130, 246, 0.15)',
      correct: '#10b981',
      incorrect: '#ef4444',
      border: 'rgba(148, 163, 184, 0.25)',
      shadow: 'rgba(0, 0, 0, 0.1)',
      teamColors: ['#ef4444', '#3b82f6', '#10b981', '#f59e0b']
    },
    particles: {
      type: 'dots',
      enabled: true,
      color: 'rgba(59, 130, 246, 0.08)'
    }
  },
  
  'winter': {
    id: 'winter',
    name: 'Новый год',
    emoji: '🎄',
    colors: {
      // Светлый снежный фон
      background: '#f0f4f8',
      backgroundSecondary: 'rgba(255, 255, 255, 0.95)',
      backgroundTertiary: '#e4ecf4',
      // Тёмный текст
      text: '#1a2a3a',
      textSecondary: '#4a5a6a',
      textMuted: '#7a8a9a',
      // Сине-фиолетовые акценты
      accent: '#3b82f6',            // Синий
      accentSecondary: '#8b5cf6',   // Фиолетовый
      accentMuted: 'rgba(59, 130, 246, 0.15)',
      correct: '#10b981',
      incorrect: '#ef4444',
      border: 'rgba(26, 42, 58, 0.12)',
      shadow: 'rgba(26, 42, 58, 0.1)',
      teamColors: ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b']
    },
    particles: {
      type: 'snowflakes',
      enabled: true,
      color: '#ffffff',
      secondaryColor: '#cce0ff'
    }
  },
  
  'autumn': {
    id: 'autumn',
    name: 'Осень',
    emoji: '🍂',
    colors: {
      background: '#faf5f0',
      backgroundSecondary: 'rgba(255, 255, 255, 0.95)',
      backgroundTertiary: '#f5ebe0',
      text: '#1c1917',
      textSecondary: '#57534e',
      textMuted: '#a8a29e',
      accent: '#f97316',
      accentSecondary: '#ea580c',
      accentMuted: 'rgba(249, 115, 22, 0.15)',
      correct: '#10b981',
      incorrect: '#ef4444',
      border: 'rgba(168, 162, 158, 0.25)',
      shadow: 'rgba(0, 0, 0, 0.08)',
      teamColors: ['#f97316', '#3b82f6', '#10b981', '#eab308']
    },
    particles: {
      type: 'leaves',
      enabled: true,
      color: '#f97316',
      secondaryColor: '#ea580c'
    }
  },
  
  'spring': {
    id: 'spring',
    name: '8 марта',
    emoji: '🌸',
    colors: {
      background: '#fdf2f8',
      backgroundSecondary: 'rgba(255, 255, 255, 0.95)',
      backgroundTertiary: '#fce7f3',
      text: '#1c1917',
      textSecondary: '#6b7280',
      textMuted: '#9ca3af',
      accent: '#ec4899',
      accentSecondary: '#d946ef',
      accentMuted: 'rgba(236, 72, 153, 0.15)',
      correct: '#10b981',
      incorrect: '#ef4444',
      border: 'rgba(236, 72, 153, 0.2)',
      shadow: 'rgba(236, 72, 153, 0.1)',
      teamColors: ['#ec4899', '#8b5cf6', '#10b981', '#f59e0b']
    },
    particles: {
      type: 'petals',
      enabled: true,
      color: '#f9a8d4',
      secondaryColor: '#c4b5fd'
    }
  },
  
  'summer': {
    id: 'summer',
    name: 'Лето',
    emoji: '🌊',
    colors: {
      background: '#ecfeff',
      backgroundSecondary: 'rgba(255, 255, 255, 0.95)',
      backgroundTertiary: '#cffafe',
      text: '#0f172a',
      textSecondary: '#475569',
      textMuted: '#94a3b8',
      accent: '#06b6d4',
      accentSecondary: '#0891b2',
      accentMuted: 'rgba(6, 182, 212, 0.15)',
      correct: '#10b981',
      incorrect: '#ef4444',
      border: 'rgba(6, 182, 212, 0.2)',
      shadow: 'rgba(6, 182, 212, 0.1)',
      teamColors: ['#f43f5e', '#06b6d4', '#10b981', '#f59e0b']
    },
    particles: {
      type: 'lines',
      enabled: true,
      color: 'rgba(6, 182, 212, 0.2)',
      secondaryColor: 'rgba(14, 165, 233, 0.2)'
    }
  },

  // ===============================================
  // PROJECTOR-OPTIMIZED THEMES (высокий контраст)
  // ===============================================

  'cyber-night': {
    id: 'cyber-night',
    name: 'Cyber Night',
    emoji: '🌃',
    colors: {
      // Глубокий тёмный фон
      background: '#0a0a0f',
      backgroundSecondary: 'rgba(15, 15, 25, 0.95)',
      backgroundTertiary: '#151520',
      // Яркий белый текст для контраста
      text: '#ffffff',
      textSecondary: '#a0a0c0',
      textMuted: '#8080a0',
      // Неоновые акценты: голубой + фиолетовый
      accent: '#00d4ff',           // Неоновый голубой
      accentSecondary: '#bf00ff',  // Неоновый пурпурный
      accentMuted: 'rgba(0, 212, 255, 0.2)',
      correct: '#00ff88',          // Неоновый зелёный
      incorrect: '#ff0055',        // Неоновый розовый
      border: 'rgba(0, 212, 255, 0.3)',
      shadow: 'rgba(0, 212, 255, 0.2)',
      teamColors: ['#00d4ff', '#bf00ff', '#00ff88', '#ffcc00']
    },
    particles: {
      type: 'lines',
      enabled: true,
      color: 'rgba(0, 212, 255, 0.15)',
      secondaryColor: 'rgba(191, 0, 255, 0.15)'
    }
  },

  'emerald-tech': {
    id: 'emerald-tech',
    name: 'Emerald Tech',
    emoji: '🎱',
    colors: {
      // Бильярдный тёмно-зелёный фон
      background: '#0a1a14',
      backgroundSecondary: 'rgba(15, 35, 28, 0.95)',
      backgroundTertiary: '#142820',
      // Светлый текст
      text: '#e8f5f0',
      textSecondary: '#a0c4b8',
      textMuted: '#80a090',
      // Изумрудные акценты
      accent: '#00ff7f',           // Яркий изумрудный
      accentSecondary: '#00cc66',  // Тёмный изумрудный
      accentMuted: 'rgba(0, 255, 127, 0.2)',
      correct: '#00ff7f',
      incorrect: '#ff4466',
      border: 'rgba(0, 255, 127, 0.25)',
      shadow: 'rgba(0, 255, 127, 0.15)',
      teamColors: ['#00ff7f', '#00aaff', '#ffcc00', '#ff6b6b']
    },
    particles: {
      type: 'dots',
      enabled: true,
      color: 'rgba(0, 255, 127, 0.1)',
      secondaryColor: 'rgba(0, 204, 102, 0.1)'
    }
  },

  'royal-gold': {
    id: 'royal-gold',
    name: 'Royal Gold',
    emoji: '👑',
    colors: {
      // Премиальный тёмный фон с теплотой
      background: '#0f0c08',
      backgroundSecondary: 'rgba(25, 20, 15, 0.95)',
      backgroundTertiary: '#1a1510',
      // Тёплый светлый текст
      text: '#fff8e8',
      textSecondary: '#d4c4a0',
      textMuted: '#a09080',
      // Золотые акценты
      accent: '#ffd700',           // Чистое золото
      accentSecondary: '#ffb000',  // Тёмное золото
      accentMuted: 'rgba(255, 215, 0, 0.2)',
      correct: '#00dd77',
      incorrect: '#ff4444',
      border: 'rgba(255, 215, 0, 0.3)',
      shadow: 'rgba(255, 215, 0, 0.15)',
      teamColors: ['#ffd700', '#ff6b35', '#00dd77', '#00aaff']
    },
    particles: {
      type: 'geometric',
      enabled: true,
      color: 'rgba(255, 215, 0, 0.1)',
      secondaryColor: 'rgba(255, 176, 0, 0.1)'
    }
  }
};

export const getTheme = (id: ThemeId): Theme => themes[id] || themes['nordic-dark'];

export const themeList = Object.values(themes);
