import { PubQuizGame, Team, ThemeId, RoundDisplaySettings, ROUND_DISPLAY_PRESETS } from '../../../types/game';
import { Phase } from '../hooks/useQuizGame';
import { getRoundIcon, formatTime, toFileUrl } from '../designSystem';
import { getTheme } from '../../../themes';

interface ProjectorData {
  phase: Phase;
  roundIdx: number;
  qIdx: number;
  aIdx: number;
  time: number;
  timeLimit: number;
  timerOn?: boolean;
  theme: ThemeId;
  basePath?: string;
  round: PubQuizGame['rounds'][0] | undefined;
  question: PubQuizGame['rounds'][0]['questions'][0] | undefined;
  answer: PubQuizGame['rounds'][0]['questions'][0] | undefined;
  totalQ: number;
  totalRounds?: number;
  maxPts: number;
  teams: Team[];
  scores: Record<string, Record<number, number>>;
  totals: Record<string, number>;
  game: PubQuizGame;
}

// Разбивает название на строки по ~12 символов
const formatName = (name: string): string => {
  if (name.length <= 12) return name;
  return name.split(' ').reduce((acc: string[], word) => {
    const last = acc[acc.length - 1] || '';
    if ((last + ' ' + word).trim().length <= 12) {
      acc[acc.length - 1] = (last + ' ' + word).trim();
    } else {
      acc.push(word);
    }
    return acc;
  }, ['']).join('\n');
};

// Конвертация FontSize в px
const fontSizeToPx = (size: string, type: 'question' | 'answer'): number => {
  const questionSizes: Record<string, number> = { small: 32, medium: 48, large: 64, xlarge: 80 };
  const answerSizes: Record<string, number> = { small: 48, medium: 64, large: 80, xlarge: 96 };
  return type === 'question' ? questionSizes[size] || 48 : answerSizes[size] || 72;
};

// Конвертация MediaSize в CSS значение
const mediaSizeToCSS = (size: string): string => {
  const sizes: Record<string, string> = { 
    small: '200px', 
    medium: '350px', 
    large: '500px', 
    fullscreen: '55vh'  // 55% высоты - оставляет место для текста
  };
  return sizes[size] || '350px';
};

// Получить настройки отображения (пресет + кастом)
const getDisplaySettings = (round: PubQuizGame['rounds'][0] | undefined): RoundDisplaySettings => {
  if (!round) return ROUND_DISPLAY_PRESETS.text;
  const preset = ROUND_DISPLAY_PRESETS[round.type] || ROUND_DISPLAY_PRESETS.text;
  return { ...preset, ...round.displaySettings };
};

export const renderProjector = (data: ProjectorData): string => {
  const { phase, roundIdx, qIdx, aIdx, time, timeLimit, theme, basePath, round, question, answer, totalQ, maxPts, teams, scores, totals, game } = data;
  const colors = getTheme(theme).colors;
  const progressPercent = timeLimit > 0 ? (time / timeLimit) * 100 : 100;
  const isWarn = time <= 10;
  
  // Получаем настройки отображения
  const ds = getDisplaySettings(round);
  const qFontSize = fontSizeToPx(ds.questionFontSize, 'question');
  const aFontSize = fontSizeToPx(ds.answerFontSize, 'answer');
  const qnFontSize = fontSizeToPx(ds.questionNumberFontSize || 'small', 'question');
  const mediaSizeCSS = mediaSizeToCSS(ds.mediaSize);
  
  // Цвета текста (кастомные или из темы)
  const qTextColor = ds.questionTextColor || colors.text;
  const aTextColor = ds.answerTextColor || colors.correct;
  const qnTextColor = ds.questionNumberColor || colors.textMuted;
  const textOpacity = ds.textOpacity !== undefined ? ds.textOpacity / 100 : 1;
  
  // Тень ответа
  const aShadowColor = ds.answerShadowColor; // undefined = использовать цвет текста
  const aShadowBlur = ds.answerShadowBlur !== undefined ? ds.answerShadowBlur : 40;
  
  // Атмосферные эффекты
  const getAtmosphereCSS = (): string => {
    if (theme === 'winter') {
      return `
        .atmosphere{position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;overflow:hidden;z-index:0}
        .snowflake{position:absolute;color:#fff;font-size:1.8em;opacity:0.8;text-shadow:0 0 4px rgba(255,255,255,0.8);animation:drift linear infinite}
        @keyframes drift{
          0%{transform:translateY(0) translateX(0) rotate(0deg)}
          25%{transform:translateX(15px)}
          50%{transform:translateY(50vh) translateX(-10px) rotate(180deg)}
          75%{transform:translateX(20px)}
          100%{transform:translateY(100vh) translateX(0) rotate(360deg)}
        }
      `;
    }
    if (theme === 'cyber-night') {
      return `
        .atmosphere{position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;overflow:hidden;z-index:0}
        .snowflake{position:absolute;font-size:2em;animation:cyber-drift linear infinite}
        .snowflake.cyan{color:#00d4ff;text-shadow:0 0 10px #00d4ff,0 0 20px #00d4ff,0 0 40px #00d4ff}
        .snowflake.purple{color:#bf00ff;text-shadow:0 0 10px #bf00ff,0 0 20px #bf00ff,0 0 40px #bf00ff}
        .snowflake.white{color:#fff;text-shadow:0 0 8px #fff,0 0 15px #00d4ff}
        @keyframes cyber-drift{
          0%{transform:translateY(0) rotate(0deg);opacity:0.9}
          50%{transform:translateY(50vh) rotate(180deg);opacity:1}
          100%{transform:translateY(100vh) rotate(360deg);opacity:0.7}
        }
      `;
    }
    if (theme === 'emerald-tech') {
      return `
        .atmosphere{position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;overflow:hidden;z-index:0}
        .particle{position:absolute;width:4px;height:4px;border-radius:50%;animation:float-up linear infinite}
        .particle.bright{background:#00ff7f;box-shadow:0 0 8px #00ff7f,0 0 15px #00ff7f}
        .particle.dim{background:#00cc66;box-shadow:0 0 5px #00cc66}
        @keyframes float-up{
          0%{transform:translateY(100vh) scale(0);opacity:0}
          10%{opacity:1}
          90%{opacity:1}
          100%{transform:translateY(-50px) scale(1);opacity:0}
        }
      `;
    }
    if (theme === 'royal-gold') {
      return `
        .atmosphere{position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;overflow:hidden;z-index:0}
        .sparkle{position:absolute;font-size:1.5em;animation:sparkle-float linear infinite}
        .sparkle{color:#ffd700;text-shadow:0 0 10px #ffd700,0 0 20px #ffb000}
        @keyframes sparkle-float{
          0%{transform:translateY(0) scale(0.8);opacity:0.3}
          50%{transform:translateY(-30px) scale(1.2);opacity:1}
          100%{transform:translateY(-60px) scale(0.8);opacity:0}
        }
      `;
    }
    if (theme === 'autumn') {
      return `
        .atmosphere{position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;overflow:hidden;z-index:0}
        .leaf{position:absolute;font-size:2em;animation:fall-leaf linear infinite,spin-leaf linear infinite}
        @keyframes fall-leaf{0%{transform:translateY(-100px)}100%{transform:translateY(100vh)}}
        @keyframes spin-leaf{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
      `;
    }
    if (theme === 'spring') {
      return `
        .atmosphere{position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;overflow:hidden;z-index:0}
        .petal{position:absolute;font-size:1.8em;animation:fall-petal linear infinite,float-petal ease-in-out infinite}
        @keyframes fall-petal{0%{transform:translateY(-100px)}100%{transform:translateY(100vh)}}
        @keyframes float-petal{0%,100%{margin-left:0}50%{margin-left:40px}}
      `;
    }
    if (theme === 'summer') {
      return `
        .atmosphere{position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;overflow:hidden;z-index:0}
        .bubble{position:absolute;border:2px solid ${colors.accent}40;border-radius:50%;animation:rise linear infinite}
        @keyframes rise{0%{transform:translateY(100vh) scale(0)}100%{transform:translateY(-100px) scale(1)}}
      `;
    }
    return '';
  };

  // Псевдо-случайное число на основе seed (стабильное между рендерами)
  const seededRandom = (seed: number): number => {
    const x = Math.sin(seed * 9999) * 10000;
    return x - Math.floor(x);
  };

  // Оптимизированные атмосферные эффекты
  // Уменьшено количество элементов для лучшей производительности
  // GPU-ускорение через will-change и transform3d
  const getAtmosphereHTML = (): string => {
    // Определяем количество элементов (уменьшено для производительности)
    const PARTICLE_COUNTS = {
      winter: 30,      // было 60
      cyberNight: 25,  // было 50
      emerald: 20,     // было 40
      gold: 15,        // было 30
      autumn: 12,      // было 20
      spring: 15,      // было 25
      summer: 10       // было 15
    };
    
    if (theme === 'winter') {
      const snowflakes = Array.from({length: PARTICLE_COUNTS.winter}, (_, i) => {
        const left = seededRandom(i * 1) * 100;
        const top = seededRandom(i * 2) * 100;
        const delay = seededRandom(i * 3) * 15;
        const duration = 12 + seededRandom(i * 4) * 10;
        const size = 1.2 + seededRandom(i * 5) * 1.5;
        const symbol = ['❄', '❅', '❆'][Math.floor(seededRandom(i * 6) * 3)];
        return `<div class="snowflake" style="left:${left.toFixed(1)}%;top:${top.toFixed(1)}%;animation-delay:-${delay.toFixed(1)}s;animation-duration:${duration.toFixed(1)}s;font-size:${size.toFixed(1)}em">${symbol}</div>`;
      }).join('');
      return `<div class="atmosphere">${snowflakes}</div>`;
    }
    if (theme === 'cyber-night') {
      const snowflakes = Array.from({length: PARTICLE_COUNTS.cyberNight}, (_, i) => {
        const left = seededRandom(i * 1 + 100) * 100;
        const top = seededRandom(i * 2 + 100) * 100;
        const delay = seededRandom(i * 3 + 100) * 20;
        const duration = 15 + seededRandom(i * 4 + 100) * 12;
        const size = 1.5 + seededRandom(i * 5 + 100) * 1.8;
        const colorClass = ['cyan', 'purple', 'white'][Math.floor(seededRandom(i * 6 + 100) * 3)];
        const symbol = ['❄', '✦', '✧'][Math.floor(seededRandom(i * 7 + 100) * 3)];
        return `<div class="snowflake ${colorClass}" style="left:${left.toFixed(1)}%;top:${top.toFixed(1)}%;animation-delay:-${delay.toFixed(1)}s;animation-duration:${duration.toFixed(1)}s;font-size:${size.toFixed(1)}em">${symbol}</div>`;
      }).join('');
      return `<div class="atmosphere">${snowflakes}</div>`;
    }
    if (theme === 'emerald-tech') {
      const particles = Array.from({length: PARTICLE_COUNTS.emerald}, (_, i) => {
        const left = seededRandom(i * 1 + 200) * 100;
        const delay = seededRandom(i * 2 + 200) * 15;
        const duration = 8 + seededRandom(i * 3 + 200) * 10;
        const size = 3 + seededRandom(i * 4 + 200) * 5;
        const brightness = seededRandom(i * 5 + 200) > 0.5 ? 'bright' : 'dim';
        return `<div class="particle ${brightness}" style="left:${left.toFixed(1)}%;animation-delay:-${delay.toFixed(1)}s;animation-duration:${duration.toFixed(1)}s;width:${size.toFixed(0)}px;height:${size.toFixed(0)}px"></div>`;
      }).join('');
      return `<div class="atmosphere">${particles}</div>`;
    }
    if (theme === 'royal-gold') {
      const sparkles = Array.from({length: PARTICLE_COUNTS.gold}, (_, i) => {
        const left = seededRandom(i * 1 + 300) * 100;
        const top = 20 + seededRandom(i * 2 + 300) * 60;
        const delay = seededRandom(i * 3 + 300) * 10;
        const duration = 3 + seededRandom(i * 4 + 300) * 4;
        const symbol = ['✦', '✧', '★'][Math.floor(seededRandom(i * 5 + 300) * 3)];
        return `<div class="sparkle" style="left:${left.toFixed(1)}%;top:${top.toFixed(1)}%;animation-delay:-${delay.toFixed(1)}s;animation-duration:${duration.toFixed(1)}s">${symbol}</div>`;
      }).join('');
      return `<div class="atmosphere">${sparkles}</div>`;
    }
    if (theme === 'autumn') {
      const leaves = Array.from({length: PARTICLE_COUNTS.autumn}, (_, i) => {
        const left = seededRandom(i * 1 + 400) * 100;
        const delay = seededRandom(i * 2 + 400) * 10;
        const duration = 10 + seededRandom(i * 3 + 400) * 10;
        const symbol = ['🍂', '🍁', '🍃'][Math.floor(seededRandom(i * 4 + 400) * 3)];
        const opacity = 0.5 + seededRandom(i * 5 + 400) * 0.5;
        return `<div class="leaf" style="left:${left.toFixed(1)}%;animation-delay:${delay.toFixed(1)}s;animation-duration:${duration.toFixed(1)}s;opacity:${opacity.toFixed(2)}">${symbol}</div>`;
      }).join('');
      return `<div class="atmosphere">${leaves}</div>`;
    }
    if (theme === 'spring') {
      const petals = Array.from({length: PARTICLE_COUNTS.spring}, (_, i) => {
        const left = seededRandom(i * 1 + 500) * 100;
        const delay = seededRandom(i * 2 + 500) * 8;
        const duration = 8 + seededRandom(i * 3 + 500) * 8;
        const symbol = ['🌸', '💮', '✿'][Math.floor(seededRandom(i * 4 + 500) * 3)];
        const opacity = 0.5 + seededRandom(i * 5 + 500) * 0.5;
        return `<div class="petal" style="left:${left.toFixed(1)}%;animation-delay:${delay.toFixed(1)}s;animation-duration:${duration.toFixed(1)}s;opacity:${opacity.toFixed(2)}">${symbol}</div>`;
      }).join('');
      return `<div class="atmosphere">${petals}</div>`;
    }
    if (theme === 'summer') {
      const bubbles = Array.from({length: PARTICLE_COUNTS.summer}, (_, i) => {
        const left = seededRandom(i * 1 + 600) * 100;
        const delay = seededRandom(i * 2 + 600) * 10;
        const duration = 10 + seededRandom(i * 3 + 600) * 10;
        const size = 20 + seededRandom(i * 4 + 600) * 40;
        const opacity = 0.2 + seededRandom(i * 5 + 600) * 0.3;
        return `<div class="bubble" style="left:${left.toFixed(1)}%;animation-delay:${delay.toFixed(1)}s;animation-duration:${duration.toFixed(1)}s;width:${size.toFixed(0)}px;height:${size.toFixed(0)}px;opacity:${opacity.toFixed(2)}"></div>`;
      }).join('');
      return `<div class="atmosphere">${bubbles}</div>`;
    }
    return '';
  };
  
  // Прогресс-бар (обычный для всех тем)
  const getProgressBar = (): string => {
    return `<div id="progress" class="progress-bar ${isWarn ? 'warn' : ''}" style="width:${progressPercent}%"></div>`;
  };
  
  // Динамические стили на основе темы и DisplaySettings
  // Оптимизированы с CSS-переменными для лучшей производительности
  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');
    
    /* CSS Variables for theming and responsiveness */
    :root {
      --color-bg: ${colors.background};
      --color-bg-secondary: ${colors.backgroundSecondary};
      --color-bg-tertiary: ${colors.backgroundTertiary};
      --color-text: ${colors.text};
      --color-text-secondary: ${colors.textSecondary};
      --color-text-muted: ${colors.textMuted};
      --color-accent: ${colors.accent};
      --color-accent-secondary: ${colors.accentSecondary};
      --color-correct: ${colors.correct};
      --color-incorrect: ${colors.incorrect};
      --color-border: ${colors.border};
      --color-shadow: ${colors.shadow};
      --q-font-size: ${qFontSize}px;
      --a-font-size: ${aFontSize}px;
      --q-text-color: ${qTextColor};
      --a-text-color: ${aTextColor};
      --a-shadow-color: ${aShadowColor || aTextColor};
      --a-shadow-blur: ${aShadowBlur}px;
      --qn-font-size: ${qnFontSize}px;
      --qn-text-color: ${qnTextColor};
      --text-opacity: ${textOpacity};
      --media-size: ${mediaSizeCSS};
      
      /* Responsive typography */
      --fs-sm: clamp(14px, 2vw, 18px);
      --fs-md: clamp(18px, 2.5vw, 24px);
      --fs-lg: clamp(24px, 3vw, 32px);
      --fs-xl: clamp(32px, 4vw, 48px);
      --fs-2xl: clamp(40px, 5vw, 64px);
      --fs-timer: clamp(36px, 5vw, 56px);
      
      /* Spacing */
      --space-sm: clamp(8px, 1.5vw, 16px);
      --space-md: clamp(16px, 2vw, 24px);
      --space-lg: clamp(24px, 3vw, 40px);
      --space-xl: clamp(40px, 5vw, 60px);
      
      /* Touch targets */
      --touch-min: 44px;
    }
    
    *{margin:0;padding:0;box-sizing:border-box}
    
    html {
      scroll-behavior: smooth;
      -webkit-text-size-adjust: 100%;
    }
    
    body {
      font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: var(--color-bg);
      color: var(--color-text);
      min-height: 100vh;
      min-height: 100dvh;
      display: flex;
      flex-direction: column;
      position: relative;
      overflow: hidden;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    
    /* Main content container */
    .c {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: var(--space-lg);
      padding-left: max(var(--space-lg), env(safe-area-inset-left));
      padding-right: max(var(--space-lg), env(safe-area-inset-right));
      padding-bottom: max(var(--space-md), env(safe-area-inset-bottom));
      position: relative;
      z-index: 1;
      contain: layout style;
      overflow: hidden;
    }
    
    /* Header */
    .h {
      background: var(--color-bg-secondary);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      padding: var(--space-md) var(--space-lg);
      padding-top: max(var(--space-md), env(safe-area-inset-top));
      padding-left: max(var(--space-lg), env(safe-area-inset-left));
      padding-right: max(var(--space-lg), env(safe-area-inset-right));
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: var(--space-md);
      border-bottom: 1px solid var(--color-border);
      position: relative;
      z-index: 2;
      width: 100%;
      contain: layout style;
    }
    
    .rnum {
      width: max(var(--touch-min), 48px);
      height: max(var(--touch-min), 48px);
      background: var(--color-bg-tertiary);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: var(--fs-md);
      color: var(--color-text-secondary);
      flex-shrink: 0;
    }
    
    .progress-bar {
      position: absolute;
      bottom: 0;
      left: 0;
      height: 4px;
      background: linear-gradient(90deg, var(--color-accent), var(--color-accent-secondary));
      border-radius: 0 2px 2px 0;
      will-change: width;
      transition: width 1s linear;
      transform: translateZ(0);
    }
    
    .progress-bar.warn {
      background: linear-gradient(90deg, var(--color-incorrect), #f97316);
    }
    
    .badge {
      background: linear-gradient(135deg, var(--color-accent), var(--color-accent-secondary));
      padding: var(--space-sm) var(--space-md);
      border-radius: 12px;
      font-weight: 600;
      font-size: var(--fs-md);
      white-space: nowrap;
      color: #fff;
      contain: layout style paint;
    }
    
    .timer {
      font-size: var(--fs-timer);
      font-weight: 800;
      font-family: 'Manrope', monospace;
      font-variant-numeric: tabular-nums;
      min-width: 7ch;
      text-align: right;
      color: var(--color-text);
      will-change: transform, color;
      transform: translateZ(0);
    }
    
    .timer.warn {
      color: var(--color-incorrect);
      text-shadow: 0 0 30px rgba(239, 68, 68, 0.5);
      animation: pulse 0.5s ease-in-out infinite;
    }
    
    @keyframes pulse {
      0%, 100% { transform: scale(1) translateZ(0); }
      50% { transform: scale(1.05) translateZ(0); }
    }
    
    .qnum {
      font-size: clamp(${Math.round(qnFontSize * 0.6)}px, 2.5vw, ${qnFontSize}px);
      color: var(--qn-text-color);
      margin-bottom: var(--space-md);
      text-align: center;
      font-weight: 500;
      letter-spacing: 0.5px;
    }
    
    .qtxt {
      font-size: clamp(${Math.round(qFontSize * 0.6)}px, 5vw, ${qFontSize}px);
      font-weight: 700;
      text-align: center;
      line-height: 1.3;
      max-width: min(1400px, 90vw);
      color: var(--q-text-color);
      opacity: var(--text-opacity);
      text-wrap: balance;
      overflow-wrap: break-word;
      contain: layout style;
    }
    
    .atxt {
      font-size: clamp(${Math.round(aFontSize * 0.6)}px, 6vw, ${aFontSize}px);
      font-weight: 800;
      color: var(--a-text-color);
      text-align: center;
      text-shadow: ${aShadowBlur > 0 ? `0 0 var(--a-shadow-blur) var(--a-shadow-color)` : 'none'};
      text-wrap: balance;
      contain: layout style;
    }
    
    .logo {
      width: clamp(100px, 15vw, 140px);
      height: clamp(100px, 15vw, 140px);
      aspect-ratio: 1;
      background: linear-gradient(135deg, var(--color-accent), var(--color-accent-secondary));
      border-radius: clamp(20px, 3vw, 32px);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: clamp(40px, 8vw, 70px);
      margin: 0 auto var(--space-lg);
      box-shadow: 0 20px 50px rgba(from var(--color-accent) r g b / 0.4);
      contain: layout style paint;
      will-change: transform;
    }
    
    .opts {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--space-md);
      margin-top: var(--space-xl);
      max-width: min(1200px, 95vw);
      width: 100%;
      contain: layout style;
    }
    
    @media (max-width: 800px) {
      .opts { grid-template-columns: 1fr; }
    }
    
    .opt {
      background: var(--color-bg-tertiary);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      padding: var(--space-md) var(--space-lg);
      border-radius: 20px;
      display: flex;
      align-items: center;
      gap: var(--space-md);
      border: 1px solid var(--color-border);
      min-height: var(--touch-min);
      contain: layout style;
    }
    
    .opt.ok {
      background: rgba(from var(--color-correct) r g b / 0.2);
      border: 2px solid var(--color-correct);
      box-shadow: 0 0 30px rgba(from var(--color-correct) r g b / 0.3);
    }
    
    .ol {
      width: clamp(48px, 6vw, 64px);
      height: clamp(48px, 6vw, 64px);
      background: var(--color-bg-secondary);
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: var(--fs-xl);
      color: var(--color-text);
      flex-shrink: 0;
    }
    
    .opt.ok .ol {
      background: var(--color-correct);
      color: #fff;
    }
    
    .ot {
      font-size: var(--fs-lg);
      font-weight: 500;
      color: var(--color-text);
      flex: 1;
      overflow-wrap: break-word;
    }
    
    .qimg {
      max-height: var(--media-size);
      max-width: 90vw;
      width: auto;
      height: auto;
      border-radius: 20px;
      object-fit: contain;
      margin-bottom: var(--space-lg);
      box-shadow: 0 20px 50px var(--color-shadow);
      contain: layout;
    }
    
    .qvideo {
      max-height: 55vh;
      max-width: 90vw;
      width: auto;
      height: auto;
      border-radius: 20px;
      object-fit: contain;
      margin-bottom: var(--space-md);
      contain: layout;
    }
    
    .media-player {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-md);
      padding: var(--space-xl);
      background: rgba(255, 255, 255, 0.05);
      border-radius: 24px;
      margin-bottom: var(--space-lg);
      min-width: min(300px, 80vw);
    }
    
    .media-icon {
      font-size: clamp(48px, 10vw, 80px);
      animation: bounce 1s ease-in-out infinite;
    }
    
    .media-label {
      font-size: var(--fs-md);
      color: var(--color-text-secondary);
      font-weight: 500;
    }
    
    .video-controls {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-top: 16px;
      padding: 12px 20px;
      background: rgba(0, 0, 0, 0.6);
      border-radius: 12px;
    }
    
    .video-btn {
      width: 48px;
      height: 48px;
      border: none;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.2);
      color: #fff;
      font-size: 20px;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .video-btn:hover {
      background: rgba(255, 255, 255, 0.4);
      transform: scale(1.1);
    }
    
    .video-btn:active {
      transform: scale(0.95);
    }
    
    .video-time {
      color: rgba(255, 255, 255, 0.8);
      font-size: 16px;
      font-variant-numeric: tabular-nums;
      min-width: 60px;
    }
    
    @keyframes bounce {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }
    
    /* Table styles */
    table {
      width: 100%;
      max-width: min(1400px, 95vw);
      border-collapse: collapse;
      background: var(--color-bg-secondary);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-radius: 20px;
      overflow: hidden;
      contain: layout style;
    }
    
    th, td {
      padding: var(--space-md) var(--space-sm);
      text-align: center;
      border-bottom: 1px solid var(--color-border);
    }
    
    th {
      background: var(--color-bg-tertiary);
      font-weight: 700;
      font-size: var(--fs-sm);
      white-space: pre-wrap;
      line-height: 1.3;
      color: var(--color-text-secondary);
    }
    
    td {
      font-size: var(--fs-md);
      color: var(--color-text);
    }
    
    td:first-child {
      text-align: left;
      font-weight: 600;
      font-size: var(--fs-lg);
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    .tot {
      background: linear-gradient(135deg, rgba(from var(--color-accent) r g b / 0.2), rgba(from var(--color-accent-secondary) r g b / 0.2));
      font-weight: 800;
      font-size: var(--fs-xl) !important;
      color: var(--color-accent);
    }
    
    tbody tr:first-child td { color: #fbbf24; }
    tbody tr:nth-child(2) td { color: #a1a1aa; }
    tbody tr:nth-child(3) td { color: #d97706; }
    
    /* Media position variants */
    .media-left { flex-direction: row; gap: var(--space-xl); }
    .media-left .qimg, .media-left .qvideo { margin-bottom: 0; }
    
    .media-right { flex-direction: row-reverse; gap: var(--space-xl); }
    .media-right .qimg, .media-right .qvideo { margin-bottom: 0; }
    
    .media-bg { position: relative; }
    .media-bg .qimg {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      opacity: 0.3;
      z-index: -1;
      max-height: none;
      border-radius: 0;
    }
    
    /* Responsive adjustments */
    @media (max-width: 768px) {
      .h { flex-wrap: wrap; }
      .timer { min-width: 5ch; }
      .media-left, .media-right { flex-direction: column; }
      td:first-child { max-width: 120px; }
    }
    
    @media (max-height: 500px) and (orientation: landscape) {
      .c { padding: var(--space-sm); }
      .logo { width: 80px; height: 80px; font-size: 40px; margin-bottom: var(--space-sm); }
    }
    
    /* Reduced motion */
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
      .atmosphere { display: none !important; }
    }
    
    /* Print styles */
    @media print {
      .atmosphere { display: none !important; }
      body { background: white !important; color: black !important; }
    }
    
    ${getAtmosphereCSS()}
  `;
  const atmosphere = getAtmosphereHTML();
  const base = `<style>${css}</style>${atmosphere}`;

  // Round Intro - Профессиональный макет слайда правил
  if (phase === 'round-intro') {
    const defaultRules: Record<string, string> = {
      text: 'Классический раунд с текстовыми вопросами. Записывайте ответы на бланках.',
      music: 'Прослушайте фрагмент и угадайте исполнителя или название композиции.',
      picture: 'Посмотрите на изображение и ответьте на вопрос.',
      blitz: 'Блиц-раунд! Быстрые вопросы с коротким временем на ответ.',
      video: 'Посмотрите видео и ответьте на вопрос.',
      choice: 'Выберите правильный ответ из четырёх вариантов (A, B, C, D).',
    };
    
    // Получаем настройки макета (или дефолт)
    const layout = round?.introLayout || {
      imagePosition: 'right',
      imageSize: 'large',
      showRoundNumber: true,
      showRoundName: true,
      showTopic: true,
      showQuestionCount: true,
      showTimeLimit: true,
      showPoints: true,
      showRules: true,
      showRoundIcon: true,
    };
    
    const rules = round?.rules || defaultRules[round?.type || 'text'];
    const defaultPts = round?.defaultPoints || (round?.questions[0]?.points || 1);
    const accentColor = layout.accentColor || colors.accent;
    
    // Размеры картинки
    const imageSizeMap = { small: '30%', medium: '40%', large: '50%' };
    const imageWidth = imageSizeMap[layout.imageSize] || '40%';
    
    // Фоновая музыка
    const introMusic = round?.introMusicPath 
      ? `<audio id="intro-music" src="${toFileUrl(round.introMusicPath, basePath)}" 
           autoplay loop preload="auto" style="display:none"></audio>
         <script>
           (function() {
             var audio = document.getElementById('intro-music');
             if (audio) audio.volume = ${(round?.introMusicVolume || 50) / 100};
           })();
         </script>`
      : '';
    
    // Картинка раунда
    const hasImage = round?.introImagePath && layout.imagePosition !== 'hidden';
    const imageHtml = hasImage ? `
      <img src="${toFileUrl(round?.introImagePath || '', basePath)}" 
           alt="${round?.name || ''}"
           class="intro-image"
           onerror="this.parentElement.style.display='none'" />` : '';
    
    // Блок информации
    const infoItems: string[] = [];
    
    // Количество вопросов
    if (layout.showQuestionCount) {
      infoItems.push(`
        <div class="info-item">
          <span class="info-icon">❓</span>
          <span class="info-text">${totalQ} ${totalQ === 1 ? 'вопрос' : totalQ < 5 ? 'вопроса' : 'вопросов'}</span>
        </div>`);
    }
    
    // Время на ответ
    if (layout.showTimeLimit) {
      const timeLimit = round?.defaultTimeLimit || 60;
      infoItems.push(`
        <div class="info-item">
          <span class="info-icon">⏱️</span>
          <span class="info-text">${timeLimit} ${timeLimit === 1 ? 'секунда' : timeLimit < 5 ? 'секунды' : 'секунд'} на ответ</span>
        </div>`);
    }
    
    // Баллы за ответ
    if (layout.showPoints) {
      infoItems.push(`
        <div class="info-item">
          <span class="info-icon">⭐</span>
          <span class="info-text">${defaultPts} ${defaultPts === 1 ? 'балл' : defaultPts < 5 ? 'балла' : 'баллов'} за правильный ответ</span>
        </div>`);
    }
    
    // Дополнительные правила
    if (layout.showRules && rules) {
      infoItems.push(`
        <div class="info-item rules-item">
          <span class="info-icon">📋</span>
          <span class="info-text">${rules}</span>
        </div>`);
    }
    
    // Определяем layout
    const isHorizontal = layout.imagePosition === 'left' || layout.imagePosition === 'right';
    const isImageLeft = layout.imagePosition === 'left';
    const isBackground = layout.imagePosition === 'background';
    const isTop = layout.imagePosition === 'top';
    
    // CSS для слайда
    const introCSS = `
      .intro-container {
        display: flex;
        flex-direction: ${isHorizontal ? 'row' : 'column'};
        align-items: center;
        justify-content: center;
        gap: clamp(32px, 5vw, 60px);
        padding: clamp(24px, 4vw, 48px);
        min-height: 100vh;
        min-height: 100dvh;
        position: relative;
        ${isBackground && hasImage ? `
          background-image: linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url('${toFileUrl(round?.introImagePath || '', basePath)}');
          background-size: cover;
          background-position: center;
        ` : ''}
      }
      
      .intro-info {
        flex: 1;
        max-width: ${isHorizontal ? '55%' : '100%'};
        display: flex;
        flex-direction: column;
        gap: clamp(12px, 2vw, 20px);
        order: ${isImageLeft ? 2 : 1};
      }
      
      .intro-image-container {
        ${isHorizontal ? `width: ${imageWidth}; max-width: 500px;` : 'width: 100%; max-width: 400px;'}
        display: ${hasImage && !isBackground ? 'flex' : 'none'};
        align-items: center;
        justify-content: center;
        order: ${isImageLeft ? 1 : 2};
      }
      
      .intro-image {
        width: 100%;
        aspect-ratio: 1;
        object-fit: cover;
        border-radius: clamp(16px, 2vw, 24px);
        box-shadow: 0 20px 60px rgba(0,0,0,0.4);
      }
      
      .round-badge {
        display: ${layout.showRoundNumber ? 'inline-flex' : 'none'};
        align-items: center;
        gap: 10px;
        background: ${colors.backgroundTertiary};
        padding: 8px 16px;
        border-radius: 50px;
        width: fit-content;
        margin-bottom: 8px;
      }
      
      .round-badge-number {
        background: ${accentColor};
        color: white;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 800;
        font-size: 14px;
      }
      
      .round-badge-text {
        color: ${colors.textMuted};
        font-size: clamp(12px, 1.5vw, 14px);
        text-transform: uppercase;
        letter-spacing: 1px;
        font-weight: 600;
      }
      
      .round-icon {
        display: ${layout.showRoundIcon && !hasImage ? 'flex' : 'none'};
        font-size: clamp(48px, 8vw, 72px);
        margin-bottom: 8px;
      }
      
      .round-name {
        display: ${layout.showRoundName ? 'block' : 'none'};
        font-size: clamp(36px, 6vw, 64px);
        font-weight: 800;
        color: ${colors.text};
        line-height: 1.1;
        margin: 0;
      }
      
      .round-topic {
        display: ${layout.showTopic && round?.topic ? 'block' : 'none'};
        font-size: clamp(18px, 2.5vw, 24px);
        color: ${accentColor};
        font-weight: 600;
        margin-top: 4px;
      }
      
      .info-list {
        display: flex;
        flex-direction: column;
        gap: clamp(10px, 1.5vw, 16px);
        margin-top: clamp(16px, 2vw, 24px);
      }
      
      .info-item {
        display: flex;
        align-items: flex-start;
        gap: clamp(10px, 1.5vw, 14px);
        background: ${colors.backgroundSecondary};
        padding: clamp(12px, 2vw, 18px) clamp(16px, 2vw, 24px);
        border-radius: clamp(10px, 1.5vw, 14px);
        border-left: 4px solid ${accentColor};
      }
      
      .info-icon {
        font-size: clamp(20px, 2.5vw, 28px);
        flex-shrink: 0;
      }
      
      .info-text {
        font-size: clamp(16px, 2vw, 22px);
        color: ${colors.textSecondary};
        line-height: 1.4;
      }
      
      .rules-item {
        background: ${colors.backgroundTertiary};
        border-left-color: ${colors.accentSecondary};
      }
      
      .rules-item .info-text {
        font-size: clamp(14px, 1.8vw, 18px);
        color: ${colors.textMuted};
      }
    `;
    
    return `${base}
      <style>${introCSS}</style>
      ${introMusic}
      <div class="intro-container">
        <div class="intro-info">
          <div class="round-badge">
            <div class="round-badge-number">${roundIdx + 1}</div>
            <div class="round-badge-text">Раунд ${roundIdx + 1} из ${game.rounds.length}</div>
          </div>
          <div class="round-icon">${getRoundIcon(round?.type || 'text')}</div>
          <h1 class="round-name">${round?.name || ''}</h1>
          <div class="round-topic">${round?.topic || ''}</div>
          <div class="info-list">
            ${infoItems.join('')}
          </div>
        </div>
        <div class="intro-image-container">
          ${imageHtml}
        </div>
      </div>`;
  }

  // Questions
  if (phase === 'questions' && question) {
    const opts = round?.type === 'choice' && question.options
      ? `<div class="opts">${['A','B','C','D'].map((l,i) => 
          `<div class="opt"><div class="ol">${l}</div><div class="ot">${question.options?.[i]||''}</div></div>`
        ).join('')}</div>`
      : '';
    
    // Медиа в зависимости от настроек
    let media = '';
    if (question.mediaPath && ds.mediaPosition !== 'hidden') {
      const src = toFileUrl(question.mediaPath, basePath);
      if (round?.type === 'music') {
        media = `
          <div class="media-player">
            <audio id="q-audio" src="${src}" preload="auto"></audio>
            <div class="media-icon">🎵</div>
            <div class="media-label">Аудио вопрос</div>
          </div>`;
      } else if (round?.type === 'video') {
        // Видео с поддержкой startTime/endTime (управление с панели ведущего)
        const startTime = question.mediaStartTime || 0;
        const endTime = question.mediaEndTime || 0;
        media = `
          <video id="q-video" class="qvideo" src="${src}" 
                 data-start="${startTime}" 
                 data-end="${endTime}"
                 preload="auto"></video>`;
      } else {
        media = `<img src="${src}" class="qimg" onerror="this.style.display='none'" />`;
      }
    }
    
    // Контейнер с позиционированием медиа
    const mediaClass = ds.mediaPosition === 'left' ? 'media-left' : 
                       ds.mediaPosition === 'right' ? 'media-right' :
                       ds.mediaPosition === 'background' ? 'media-bg' : '';
    
    return `${base}
      <div class="h">
        ${ds.showRoundBadge ? `
        <div style="display:flex;align-items:center;gap:16px">
          <div class="rnum">${roundIdx + 1}</div>
          <div class="badge">${round?.name}</div>
        </div>` : '<div></div>'}
        ${ds.showTimer ? `<div id="timer" class="timer ${isWarn ? 'warn' : ''}" data-timelimit="${timeLimit}">${formatTime(time)}</div>` : ''}
        ${getProgressBar()}
      </div>
      <div class="c ${mediaClass}">
        ${ds.showQuestionNumber ? `<div class="qnum">Вопрос ${qIdx + 1} из ${totalQ}</div>` : ''}
        ${media}
        ${ds.showQuestionText ? `<div class="qtxt">${question.text}</div>` : ''}
        ${opts}
      </div>
      <script>
        // Timer sync script - updates timer without full page reload
        window.addEventListener('message', function(e) {
          if (e.data && e.data.type === 'pubquiz_timer') {
            const timer = document.getElementById('timer');
            const progress = document.getElementById('progress');
            const time = e.data.time;
            const timeLimit = e.data.timeLimit || 60;
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
          
          // Video control messages
          if (e.data && e.data.type === 'pubquiz_video') {
            const video = document.getElementById('q-video');
            if (!video) return;
            
            const action = e.data.action;
            const startTime = parseFloat(video.dataset.start) || 0;
            const endTime = parseFloat(video.dataset.end) || 0;
            
            if (action === 'play') {
              if (video.currentTime < startTime) video.currentTime = startTime;
              video.play();
            } else if (action === 'pause') {
              video.pause();
            } else if (action === 'stop') {
              video.pause();
              video.currentTime = startTime;
            } else if (action === 'seek') {
              video.currentTime = e.data.time || startTime;
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
        (function() {
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
        })();
      </script>`;
  }

  // Collect Blanks
  if (phase === 'collect-blanks') {
    return `${base}
      <div class="c">
        <div class="logo" style="background:linear-gradient(135deg,#8B5CF6,#EC4899)">📝</div>
        <h1 style="font-size:64px;margin-bottom:24px;font-weight:800">Сдаём бланки!</h1>
        <p style="font-size:32px;color:${colors.textSecondary}">Раунд "${round?.name}" завершён</p>
      </div>`;
  }

  // Show Answers
  if (phase === 'show-answers' && answer) {
    const opts = round?.type === 'choice' && answer.options
      ? `<div class="opts" style="margin-top:48px">${['A','B','C','D'].map((l,i) => 
          `<div class="opt ${answer.correctOptionIndex === i ? 'ok' : ''}"><div class="ol">${l}</div><div class="ot">${answer.options?.[i]||''}</div></div>`
        ).join('')}</div>`
      : '';
    const img = answer.mediaPath && ds.mediaPosition !== 'hidden'
      ? `<img src="${toFileUrl(answer.mediaPath, basePath)}" class="qimg" style="max-height:300px" onerror="this.style.display='none'" />`
      : '';
    return `${base}
      <div class="h">
        <div style="display:flex;align-items:center;gap:16px">
          <div class="rnum">${roundIdx + 1}</div>
          <div class="badge" style="background:linear-gradient(135deg,${colors.correct},#06B6D4)">Ответы: ${round?.name}</div>
        </div>
        <div style="font-size:32px;font-weight:700;color:${colors.textSecondary}">${aIdx + 1} / ${totalQ}</div>
      </div>
      <div class="c">
        <div class="qnum">Вопрос ${aIdx + 1}</div>
        ${img}
        <div class="qtxt" style="font-size:36px;margin-bottom:40px;color:${colors.textMuted}">${answer.text}</div>
        <div style="font-size:24px;color:${colors.textMuted};margin-bottom:20px">Правильный ответ:</div>
        <div class="atxt">${answer.answer}</div>
        ${opts}
      </div>`;
  }

  // Break
  if (phase === 'break') {
    return `${base}
      <div class="c">
        <div class="logo" style="background:linear-gradient(135deg,#F59E0B,#EF4444)">☕</div>
        <h1 style="font-size:72px;margin-bottom:24px;font-weight:800">Перерыв</h1>
        <p style="font-size:32px;color:${colors.textSecondary}">Самое время заказать напитки 🍺</p>
      </div>`;
  }

  // Standings / Game End
  if (phase === 'standings' || phase === 'game-end') {
    const sorted = [...teams].sort((a, b) => (totals[b.id] || 0) - (totals[a.id] || 0));
    const doneRounds = Object.keys(scores[teams[0]?.id] || {}).map(Number).sort((a, b) => a - b);
    
    return `${base}
      <div class="c" style="padding:40px">
        <h1 style="font-size:56px;margin-bottom:48px;font-weight:800">
          ${phase === 'game-end' ? '🏆 Финальные результаты' : '📊 Турнирная таблица'}
        </h1>
        <table>
          <thead>
            <tr>
              <th style="text-align:left">Команда</th>
              ${doneRounds.map(i => `<th>${formatName(game.rounds[i]?.name || 'Р' + (i + 1))}</th>`).join('')}
              <th class="tot">Итого</th>
            </tr>
          </thead>
          <tbody>
            ${sorted.map((t, i) => `
              <tr>
                <td>${i < 3 ? ['🥇', '🥈', '🥉'][i] + ' ' : ''}${t.name}</td>
                ${doneRounds.map(r => `<td>${scores[t.id]?.[r] ?? '-'}</td>`).join('')}
                <td class="tot">${totals[t.id] || 0}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>`;
  }

  // Default
  return `${base}
    <div class="c">
      <div class="logo">🎯</div>
      <h1 style="font-size:56px;font-weight:800">МелоМания</h1>
    </div>`;
};
