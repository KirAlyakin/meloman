import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Theme } from '../types/game';

interface DecorationProps {
  theme: Theme;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  rotation?: number;
}

// Цвета гирлянды
const garlandColors = ['#ff4444', '#44ff44', '#ffff44', '#4444ff', '#ff44ff', '#44ffff', '#ff8844', '#ff4488'];

// Компонент гирлянды
const Garland: React.FC<{ position: 'top' | 'left' | 'right' | 'bottom' }> = ({ position }) => {
  const bulbCount = position === 'top' || position === 'bottom' ? 30 : 20;
  
  const getStyle = (): React.CSSProperties => {
    switch (position) {
      case 'top':
        return { top: 0, left: 0, right: 0, height: 40, flexDirection: 'row' };
      case 'bottom':
        return { bottom: 0, left: 0, right: 0, height: 40, flexDirection: 'row' };
      case 'left':
        return { top: 0, bottom: 0, left: 0, width: 40, flexDirection: 'column' };
      case 'right':
        return { top: 0, bottom: 0, right: 0, width: 40, flexDirection: 'column' };
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        zIndex: 1000,
        ...getStyle()
      } as React.CSSProperties}
    >
      {/* Провод */}
      <div
        style={{
          position: 'absolute',
          background: '#2a5a2a',
          ...(position === 'top' || position === 'bottom' 
            ? { height: 3, left: 0, right: 0, top: '50%', transform: 'translateY(-50%)' }
            : { width: 3, top: 0, bottom: 0, left: '50%', transform: 'translateX(-50%)' }
          )
        }}
      />
      
      {/* Лампочки */}
      {Array.from({ length: bulbCount }).map((_, i) => {
        const color = garlandColors[i % garlandColors.length];
        const delay = i * 0.15;
        
        return (
          <motion.div
            key={i}
            style={{
              width: 12,
              height: 16,
              borderRadius: '50% 50% 50% 50% / 40% 40% 60% 60%',
              background: color,
              position: 'relative',
              zIndex: 1
            }}
            animate={{
              boxShadow: [
                `0 0 8px 4px ${color}80, 0 0 20px 8px ${color}40`,
                `0 0 15px 8px ${color}cc, 0 0 35px 15px ${color}60`,
                `0 0 8px 4px ${color}80, 0 0 20px 8px ${color}40`
              ],
              scale: [1, 1.1, 1]
            }}
            transition={{
              duration: 0.8 + Math.random() * 0.4,
              delay: delay,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          >
            {/* Цоколь */}
            <div
              style={{
                position: 'absolute',
                top: -4,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 6,
                height: 5,
                background: '#888',
                borderRadius: '2px 2px 0 0'
              }}
            />
          </motion.div>
        );
      })}
    </div>
  );
};

const Decorations: React.FC<DecorationProps> = ({ theme }) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!theme.particles?.enabled) {
      setParticles([]);
      return;
    }

    const count = theme.particles.type === 'aurora' ? 8 : 
                  theme.particles.type === 'snowflakes' ? 50 : 30;
    const newParticles: Particle[] = [];
    
    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: theme.particles.type === 'aurora' ? 200 + Math.random() * 300 : 
              theme.particles.type === 'snowflakes' ? 4 + Math.random() * 12 : 
              4 + Math.random() * 8,
        delay: Math.random() * 8,
        duration: theme.particles.type === 'snowflakes' ? 8 + Math.random() * 12 : 15 + Math.random() * 20,
        rotation: Math.random() * 360
      });
    }
    
    setParticles(newParticles);
  }, [theme]);

  const isWinter = theme.particles?.type === 'snowflakes';

  const renderParticle = (particle: Particle) => {
    const { type, color, secondaryColor } = theme.particles!;
    
    switch (type) {
      case 'snowflakes':
        return (
          <motion.div
            key={particle.id}
            style={{
              position: 'absolute',
              left: `${particle.x}%`,
              top: -20,
              width: particle.size,
              height: particle.size,
              background: 'radial-gradient(circle, #ffffff 0%, #ffffff 40%, transparent 70%)',
              borderRadius: '50%',
              pointerEvents: 'none',
              boxShadow: '0 0 10px 2px rgba(255,255,255,0.5)'
            }}
            animate={{
              y: ['0vh', '105vh'],
              x: [0, Math.sin(particle.id * 0.5) * 80, Math.sin(particle.id * 0.3) * 40, 0],
              rotate: [0, 360],
              opacity: [0.9, 1, 0.9]
            }}
            transition={{
              duration: particle.duration,
              delay: particle.delay,
              repeat: Infinity,
              ease: 'linear'
            }}
          />
        );
        
      case 'aurora':
        return (
          <motion.div
            key={particle.id}
            style={{
              position: 'absolute',
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: particle.size,
              height: particle.size * 0.3,
              background: `linear-gradient(135deg, ${color}15, ${secondaryColor || color}10, transparent)`,
              borderRadius: '50%',
              filter: 'blur(40px)',
              pointerEvents: 'none'
            }}
            animate={{
              x: [0, 50, -30, 0],
              y: [0, -30, 20, 0],
              scale: [1, 1.2, 0.9, 1],
              opacity: [0.4, 0.7, 0.3, 0.4]
            }}
            transition={{
              duration: particle.duration,
              delay: particle.delay,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
        );
      
      case 'geometric':
        return (
          <motion.div
            key={particle.id}
            style={{
              position: 'absolute',
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: particle.size,
              height: particle.size,
              border: `1px solid ${color}`,
              borderRadius: particle.id % 2 === 0 ? '50%' : '2px',
              pointerEvents: 'none'
            }}
            animate={{
              rotate: [0, 180, 360],
              scale: [1, 1.1, 1],
              opacity: [0.1, 0.2, 0.1]
            }}
            transition={{
              duration: particle.duration,
              delay: particle.delay,
              repeat: Infinity,
              ease: 'linear'
            }}
          />
        );
      
      case 'dots':
        return (
          <motion.div
            key={particle.id}
            style={{
              position: 'absolute',
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: particle.size,
              height: particle.size,
              background: color,
              borderRadius: '50%',
              pointerEvents: 'none'
            }}
            animate={{
              opacity: [0.2, 0.5, 0.2]
            }}
            transition={{
              duration: particle.duration * 0.5,
              delay: particle.delay,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
        );
      
      case 'lines':
        return (
          <motion.div
            key={particle.id}
            style={{
              position: 'absolute',
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: particle.size * 10,
              height: 1,
              background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
              transform: `rotate(${particle.rotation}deg)`,
              pointerEvents: 'none'
            }}
            animate={{
              opacity: [0.15, 0.4, 0.15],
              scaleX: [0.8, 1.2, 0.8]
            }}
            transition={{
              duration: particle.duration * 0.5,
              delay: particle.delay,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
        );
      
      case 'leaves':
        return (
          <motion.div
            key={particle.id}
            style={{
              position: 'absolute',
              left: `${particle.x}%`,
              top: -20,
              fontSize: particle.size * 2,
              pointerEvents: 'none',
              opacity: 0.7
            }}
            animate={{
              y: ['0vh', '110vh'],
              x: [0, Math.sin(particle.id) * 50],
              rotate: [0, 360]
            }}
            transition={{
              duration: particle.duration,
              delay: particle.delay,
              repeat: Infinity,
              ease: 'linear'
            }}
          >
            {['🍂', '🍁', '🍃'][particle.id % 3]}
          </motion.div>
        );
      
      case 'petals':
        return (
          <motion.div
            key={particle.id}
            style={{
              position: 'absolute',
              left: `${particle.x}%`,
              top: -20,
              fontSize: particle.size * 1.5,
              pointerEvents: 'none',
              opacity: 0.8
            }}
            animate={{
              y: ['0vh', '110vh'],
              x: [0, Math.sin(particle.id) * 30, 0],
              rotate: [0, 180, 360]
            }}
            transition={{
              duration: particle.duration,
              delay: particle.delay,
              repeat: Infinity,
              ease: 'linear'
            }}
          >
            {['🌸', '💮', '🏵️'][particle.id % 3]}
          </motion.div>
        );
      
      default:
        return null;
    }
  };

  if (!theme.particles?.enabled) {
    return null;
  }

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0
      }}
    >
      {/* Гирлянды для новогодней темы */}
      {isWinter && (
        <>
          <Garland position="top" />
          <Garland position="left" />
          <Garland position="right" />
        </>
      )}
      
      {/* Частицы */}
      {particles.map(renderParticle)}
    </div>
  );
};

export default Decorations;
