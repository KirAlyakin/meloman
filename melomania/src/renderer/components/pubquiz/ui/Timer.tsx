import React, { memo, useMemo, useCallback } from 'react';
import { DesignSystem, getStyles, formatTime } from '../designSystem';

interface TimerProps {
  time: number;
  timerOn: boolean;
  musicOn: boolean;
  sfxOn?: boolean;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
  onToggleMusic: () => void;
  onToggleSfx?: () => void;
  ds: DesignSystem;
}

const Timer: React.FC<TimerProps> = memo(({
  time, timerOn, musicOn, sfxOn = true,
  onStart, onStop, onReset, onToggleMusic, onToggleSfx,
  ds
}) => {
  const styles = useMemo(() => getStyles(ds), [ds]);
  const isWarning = time <= 5;

  // Memoized container style
  const containerStyle = useMemo(() => ({
    display: 'flex',
    alignItems: 'center',
    gap: 'clamp(6px, 1.5vw, 10px)',
    padding: 'clamp(6px, 1vw, 8px) clamp(10px, 2vw, 16px)',
    background: isWarning ? `${ds.accentDanger}15` : ds.bgTertiary,
    borderRadius: 12,
    border: `2px solid ${isWarning ? ds.accentDanger : ds.border}`,
    transition: 'background-color 0.2s, border-color 0.2s',
    contain: 'layout style',
  } as React.CSSProperties), [isWarning, ds.accentDanger, ds.bgTertiary, ds.border]);

  // Memoized button base style
  const buttonBaseStyle = useMemo(() => ({
    ...styles.btnSecondary,
    padding: 'clamp(4px, 0.8vw, 6px) clamp(8px, 1.2vw, 10px)',
    minWidth: '44px',
    minHeight: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    touchAction: 'manipulation',
    fontSize: 'clamp(0.9rem, 2vw, 1rem)',
  } as React.CSSProperties), [styles.btnSecondary]);

  // Memoized music button style
  const musicButtonStyle = useMemo(() => ({
    ...buttonBaseStyle,
    opacity: musicOn ? 1 : 0.5,
    background: musicOn ? `${ds.accentPurple}20` : ds.bgTertiary,
  } as React.CSSProperties), [buttonBaseStyle, musicOn, ds.accentPurple, ds.bgTertiary]);

  // Memoized sfx button style
  const sfxButtonStyle = useMemo(() => ({
    ...buttonBaseStyle,
    opacity: sfxOn ? 1 : 0.5,
    background: sfxOn ? `${ds.accentSuccess}20` : ds.bgTertiary,
  } as React.CSSProperties), [buttonBaseStyle, sfxOn, ds.accentSuccess, ds.bgTertiary]);

  // Memoized time display style
  const timeStyle = useMemo(() => ({
    fontSize: 'clamp(1.1rem, 3vw, 1.4rem)',
    fontWeight: 800,
    fontFamily: "'Manrope', monospace",
    fontVariantNumeric: 'tabular-nums',
    color: isWarning ? ds.accentDanger : ds.textPrimary,
    minWidth: 'clamp(45px, 10vw, 60px)',
    letterSpacing: '-1px',
    textAlign: 'center' as const,
    transition: 'color 0.2s',
  }), [isWarning, ds.accentDanger, ds.textPrimary]);

  // Memoized handlers to prevent unnecessary re-renders
  const handleToggleMusic = useCallback(() => onToggleMusic(), [onToggleMusic]);
  const handleToggleSfx = useCallback(() => onToggleSfx?.(), [onToggleSfx]);
  const handleStart = useCallback(() => onStart(), [onStart]);
  const handleStop = useCallback(() => onStop(), [onStop]);
  const handleReset = useCallback(() => onReset(), [onReset]);

  return (
    <div style={containerStyle}>
      <button
        onClick={handleToggleMusic}
        aria-label={musicOn ? 'Выключить музыку' : 'Включить музыку'}
        aria-pressed={musicOn}
        title={musicOn ? 'Музыка вкл' : 'Музыка выкл'}
        style={musicButtonStyle}
      >
        {musicOn ? '🎵' : '🔇'}
      </button>

      {onToggleSfx && (
        <button
          onClick={handleToggleSfx}
          aria-label={sfxOn ? 'Выключить эффекты' : 'Включить эффекты'}
          aria-pressed={sfxOn}
          title={sfxOn ? 'Эффекты вкл' : 'Эффекты выкл'}
          style={sfxButtonStyle}
        >
          {sfxOn ? '🔔' : '🔕'}
        </button>
      )}

      <span 
        style={timeStyle}
        role="timer"
        aria-live="polite"
        aria-atomic="true"
      >
        {formatTime(time)}
      </span>

      {timerOn ? (
        <button 
          onClick={handleStop} 
          aria-label="Пауза"
          style={buttonBaseStyle}
        >
          ⏸
        </button>
      ) : (
        <button 
          onClick={handleStart} 
          aria-label="Старт"
          style={buttonBaseStyle}
        >
          ▶
        </button>
      )}

      <button 
        onClick={handleReset} 
        aria-label="Сбросить таймер"
        style={buttonBaseStyle}
      >
        ↺
      </button>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison - only re-render when these props change
  return (
    prevProps.time === nextProps.time &&
    prevProps.timerOn === nextProps.timerOn &&
    prevProps.musicOn === nextProps.musicOn &&
    prevProps.sfxOn === nextProps.sfxOn &&
    prevProps.ds === nextProps.ds
  );
});

Timer.displayName = 'Timer';

export default Timer;
