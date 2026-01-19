import React, { useRef, useState, useEffect, memo, useCallback, useMemo } from 'react';
import { DesignSystem, getStyles, toFileUrl, formatTime } from '../designSystem';

interface MediaPlayerProps {
  type: 'picture' | 'music' | 'video';
  src: string;
  basePath?: string;
  startTime?: number;
  endTime?: number;
  autoPlay?: boolean;
  showControls?: boolean;
  compact?: boolean;
  ds: DesignSystem;
  onEnded?: () => void;
}

// Throttle helper for performance - limits updates to once per interval
const throttle = <T extends (...args: any[]) => void>(fn: T, wait: number): T => {
  let lastTime = 0;
  return ((...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastTime >= wait) {
      lastTime = now;
      fn(...args);
    }
  }) as T;
};

const MediaPlayer: React.FC<MediaPlayerProps> = memo(({
  type,
  src,
  basePath,
  startTime = 0,
  endTime,
  autoPlay = false,
  showControls = true,
  compact = false,
  ds,
  onEnded
}) => {
  // Memoize styles to prevent recalculation
  const styles = useMemo(() => getStyles(ds), [ds]);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const mediaRef = type === 'music' ? audioRef : videoRef;
  
  // Memoize file URL
  const fileSrc = useMemo(() => toFileUrl(src, basePath), [src, basePath]);

  // Memoized button styles for performance
  const buttonStyles = useMemo(() => ({
    playButton: {
      ...styles.btnSecondary,
      padding: '8px 14px',
      minWidth: '44px',
      minHeight: '44px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      touchAction: 'manipulation',
    } as React.CSSProperties,
    stopButton: {
      ...styles.btnSecondary,
      padding: '8px 12px',
      minWidth: '44px',
      minHeight: '44px',
      touchAction: 'manipulation',
    } as React.CSSProperties,
  }), [styles]);

  // Throttled time update - updates every 250ms instead of every frame
  const throttledSetTime = useMemo(
    () => throttle((time: number) => setCurrentTime(time), 250),
    []
  );

  // Media event handlers
  useEffect(() => {
    const media = mediaRef.current;
    if (!media) return;

    const handleTimeUpdate = () => {
      throttledSetTime(media.currentTime);
      
      // Stop at endTime
      if (endTime && media.currentTime >= endTime) {
        media.pause();
        setIsPlaying(false);
        onEnded?.();
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(media.duration);
      setIsLoaded(true);
      if (startTime > 0) {
        media.currentTime = startTime;
      }
      if (autoPlay) {
        media.play().catch(() => {});
        setIsPlaying(true);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      onEnded?.();
    };

    const handleError = () => setError(true);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    media.addEventListener('timeupdate', handleTimeUpdate);
    media.addEventListener('loadedmetadata', handleLoadedMetadata);
    media.addEventListener('ended', handleEnded);
    media.addEventListener('error', handleError);
    media.addEventListener('play', handlePlay);
    media.addEventListener('pause', handlePause);

    return () => {
      media.removeEventListener('timeupdate', handleTimeUpdate);
      media.removeEventListener('loadedmetadata', handleLoadedMetadata);
      media.removeEventListener('ended', handleEnded);
      media.removeEventListener('error', handleError);
      media.removeEventListener('play', handlePlay);
      media.removeEventListener('pause', handlePause);
    };
  }, [startTime, endTime, autoPlay, onEnded, throttledSetTime, mediaRef]);

  // Toggle play/pause with useCallback for stable reference
  const togglePlay = useCallback(() => {
    const media = mediaRef.current;
    if (!media) return;

    if (isPlaying) {
      media.pause();
    } else {
      if (startTime && media.currentTime < startTime) {
        media.currentTime = startTime;
      }
      media.play().catch(() => {});
    }
  }, [isPlaying, startTime, mediaRef]);

  // Stop playback
  const stop = useCallback(() => {
    const media = mediaRef.current;
    if (!media) return;
    media.pause();
    media.currentTime = startTime || 0;
    setCurrentTime(startTime || 0);
  }, [startTime, mediaRef]);

  // Calculate progress percentage
  const effectiveDuration = endTime ? endTime - startTime : duration - startTime;
  const progress = effectiveDuration > 0 ? ((currentTime - startTime) / effectiveDuration) * 100 : 0;

  // === PICTURE ===
  if (type === 'picture') {
    if (error) return null;
    
    return (
      <div style={{ 
        textAlign: 'center', 
        marginBottom: compact ? 8 : 16,
        contain: 'layout style',
      }}>
        <img
          src={fileSrc}
          alt="Медиа"
          loading="lazy"
          decoding="async"
          style={{
            maxWidth: '100%',
            maxHeight: compact ? 120 : 200,
            borderRadius: compact ? 8 : 12,
            boxShadow: ds.shadowSm,
            backgroundColor: ds.bgTertiary,
          }}
          onError={() => setError(true)}
        />
      </div>
    );
  }

  // === AUDIO ===
  if (type === 'music') {
    return (
      <div style={{
        padding: compact ? '10px 14px' : '14px 18px',
        background: `${ds.accent}10`,
        border: `1px solid ${ds.accent}40`,
        borderRadius: 12,
        marginBottom: compact ? 8 : 16,
        contain: 'layout style',
      }}>
        <audio ref={audioRef} src={fileSrc} preload="metadata" />
        
        {showControls && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={togglePlay}
              aria-label={isPlaying ? 'Пауза' : 'Воспроизвести'}
              style={{
                ...buttonStyles.playButton,
                background: isPlaying ? `${ds.accentWarning}20` : `${ds.accent}20`,
                color: isPlaying ? ds.accentWarning : ds.accent,
                borderColor: isPlaying ? ds.accentWarning : ds.accent,
              }}
            >
              {isPlaying ? '⏸' : '▶'}
            </button>
            
            <button 
              onClick={stop} 
              aria-label="Стоп"
              style={buttonStyles.stopButton}
            >
              ⏹
            </button>

            {/* Progress bar with GPU acceleration */}
            <div 
              style={{ 
                flex: 1, 
                height: 6, 
                background: ds.bgTertiary, 
                borderRadius: 3, 
                overflow: 'hidden',
                contain: 'strict',
              }}
              role="progressbar"
              aria-valuenow={Math.round(progress)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div style={{
                width: `${Math.min(100, Math.max(0, progress))}%`,
                height: '100%',
                background: ds.gradientBrand,
                transition: 'width 0.25s linear',
                willChange: 'width',
                transform: 'translateZ(0)',
              }} />
            </div>

            <span style={{ 
              fontSize: '0.8rem', 
              color: ds.textMuted, 
              minWidth: 80, 
              textAlign: 'right',
              fontVariantNumeric: 'tabular-nums',
            }}>
              {formatTime(currentTime)} / {formatTime(endTime || duration)}
            </span>
          </div>
        )}

        {error && (
          <p style={{ color: ds.accentDanger, fontSize: '0.8rem', margin: '8px 0 0' }}>
            ❌ Ошибка загрузки
          </p>
        )}
      </div>
    );
  }

  // === VIDEO ===
  if (type === 'video') {
    return (
      <div style={{ 
        marginBottom: compact ? 8 : 16,
        contain: 'layout style',
      }}>
        <video
          ref={videoRef}
          src={fileSrc}
          preload="metadata"
          playsInline
          style={{
            maxWidth: '100%',
            maxHeight: compact ? 150 : 250,
            borderRadius: 12,
            background: '#000',
            display: 'block',
          }}
          onError={() => setError(true)}
        />

        {showControls && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginTop: 10,
            padding: '10px 14px',
            background: ds.bgTertiary,
            borderRadius: 10,
          }}>
            <button
              onClick={togglePlay}
              aria-label={isPlaying ? 'Пауза' : 'Воспроизвести'}
              style={{
                ...buttonStyles.playButton,
                background: isPlaying ? `${ds.accentWarning}20` : `${ds.accent}20`,
                color: isPlaying ? ds.accentWarning : ds.accent,
              }}
            >
              {isPlaying ? '⏸' : '▶'}
            </button>

            <button 
              onClick={stop} 
              aria-label="Стоп"
              style={buttonStyles.stopButton}
            >
              ⏹
            </button>

            <div 
              style={{ 
                flex: 1, 
                height: 6, 
                background: ds.bgSecondary, 
                borderRadius: 3, 
                overflow: 'hidden',
                contain: 'strict',
              }}
              role="progressbar"
              aria-valuenow={Math.round(progress)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div style={{
                width: `${Math.min(100, Math.max(0, progress))}%`,
                height: '100%',
                background: ds.gradientBrand,
                transition: 'width 0.25s linear',
                transform: 'translateZ(0)',
              }} />
            </div>

            <span style={{ 
              fontSize: '0.8rem', 
              color: ds.textMuted,
              fontVariantNumeric: 'tabular-nums',
            }}>
              {formatTime(currentTime)} / {formatTime(endTime || duration)}
            </span>
          </div>
        )}

        {error && (
          <p style={{ color: ds.accentDanger, fontSize: '0.8rem' }}>
            ❌ Ошибка загрузки видео
          </p>
        )}
      </div>
    );
  }

  return null;
}, (prevProps, nextProps) => {
  // Custom comparison for better memoization
  return (
    prevProps.type === nextProps.type &&
    prevProps.src === nextProps.src &&
    prevProps.basePath === nextProps.basePath &&
    prevProps.startTime === nextProps.startTime &&
    prevProps.endTime === nextProps.endTime &&
    prevProps.autoPlay === nextProps.autoPlay &&
    prevProps.showControls === nextProps.showControls &&
    prevProps.compact === nextProps.compact &&
    prevProps.ds === nextProps.ds
  );
});

MediaPlayer.displayName = 'MediaPlayer';

export default MediaPlayer;
