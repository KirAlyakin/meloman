import React from 'react';
import { motion } from 'framer-motion';
import { Category, Question, ThemeId, Team } from '../types/game';
import { getTheme } from '../themes';

interface GameBoardProps {
  categories: Category[];
  theme: ThemeId;
  teams?: Team[];
  onSelectQuestion?: (categoryId: string, questionId: string) => void;
  isHost?: boolean;
  currentQuestionId?: string | null;
}

const GameBoard: React.FC<GameBoardProps> = ({
  categories,
  theme,
  teams = [],
  onSelectQuestion,
  isHost = false,
  currentQuestionId
}) => {
  const colors = getTheme(theme).colors;
  const maxQuestions = Math.max(...categories.map(c => c.questions.length));

  const getTypeIcon = (type: Question['type']) => {
    switch (type) {
      case 'bet': return '💰';
      case 'auction': return '🔨';
      case 'cat': return '🐱';
      case 'sing': return '🎤';
      default: return null;
    }
  };

  const getTeamById = (teamId: string | null | undefined) => {
    if (!teamId) return null;
    return teams.find(t => t.id === teamId);
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `180px repeat(${maxQuestions}, 1fr)`,
        gap: 10,
        padding: 20,
        width: '100%',
        maxWidth: 1100,
        margin: '0 auto'
      }}
    >
      {categories.map((category, catIndex) => (
        <React.Fragment key={category.id}>
          {/* Категория слева — glass card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: catIndex * 0.08 }}
            style={{
              background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
              color: '#ffffff',
              padding: '16px 20px',
              borderRadius: 14,
              display: 'flex',
              alignItems: 'center',
              fontWeight: 700,
              fontSize: '0.95rem',
              letterSpacing: '-0.3px',
              boxShadow: '0 8px 25px -5px rgba(59, 130, 246, 0.4)'
            }}
          >
            {category.name}
          </motion.div>

          {/* Вопросы */}
          {Array.from({ length: maxQuestions }).map((_, qIndex) => {
            const question = category.questions[qIndex];
            
            if (!question) {
              return <div key={`${category.id}-empty-${qIndex}`} />;
            }

            const isPlayed = question.played;
            const isCurrent = currentQuestionId === question.id;
            const typeIcon = getTypeIcon(question.type);
            const answeringTeam = getTeamById(question.answeredByTeamId);

            return (
              <motion.button
                key={question.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: isPlayed ? 0.5 : 1, scale: isCurrent ? 1.03 : 1 }}
                transition={{ delay: (catIndex * maxQuestions + qIndex) * 0.02 }}
                whileHover={!isPlayed && isHost ? { scale: 1.06, y: -3 } : {}}
                whileTap={!isPlayed && isHost ? { scale: 0.97 } : {}}
                onClick={() => {
                  if (!isPlayed && isHost && onSelectQuestion) {
                    onSelectQuestion(category.id, question.id);
                  }
                }}
                disabled={isPlayed || !isHost}
                style={{
                  background: isCurrent 
                    ? 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)' 
                    : isPlayed && answeringTeam
                      ? `linear-gradient(135deg, ${answeringTeam.color}15, ${answeringTeam.color}25)`
                      : colors.backgroundSecondary,
                  color: isCurrent ? '#ffffff' : colors.text,
                  border: `2px solid ${isCurrent ? 'transparent' : isPlayed && answeringTeam ? answeringTeam.color : colors.border}`,
                  borderRadius: 14,
                  padding: '14px 16px',
                  fontSize: '1.4rem',
                  fontWeight: 700,
                  cursor: isPlayed || !isHost ? 'default' : 'pointer',
                  position: 'relative',
                  minHeight: 65,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backdropFilter: 'blur(20px)',
                  boxShadow: isCurrent 
                    ? '0 10px 30px -5px rgba(59, 130, 246, 0.4)' 
                    : `0 4px 12px ${colors.shadow}`,
                  transition: 'all 0.3s ease'
                }}
              >
                {isPlayed ? (
                  answeringTeam ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                      <span style={{ 
                        width: 12, 
                        height: 12, 
                        borderRadius: '50%', 
                        background: answeringTeam.color,
                        boxShadow: `0 0 8px ${answeringTeam.color}`
                      }} />
                      <span style={{ fontSize: '0.65rem', color: colors.textMuted, maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {answeringTeam.name.length > 8 ? answeringTeam.name.slice(0, 8) : answeringTeam.name}
                      </span>
                    </div>
                  ) : (
                    <span style={{ color: colors.textMuted, fontSize: '1rem' }}>—</span>
                  )
                ) : (
                  <>
                    {qIndex + 1}
                    {typeIcon && (
                      <span style={{ 
                        position: 'absolute', 
                        top: 6, 
                        right: 8, 
                        fontSize: '0.7rem',
                        opacity: 0.8
                      }}>
                        {typeIcon}
                      </span>
                    )}
                  </>
                )}
              </motion.button>
            );
          })}
        </React.Fragment>
      ))}
    </div>
  );
};

export default GameBoard;
