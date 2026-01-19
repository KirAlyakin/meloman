import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Team, ThemeId } from '../types/game';
import { getTheme } from '../themes';

interface ScoreboardProps {
  teams: Team[];
  theme: ThemeId;
  respondingTeamId?: string | null;
  showScores?: boolean;
  compact?: boolean;
}

const Scoreboard: React.FC<ScoreboardProps> = ({
  teams,
  theme,
  respondingTeamId,
  showScores = true,
  compact = false
}) => {
  const colors = getTheme(theme).colors;

  if (!showScores) return null;

  const sortedTeams = [...teams].sort((a, b) => b.score - a.score);

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        gap: compact ? 16 : 24,
        padding: compact ? 12 : 20,
        flexWrap: 'wrap'
      }}
    >
      {sortedTeams.map((team, index) => {
        const isResponding = respondingTeamId === team.id;
        
        return (
          <motion.div
            key={team.id}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0, scale: isResponding ? 1.08 : 1 }}
            style={{
              background: isResponding 
                ? 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)'
                : colors.backgroundSecondary,
              backdropFilter: 'blur(20px)',
              borderRadius: 20,
              padding: compact ? '16px 28px' : '24px 40px',
              textAlign: 'center',
              minWidth: compact ? 140 : 180,
              border: `1px solid ${isResponding ? 'transparent' : colors.border}`,
              boxShadow: isResponding 
                ? '0 10px 30px -5px rgba(59, 130, 246, 0.4)' 
                : `0 10px 25px ${colors.shadow}`,
              transition: 'all 0.3s ease'
            }}
          >
            {/* Позиция */}
            {!compact && (
              <div style={{ 
                fontSize: '0.7rem', 
                fontWeight: 600,
                color: isResponding ? 'rgba(255,255,255,0.7)' : colors.textMuted, 
                marginBottom: 4,
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>
                #{index + 1}
              </div>
            )}
            
            {/* Название команды с индикатором цвета */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: team.color,
                boxShadow: `0 0 10px ${team.color}`
              }} />
              <div
                style={{
                  fontSize: compact ? '0.95rem' : '1.15rem',
                  fontWeight: 700,
                  color: isResponding ? '#ffffff' : colors.text,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: 140,
                  letterSpacing: '-0.3px'
                }}
              >
                {team.name}
              </div>
            </div>
            
            {/* Счёт с анимацией */}
            <AnimatePresence mode="wait">
              <motion.div
                key={team.score}
                initial={{ scale: 1.3, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.7, opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{
                  fontSize: compact ? '2rem' : '2.8rem',
                  fontWeight: 800,
                  color: isResponding ? '#ffffff' : colors.accent,
                  letterSpacing: '-1px'
                }}
              >
                {team.score}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
};

export default Scoreboard;
