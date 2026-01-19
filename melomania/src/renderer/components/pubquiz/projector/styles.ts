// Projector CSS styles - Optimized v7.0
// Performance: GPU acceleration, contain, will-change
// Responsive: clamp(), viewport units, container queries
// Compatibility: reduced-motion, touch, fallbacks

export const projectorCSS = `
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');

/* ============================================
   CSS CUSTOM PROPERTIES (Performance + Theming)
   ============================================ */
:root {
  /* Responsive typography using clamp */
  --fs-xs: clamp(0.75rem, 1.5vw, 1rem);
  --fs-sm: clamp(1rem, 2vw, 1.25rem);
  --fs-md: clamp(1.25rem, 2.5vw, 1.5rem);
  --fs-lg: clamp(1.5rem, 3vw, 2rem);
  --fs-xl: clamp(2rem, 4vw, 3rem);
  --fs-2xl: clamp(2.5rem, 5vw, 4rem);
  --fs-3xl: clamp(3rem, 6vw, 5rem);
  --fs-timer: clamp(2.5rem, 5vw, 3.5rem);
  
  /* Spacing */
  --space-xs: clamp(0.5rem, 1vw, 0.75rem);
  --space-sm: clamp(0.75rem, 1.5vw, 1rem);
  --space-md: clamp(1rem, 2vw, 1.5rem);
  --space-lg: clamp(1.5rem, 3vw, 2.5rem);
  --space-xl: clamp(2rem, 4vw, 3.5rem);
  
  /* Animation timing */
  --transition-fast: 150ms;
  --transition-normal: 250ms;
  --transition-slow: 400ms;
  
  /* Touch targets (min 44px for accessibility) */
  --touch-target: max(44px, 2.75rem);
}

/* ============================================
   RESET & BASE
   ============================================ */
*, *::before, *::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  /* Smooth scrolling with reduced-motion support */
  scroll-behavior: smooth;
  /* Prevent text size adjustment on orientation change */
  -webkit-text-size-adjust: 100%;
  text-size-adjust: 100%;
}

body {
  font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: var(--bg-gradient, linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%));
  color: var(--text-primary, #f1f5f9);
  min-height: 100vh;
  min-height: 100dvh; /* Dynamic viewport height for mobile */
  display: flex;
  flex-direction: column;
  /* Performance */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
  /* Prevent overscroll bounce on iOS */
  overscroll-behavior: none;
  overflow: hidden;
}

/* ============================================
   LAYOUT CONTAINERS
   ============================================ */
.c {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: var(--space-xl);
  /* Performance: isolate rendering */
  contain: layout style;
  /* Safe area for notched devices */
  padding-left: max(var(--space-xl), env(safe-area-inset-left));
  padding-right: max(var(--space-xl), env(safe-area-inset-right));
  padding-bottom: max(var(--space-xl), env(safe-area-inset-bottom));
}

/* Media layout variants */
.c.media-left {
  flex-direction: row;
  gap: var(--space-xl);
}

.c.media-right {
  flex-direction: row-reverse;
  gap: var(--space-xl);
}

.c.media-bg {
  position: relative;
}

.c.media-bg::before {
  content: '';
  position: absolute;
  inset: 0;
  background: inherit;
  opacity: 0.3;
  filter: blur(20px);
  z-index: -1;
}

/* ============================================
   HEADER
   ============================================ */
.h {
  background: var(--bg-header, rgba(30, 41, 59, 0.8));
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  padding: var(--space-md) var(--space-lg);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-md);
  border-bottom: 1px solid var(--border-color, rgba(148, 163, 184, 0.15));
  position: relative;
  /* Performance */
  contain: layout style;
  /* Safe area */
  padding-top: max(var(--space-md), env(safe-area-inset-top));
  padding-left: max(var(--space-lg), env(safe-area-inset-left));
  padding-right: max(var(--space-lg), env(safe-area-inset-right));
}

/* Round number badge */
.rnum {
  width: var(--touch-target);
  height: var(--touch-target);
  background: var(--accent-gradient, linear-gradient(135deg, #3B82F6, #8B5CF6));
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: var(--fs-lg);
  flex-shrink: 0;
}

/* Progress bar */
.progress-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 4px;
  background: var(--accent-gradient, linear-gradient(90deg, #3B82F6, #8B5CF6));
  border-radius: 0 2px 2px 0;
  /* GPU-accelerated transition */
  will-change: width;
  transition: width 1s linear;
  transform: translateZ(0);
}

.progress-bar.warn {
  background: linear-gradient(90deg, #ef4444, #f97316);
}

/* Badge */
.badge {
  background: var(--accent-gradient, linear-gradient(135deg, #3B82F6, #8B5CF6));
  padding: var(--space-sm) var(--space-md);
  border-radius: 12px;
  font-weight: 600;
  font-size: var(--fs-md);
  white-space: nowrap;
  /* Performance */
  contain: layout style paint;
}

/* Timer */
.timer {
  font-size: var(--fs-timer);
  font-weight: 800;
  font-family: 'Manrope', monospace;
  font-variant-numeric: tabular-nums;
  min-width: 8ch;
  text-align: right;
  /* GPU acceleration for animations */
  will-change: transform, color;
  transform: translateZ(0);
}

.timer.warn {
  color: #ef4444;
  text-shadow: 0 0 30px rgba(239, 68, 68, 0.5);
  animation: pulse 0.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1) translateZ(0); }
  50% { transform: scale(1.05) translateZ(0); }
}

/* ============================================
   QUESTION DISPLAY
   ============================================ */
.qnum {
  font-size: var(--fs-md);
  color: var(--text-muted, #94a3b8);
  margin-bottom: var(--space-md);
  text-align: center;
}

.qtxt {
  font-size: var(--fs-2xl);
  font-weight: 700;
  text-align: center;
  line-height: 1.3;
  max-width: min(1400px, 90vw);
  /* Performance */
  contain: layout style;
  /* Better text wrapping */
  text-wrap: balance;
  overflow-wrap: break-word;
  hyphens: auto;
}

.atxt {
  font-size: var(--fs-3xl);
  font-weight: 800;
  color: var(--color-correct, #10b981);
  text-align: center;
  text-shadow: 0 0 40px rgba(16, 185, 129, 0.4);
  /* Performance */
  contain: layout style;
  text-wrap: balance;
}

/* ============================================
   LOGO / ICON
   ============================================ */
.logo {
  width: clamp(100px, 15vw, 140px);
  height: clamp(100px, 15vw, 140px);
  aspect-ratio: 1;
  background: var(--accent-gradient, linear-gradient(135deg, #3B82F6, #8B5CF6));
  border-radius: clamp(20px, 3vw, 32px);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: clamp(40px, 8vw, 70px);
  margin: 0 auto var(--space-lg);
  box-shadow: 0 20px 50px var(--shadow-accent, rgba(59, 130, 246, 0.3));
  /* Performance */
  contain: layout style paint;
  will-change: transform;
  transform: translateZ(0);
}

/* ============================================
   CHOICE OPTIONS (A, B, C, D)
   ============================================ */
.opts {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-md);
  margin-top: var(--space-xl);
  max-width: min(1200px, 95vw);
  width: 100%;
  /* Performance */
  contain: layout style;
}

/* Single column on narrow screens */
@media (max-width: 800px) {
  .opts {
    grid-template-columns: 1fr;
  }
}

.opt {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  padding: var(--space-md) var(--space-lg);
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: var(--space-md);
  border: 1px solid rgba(255, 255, 255, 0.1);
  min-height: var(--touch-target);
  /* Performance */
  contain: layout style;
  will-change: transform, background-color;
  transition: transform var(--transition-fast), 
              background-color var(--transition-fast),
              border-color var(--transition-fast);
}

.opt.ok {
  background: rgba(16, 185, 129, 0.2);
  border: 2px solid #10b981;
  box-shadow: 0 0 30px rgba(16, 185, 129, 0.2);
}

.ol {
  width: clamp(48px, 6vw, 64px);
  height: clamp(48px, 6vw, 64px);
  background: rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: var(--fs-xl);
  flex-shrink: 0;
}

.opt.ok .ol {
  background: #10b981;
}

.ot {
  font-size: var(--fs-lg);
  font-weight: 500;
  flex: 1;
  /* Better text handling */
  overflow-wrap: break-word;
  hyphens: auto;
}

/* ============================================
   MEDIA (Images, Video, Audio)
   ============================================ */
.qimg {
  max-width: min(700px, 90vw);
  max-height: min(450px, 50vh);
  width: auto;
  height: auto;
  border-radius: 20px;
  margin-bottom: var(--space-lg);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
  /* Performance */
  contain: layout;
  /* Smooth image loading */
  background: rgba(255, 255, 255, 0.05);
}

.qvideo {
  max-width: min(900px, 95vw);
  max-height: min(500px, 60vh);
  width: 100%;
  height: auto;
  border-radius: 20px;
  margin-bottom: var(--space-lg);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
  /* Performance */
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
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.media-label {
  font-size: var(--fs-md);
  color: var(--text-muted, #94a3b8);
}

/* ============================================
   STANDINGS TABLE
   ============================================ */
table {
  width: 100%;
  max-width: min(1400px, 95vw);
  border-collapse: collapse;
  background: rgba(30, 41, 59, 0.6);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 20px;
  overflow: hidden;
  /* Performance */
  contain: layout style;
}

th, td {
  padding: var(--space-md) var(--space-sm);
  text-align: center;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
}

th {
  background: rgba(0, 0, 0, 0.3);
  font-weight: 700;
  font-size: var(--fs-sm);
  white-space: pre-wrap;
  line-height: 1.3;
}

td {
  font-size: var(--fs-md);
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
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.2));
  font-weight: 800;
  font-size: var(--fs-xl) !important;
}

/* Medal colors */
tbody tr:first-child td { color: #fbbf24; }
tbody tr:nth-child(2) td { color: #d1d5db; }
tbody tr:nth-child(3) td { color: #d97706; }

/* ============================================
   ATMOSPHERE EFFECTS (GPU-Optimized)
   ============================================ */
.atmosphere {
  position: fixed;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 0;
  /* Performance: isolate this layer */
  contain: strict;
  /* Force GPU layer */
  transform: translateZ(0);
  will-change: contents;
}

/* Base particle/effect styles */
.snowflake, .particle, .sparkle, .leaf, .petal, .bubble {
  position: absolute;
  /* GPU-accelerated animations */
  will-change: transform, opacity;
  transform: translateZ(0);
  backface-visibility: hidden;
}

/* Snowflakes */
.snowflake {
  color: #fff;
  font-size: 1.8em;
  opacity: 0.8;
  text-shadow: 0 0 4px rgba(255, 255, 255, 0.8);
  animation: drift linear infinite;
}

@keyframes drift {
  0% { transform: translateY(0) translateX(0) rotate(0deg) translateZ(0); }
  25% { transform: translateY(25vh) translateX(15px) rotate(90deg) translateZ(0); }
  50% { transform: translateY(50vh) translateX(-10px) rotate(180deg) translateZ(0); }
  75% { transform: translateY(75vh) translateX(20px) rotate(270deg) translateZ(0); }
  100% { transform: translateY(100vh) translateX(0) rotate(360deg) translateZ(0); }
}

/* Cyber theme particles */
.snowflake.cyan { 
  color: #00d4ff; 
  text-shadow: 0 0 10px #00d4ff, 0 0 20px #00d4ff; 
}
.snowflake.purple { 
  color: #bf00ff; 
  text-shadow: 0 0 10px #bf00ff, 0 0 20px #bf00ff; 
}
.snowflake.white { 
  color: #fff; 
  text-shadow: 0 0 8px #fff, 0 0 15px #00d4ff; 
}

@keyframes cyber-drift {
  0% { transform: translateY(0) rotate(0deg) translateZ(0); opacity: 0.9; }
  50% { transform: translateY(50vh) rotate(180deg) translateZ(0); opacity: 1; }
  100% { transform: translateY(100vh) rotate(360deg) translateZ(0); opacity: 0.7; }
}

/* Emerald particles */
.particle {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  animation: float-up linear infinite;
}

.particle.bright {
  background: #00ff7f;
  box-shadow: 0 0 8px #00ff7f, 0 0 15px #00ff7f;
}

.particle.dim {
  background: #00cc66;
  box-shadow: 0 0 5px #00cc66;
}

@keyframes float-up {
  0% { transform: translateY(100vh) scale(0) translateZ(0); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { transform: translateY(-50px) scale(1) translateZ(0); opacity: 0; }
}

/* Gold sparkles */
.sparkle {
  font-size: 1.5em;
  color: #ffd700;
  text-shadow: 0 0 10px #ffd700, 0 0 20px #ffb000;
  animation: sparkle-float linear infinite;
}

@keyframes sparkle-float {
  0% { transform: translateY(0) scale(0.8) translateZ(0); opacity: 0.3; }
  50% { transform: translateY(-30px) scale(1.2) translateZ(0); opacity: 1; }
  100% { transform: translateY(-60px) scale(0.8) translateZ(0); opacity: 0; }
}

/* Leaves */
.leaf {
  font-size: 2em;
  animation: fall-leaf linear infinite;
}

@keyframes fall-leaf {
  0% { transform: translateY(-100px) rotate(0deg) translateZ(0); }
  100% { transform: translateY(100vh) rotate(360deg) translateZ(0); }
}

/* Petals */
.petal {
  font-size: 1.8em;
  animation: fall-petal linear infinite;
}

@keyframes fall-petal {
  0% { transform: translate(0, -100px) rotate(0deg) translateZ(0); }
  50% { transform: translate(40px, 50vh) rotate(180deg) translateZ(0); }
  100% { transform: translate(0, 100vh) rotate(360deg) translateZ(0); }
}

/* Bubbles */
.bubble {
  border-radius: 50%;
  animation: rise linear infinite;
}

@keyframes rise {
  0% { transform: translateY(100vh) scale(0) translateZ(0); }
  100% { transform: translateY(-100px) scale(1) translateZ(0); }
}

/* ============================================
   ACCESSIBILITY: Reduced Motion
   ============================================ */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
  
  .atmosphere {
    display: none !important;
  }
  
  .timer.warn {
    animation: none;
  }
  
  .progress-bar {
    transition: none;
  }
}

/* ============================================
   RESPONSIVE BREAKPOINTS
   ============================================ */

/* Tablets (landscape) */
@media (max-width: 1024px) {
  .c {
    padding: var(--space-lg);
  }
  
  .h {
    padding: var(--space-sm) var(--space-md);
  }
  
  .badge {
    padding: var(--space-xs) var(--space-sm);
    font-size: var(--fs-sm);
  }
}

/* Tablets (portrait) / Large phones */
@media (max-width: 768px) {
  :root {
    --fs-timer: clamp(2rem, 6vw, 2.5rem);
  }
  
  .h {
    flex-wrap: wrap;
    gap: var(--space-sm);
  }
  
  .timer {
    min-width: 6ch;
  }
  
  .qtxt {
    font-size: var(--fs-xl);
  }
  
  .atxt {
    font-size: var(--fs-2xl);
  }
  
  table {
    font-size: var(--fs-sm);
  }
  
  th, td {
    padding: var(--space-sm) var(--space-xs);
  }
}

/* Small phones */
@media (max-width: 480px) {
  .c {
    padding: var(--space-md);
  }
  
  .h {
    padding: var(--space-xs) var(--space-sm);
  }
  
  .logo {
    margin-bottom: var(--space-md);
  }
  
  .qimg {
    max-height: 35vh;
    margin-bottom: var(--space-md);
  }
  
  .opts {
    gap: var(--space-sm);
  }
  
  .opt {
    padding: var(--space-sm);
    gap: var(--space-sm);
  }
  
  td:first-child {
    max-width: 120px;
  }
}

/* Landscape phones */
@media (max-height: 500px) and (orientation: landscape) {
  .c {
    padding: var(--space-sm);
  }
  
  .logo {
    width: 80px;
    height: 80px;
    font-size: 40px;
    margin-bottom: var(--space-sm);
  }
  
  .qimg {
    max-height: 40vh;
  }
}

/* High DPI displays */
@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
  .qimg, .qvideo {
    image-rendering: -webkit-optimize-contrast;
  }
}

/* Print styles */
@media print {
  .atmosphere { display: none !important; }
  .progress-bar { display: none !important; }
  
  body {
    background: white !important;
    color: black !important;
  }
  
  .h {
    background: #f0f0f0 !important;
    border-bottom: 2px solid #333 !important;
  }
  
  .timer.warn {
    color: #c00 !important;
    animation: none !important;
  }
}

/* ============================================
   DARK/LIGHT MODE SUPPORT
   ============================================ */
@media (prefers-color-scheme: light) {
  :root {
    --shadow-accent: rgba(59, 130, 246, 0.2);
  }
}

/* ============================================
   FOCUS STYLES (Accessibility)
   ============================================ */
:focus-visible {
  outline: 3px solid var(--accent-color, #3B82F6);
  outline-offset: 2px;
}

/* ============================================
   SELECTION STYLES
   ============================================ */
::selection {
  background: var(--accent-color, #3B82F6);
  color: white;
}
`;
