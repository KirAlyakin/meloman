// Design System для PubQuiz - единый источник стилей
// Оптимизирован для высокой читаемости на проекторах

import { ThemeId } from '../../types/game';
import { getTheme } from '../../themes';

export interface DesignSystem {
  // Backgrounds
  bgPrimary: string;
  bgSecondary: string;
  bgTertiary: string;
  bgCard: string;
  bgInput: string;
  // Text
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  // Border & Shadow
  border: string;
  shadow: string;
  shadowSm: string;
  shadowPrimary: string;
  // Accents
  accent: string;
  accentSecondary: string;
  accentSuccess: string;
  accentWarning: string;
  accentDanger: string;
  accentPurple: string;
  // Gradients
  gradientBrand: string;
  gradientWarm: string;
  gradientPurple: string;
  // Meta
  isDark: boolean;
  isProjectorOptimized: boolean;
}

// Определяем яркость цвета (0-255)
const getLuminance = (hex: string): number => {
  const rgb = hex.replace('#', '').match(/.{2}/g);
  if (!rgb) return 128;
  const [r, g, b] = rgb.map(x => parseInt(x, 16));
  return (0.299 * r + 0.587 * g + 0.114 * b);
};

// Проверяем, тёмная ли тема
const isDarkTheme = (bgColor: string): boolean => {
  return getLuminance(bgColor) < 128;
};

// Темы, оптимизированные для проекторов
const PROJECTOR_THEMES: ThemeId[] = ['cyber-night', 'emerald-tech', 'royal-gold'];

export const getDS = (themeId: ThemeId): DesignSystem => {
  const theme = getTheme(themeId);
  const c = theme.colors;
  
  // Определяем тип темы
  const bgHex = c.background.startsWith('#') ? c.background : '#0f172a';
  const isDark = isDarkTheme(bgHex);
  const isProjectorOptimized = PROJECTOR_THEMES.includes(themeId);
  
  // Input background зависит от темы
  const getInputBg = (): string => {
    if (themeId === 'cyber-night') return '#0f0f18';
    if (themeId === 'emerald-tech') return '#0f1f18';
    if (themeId === 'royal-gold') return '#1a1510';
    if (isDark) return '#1e293b';
    return '#ffffff';
  };
  
  return {
    // Берём цвета напрямую из темы
    bgPrimary: c.background,
    bgSecondary: c.backgroundSecondary,
    bgTertiary: c.backgroundTertiary,
    bgCard: c.backgroundSecondary,
    bgInput: getInputBg(),
    
    textPrimary: c.text,
    textSecondary: c.textSecondary,
    textMuted: c.textMuted,
    
    border: c.border,
    shadow: `0 10px 25px ${c.shadow}`,
    shadowSm: `0 4px 12px ${c.shadow}`,
    shadowPrimary: `0 10px 30px -5px ${c.accent}60`,
    
    // Акценты из темы
    accent: c.accent,
    accentSecondary: c.accentSecondary,
    accentSuccess: c.correct,
    accentWarning: '#f59e0b',
    accentDanger: c.incorrect,
    accentPurple: c.accentSecondary,
    
    // Градиенты на основе акцентов темы
    gradientBrand: `linear-gradient(135deg, ${c.accent} 0%, ${c.accentSecondary} 100%)`,
    gradientWarm: `linear-gradient(135deg, #F59E0B 0%, ${c.incorrect} 100%)`,
    gradientPurple: `linear-gradient(135deg, ${c.accentSecondary} 0%, #EC4899 100%)`,
    
    // Meta
    isDark,
    isProjectorOptimized,
  };
};

// Кэш для стилей - предотвращает создание новых объектов при каждом рендере
const stylesCache = new Map<string, ReturnType<typeof createStyles>>();

// Создание стилей (внутренняя функция)
const createStyles = (ds: DesignSystem) => ({
  card: {
    background: ds.bgCard,
    backdropFilter: 'blur(20px)',
    border: `1px solid ${ds.border}`,
    borderRadius: 16,
    padding: 20,
    boxShadow: ds.shadowSm,
  } as React.CSSProperties,
  
  btnPrimary: {
    padding: '12px 24px',
    background: ds.gradientBrand,
    border: 'none',
    borderRadius: 12,
    color: '#fff',
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: '0.95rem',
    boxShadow: ds.shadowPrimary,
    transition: 'all 0.3s ease',
  } as React.CSSProperties,
  
  btnSecondary: {
    padding: '10px 18px',
    background: ds.bgTertiary,
    border: `1px solid ${ds.border}`,
    borderRadius: 10,
    color: ds.textPrimary,
    fontWeight: 500,
    cursor: 'pointer',
    fontSize: '0.9rem',
    transition: 'all 0.2s ease',
  } as React.CSSProperties,
  
  input: {
    padding: '12px 16px',
    background: ds.bgInput,
    border: `1px solid ${ds.border}`,
    borderRadius: 10,
    color: ds.textPrimary,
    fontSize: '0.9rem',
    outline: 'none',
    width: '100%',
  } as React.CSSProperties,
  
  tag: (color: string) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 12px',
    borderRadius: 20,
    fontSize: '0.8rem',
    fontWeight: 600,
    background: `${color}15`,
    color: color,
  } as React.CSSProperties),
});

// Общие стили компонентов (с кэшированием)
export const getStyles = (ds: DesignSystem) => {
  // Используем JSON ключа для кэша (только основные поля для идентификации)
  const cacheKey = `${ds.bgCard}-${ds.border}-${ds.textPrimary}-${ds.accent}`;
  
  let cached = stylesCache.get(cacheKey);
  if (!cached) {
    cached = createStyles(ds);
    stylesCache.set(cacheKey, cached);
    
    // Ограничиваем размер кэша
    if (stylesCache.size > 20) {
      const firstKey = stylesCache.keys().next().value;
      if (firstKey) stylesCache.delete(firstKey);
    }
  }
  
  return cached;
};

// Стили для проектора с высоким контрастом
export const getProjectorStyles = (ds: DesignSystem) => ({
  // Текст вопроса - максимальная читаемость
  questionText: {
    color: ds.textPrimary,
    textShadow: ds.isProjectorOptimized 
      ? `0 0 20px ${ds.accent}40, 0 2px 4px rgba(0,0,0,0.5)` 
      : 'none',
    letterSpacing: '-0.02em',
    lineHeight: 1.3,
  } as React.CSSProperties,
  
  // Ответ - яркий акцентный цвет
  answerText: {
    color: ds.accentSuccess,
    textShadow: ds.isProjectorOptimized 
      ? `0 0 30px ${ds.accentSuccess}60, 0 2px 4px rgba(0,0,0,0.5)` 
      : `0 0 40px ${ds.accentSuccess}60`,
  } as React.CSSProperties,
  
  // Таймер
  timerText: {
    color: ds.textPrimary,
    fontVariantNumeric: 'tabular-nums',
    textShadow: ds.isProjectorOptimized 
      ? `0 0 15px ${ds.accent}50` 
      : 'none',
  } as React.CSSProperties,
  
  // Таймер в опасной зоне
  timerDanger: {
    color: ds.accentDanger,
    textShadow: `0 0 30px ${ds.accentDanger}80`,
    animation: 'pulse 0.5s ease-in-out infinite',
  } as React.CSSProperties,
});

// Иконки раундов
export const getRoundIcon = (type: string): string => {
  const icons: Record<string, string> = {
    text: '📝', music: '🎵', picture: '🖼️',
    blitz: '⚡', video: '🎬', choice: '🔘'
  };
  return icons[type] || '❓';
};

// Нормализация пути для file:// протокола (Windows fix)
// Поддерживает относительные пути с basePath
export const toFileUrl = (path: string, basePath?: string): string => {
  if (!path) return '';
  // Уже URL
  if (path.startsWith('file://') || path.startsWith('http')) return path;
  
  // Нормализуем обратные слэши в прямые
  let normalized = path.replace(/\\/g, '/');
  
  // Если путь относительный и есть basePath — объединяем
  const isAbsolute = /^[A-Za-z]:/.test(normalized) || normalized.startsWith('/');
  if (!isAbsolute && basePath) {
    const base = basePath.replace(/\\/g, '/').replace(/\/+$/, ''); // убираем trailing slash
    normalized = `${base}/${normalized}`;
  }
  
  // Windows absolute path (C:/...)
  if (/^[A-Za-z]:/.test(normalized)) {
    return `file:///${normalized}`;
  }
  // Unix absolute path (/...)
  if (normalized.startsWith('/')) {
    return `file://${normalized}`;
  }
  // Относительный путь без basePath — возвращаем как есть (не сработает, но не упадёт)
  return normalized;
};

// Форматирование времени
export const formatTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

// Расчёт контрастности между двумя цветами (WCAG)
export const getContrastRatio = (fg: string, bg: string): number => {
  const getLum = (hex: string): number => {
    const rgb = hex.replace('#', '').match(/.{2}/g);
    if (!rgb) return 0;
    const [r, g, b] = rgb.map(x => {
      const c = parseInt(x, 16) / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  
  const l1 = getLum(fg);
  const l2 = getLum(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
};

// Проверка достаточной контрастности для проектора (минимум 7:1 для текста)
export const hasGoodContrast = (fg: string, bg: string): boolean => {
  return getContrastRatio(fg, bg) >= 7;
};
