import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Question, Team, ThemeId, CurrentQuestion } from '../types/game';
import { getTheme } from '../themes';

interface QuestionScreenProps {
  question: Question;
  categoryName: string;
  questionNumber: number;
  currentState: CurrentQuestion;
  teams: Team[];
  theme: ThemeId;
  isHost?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onTeamResponse?: (teamId: string | null) => void;
  onCorrect?: () => void;
  onIncorrect?: () => void;
  onClose?: () => void;
  onSetBet?: (amount: number) => void;
  onSetAuctionBet?: (teamId: string, amount: number) => void;
  onSetCatTarget?: (teamId: string) => void;
}

const QuestionScreen: React.FC<QuestionScreenProps> = ({
  question,
  categoryName,
  questionNumber,
  currentState,
  teams,
  theme,
  isHost = false,
  onPlay,
  onPause,
  onTeamResponse,
  onCorrect,
  onIncorrect,
  onClose,
  onSetBet,
  onSetAuctionBet,
  onSetCatTarget
}) => {
  const colors = getTheme(theme).colors;
  const [betAmount, setBetAmount] = useState(1);
  const [auctionBids, setAuctionBids] = useState<Record<string, number>>({});
  const [phase, setPhase] = useState<'setup' | 'play' | 'answer'>('setup');

  const getTypeLabel = () => {
    switch (question.type) {
      case 'bet': return 'Вопрос со ставкой';
      case 'auction': return 'Аукцион';
      case 'cat': return 'Кот в мешке';
      case 'sing': return 'Спой!';
      default: return 'Угадай мелодию';
    }
  };

  const getTypeIcon = () => {
    switch (question.type) {
      case 'bet': return '💰';
      case 'auction': return '🔨';
      case 'cat': return '🐱';
      case 'sing': return '🎤';
      default: return '🎵';
    }
  };

  const progress = question.endTime > question.startTime
    ? ((currentState.currentTime - question.startTime) / (question.endTime - question.startTime)) * 100
    : 0;

  // Доступные команды (не заблокированные)
  const availableTeams = teams.filter(t => !currentState.blockedTeamIds.includes(t.id));
  const blockedTeams = teams.filter(t => currentState.blockedTeamIds.includes(t.id));
  const allTeamsBlocked = availableTeams.length === 0;

  const btnBase: React.CSSProperties = {
    padding: '14px 24px',
    fontSize: '0.95rem',
    border: 'none',
    borderRadius: 12,
    cursor: 'pointer',
    fontWeight: 600,
    transition: 'all 0.3s ease'
  };

  const btnGradient: React.CSSProperties = {
    ...btnBase,
    background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
    color: '#ffffff',
    boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)'
  };

  const cardStyle: React.CSSProperties = {
    background: colors.backgroundSecondary,
    backdropFilter: 'blur(20px)',
    borderRadius: 16,
    border: `1px solid ${colors.border}`,
    padding: 24
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: colors.background,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        zIndex: 100
      }}
    >
      {/* Категория и номер */}
      <motion.p
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        style={{ color: colors.textMuted, fontSize: '1rem', marginBottom: 8 }}
      >
        {categoryName} · Вопрос {questionNumber}
      </motion.p>

      {/* Тип вопроса с градиентом */}
      <motion.h2
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{
          fontSize: '2rem',
          fontWeight: 700,
          background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: 40,
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          letterSpacing: '-0.3px'
        }}
      >
        <span>{getTypeIcon()}</span>
        {getTypeLabel()}
      </motion.h2>

      {/* Круговой прогресс с градиентом */}
      <motion.div
        style={{
          width: 180,
          height: 180,
          borderRadius: '50%',
          background: colors.backgroundSecondary,
          backdropFilter: 'blur(20px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 36,
          position: 'relative',
          border: `1px solid ${colors.border}`,
          boxShadow: `0 10px 40px ${colors.shadow}`
        }}
      >
        <svg style={{ position: 'absolute', width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
          <defs>
            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>
          </defs>
          <circle cx="90" cy="90" r="75" fill="none" stroke={colors.border} strokeWidth="6" />
          <motion.circle
            cx="90" cy="90" r="75"
            fill="none"
            stroke="url(#progressGradient)"
            strokeWidth="6"
            strokeDasharray={471}
            strokeDashoffset={471 - (471 * Math.min(progress, 100)) / 100}
            strokeLinecap="round"
          />
        </svg>
        <motion.span
          animate={{ scale: currentState.isPlaying ? [1, 1.1, 1] : 1 }}
          transition={{ repeat: currentState.isPlaying ? Infinity : 0, duration: 0.6 }}
          style={{ fontSize: '3rem' }}
        >
          {currentState.isPlaying ? '🎵' : '⏸'}
        </motion.span>
      </motion.div>

      {/* Отвечающая команда */}
      {currentState.respondingTeamId && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{
            background: teams.find(t => t.id === currentState.respondingTeamId)?.color,
            color: '#fff',
            padding: '14px 28px',
            borderRadius: 10,
            fontSize: '1.2rem',
            fontWeight: 600,
            marginBottom: 24
          }}
        >
          Отвечает: {teams.find(t => t.id === currentState.respondingTeamId)?.name}
        </motion.div>
      )}

      {/* Заблокированные команды (для публики тоже видно) */}
      {blockedTeams.length > 0 && (
        <div style={{ 
          color: colors.textMuted, 
          fontSize: '0.85rem', 
          marginBottom: 20,
          display: 'flex',
          gap: 8,
          alignItems: 'center'
        }}>
          <span>Уже отвечали:</span>
          {blockedTeams.map(t => (
            <span 
              key={t.id} 
              style={{ 
                padding: '4px 10px', 
                background: colors.backgroundTertiary,
                borderRadius: 6,
                textDecoration: 'line-through',
                opacity: 0.6
              }}
            >
              {t.name}
            </span>
          ))}
        </div>
      )}

      {/* Все команды ответили неправильно */}
      {allTeamsBlocked && isHost && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            background: colors.incorrect + '20',
            border: `1px solid ${colors.incorrect}`,
            color: colors.incorrect,
            padding: '12px 24px',
            borderRadius: 8,
            marginBottom: 20
          }}
        >
          Все команды ответили неправильно
        </motion.div>
      )}

      {/* Интерфейс ведущего */}
      {isHost && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', marginTop: 8 }}>
          
          {/* Правильный ответ */}
          <div style={{
            padding: '14px 24px',
            background: colors.backgroundSecondary,
            border: `1px solid ${colors.border}`,
            borderRadius: 10,
            color: colors.accent,
            fontSize: '1.1rem'
          }}>
            Ответ: <strong>{question.answer}</strong>
          </div>

          {/* Плей/Пауза */}
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={currentState.isPlaying ? onPause : onPlay}
              style={{ ...btnGradient, padding: '16px 32px', fontSize: '1rem' }}
            >
              {currentState.isPlaying ? '⏸ Пауза' : '▶ Играть'}
            </button>
          </div>

          {/* === ОСОБЫЕ ВОПРОСЫ === */}
          
          {/* Вопрос со ставкой */}
          {question.type === 'bet' && !currentState.betAmount && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                ...cardStyle,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 16,
                marginTop: 8
              }}
            >
              <h4 style={{ margin: 0, color: colors.accent }}>💰 Выберите ставку</h4>
              <div style={{ display: 'flex', gap: 10 }}>
                {[1, 2, 3].map(amount => (
                  <button
                    key={amount}
                    onClick={() => setBetAmount(amount)}
                    style={{
                      ...btnBase,
                      background: betAmount === amount ? 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)' : colors.backgroundTertiary,
                      color: betAmount === amount ? '#fff' : colors.text,
                      border: `2px solid ${betAmount === amount ? 'transparent' : colors.border}`,
                      minWidth: 60
                    }}
                  >
                    {amount}
                  </button>
                ))}
              </div>
              <button
                onClick={() => onSetBet?.(betAmount)}
                style={btnGradient}
              >
                Подтвердить ставку
              </button>
            </motion.div>
          )}

          {/* Аукцион */}
          {question.type === 'auction' && !currentState.respondingTeamId && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                ...cardStyle,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 16,
                marginTop: 8,
                minWidth: 400
              }}
            >
              <h4 style={{ margin: 0, color: colors.accent }}>🔨 Аукцион (макс. 5 баллов)</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
                {teams.map(team => (
                  <div key={team.id} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 12,
                    padding: '10px 14px',
                    background: colors.backgroundTertiary,
                    borderRadius: 10,
                    borderLeft: `4px solid ${team.color}`
                  }}>
                    <span style={{ flex: 1, fontWeight: 600 }}>{team.name}</span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {[0, 1, 2, 3, 4, 5].map(amount => (
                        <button
                          key={amount}
                          onClick={() => {
                            setAuctionBids(prev => ({ ...prev, [team.id]: amount }));
                            onSetAuctionBet?.(team.id, amount);
                          }}
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 8,
                            border: 'none',
                            background: (auctionBids[team.id] || 0) === amount 
                              ? team.color 
                              : colors.background,
                            color: (auctionBids[team.id] || 0) === amount ? '#fff' : colors.text,
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          {amount}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: '0.85rem', color: colors.textMuted, margin: 0 }}>
                Победитель: команда с максимальной ставкой отвечает
              </p>
              <button
                onClick={() => {
                  const maxBid = Math.max(...Object.values(auctionBids), 0);
                  const winner = Object.entries(auctionBids).find(([_, bid]) => bid === maxBid);
                  if (winner) {
                    onTeamResponse?.(winner[0]);
                  }
                }}
                disabled={Object.keys(auctionBids).length === 0}
                style={{
                  ...btnGradient,
                  opacity: Object.keys(auctionBids).length === 0 ? 0.5 : 1
                }}
              >
                Определить победителя
              </button>
            </motion.div>
          )}

          {/* Кот в мешке */}
          {question.type === 'cat' && !currentState.catTargetTeamId && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                ...cardStyle,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 16,
                marginTop: 8
              }}
            >
              <h4 style={{ margin: 0, color: colors.accent }}>🐱 Кому передать кота? (±2 балла)</h4>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
                {teams.map(team => (
                  <button
                    key={team.id}
                    onClick={() => {
                      onSetCatTarget?.(team.id);
                      onTeamResponse?.(team.id);
                    }}
                    style={{
                      ...btnBase,
                      background: colors.backgroundTertiary,
                      border: `2px solid ${team.color}`,
                      color: colors.text
                    }}
                  >
                    {team.name}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Показ текущей ставки/цели */}
          {currentState.betAmount && (
            <div style={{ 
              padding: '10px 20px', 
              background: colors.accentMuted, 
              borderRadius: 10,
              color: colors.accent,
              fontWeight: 600
            }}>
              Ставка: {currentState.betAmount} {currentState.betAmount === 1 ? 'балл' : 'балла'}
            </div>
          )}

          {currentState.catTargetTeamId && (
            <div style={{ 
              padding: '10px 20px', 
              background: colors.accentMuted, 
              borderRadius: 10,
              color: colors.accent,
              fontWeight: 600
            }}>
              🐱 Отвечает: {teams.find(t => t.id === currentState.catTargetTeamId)?.name}
            </div>
          )}

          {/* Кнопки команд */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
            {teams.map(team => {
              const isBlocked = currentState.blockedTeamIds.includes(team.id);
              const isSelected = currentState.respondingTeamId === team.id;
              
              return (
                <button
                  key={team.id}
                  onClick={() => !isBlocked && onTeamResponse?.(team.id)}
                  disabled={isBlocked}
                  style={{
                    ...btnBase,
                    background: isSelected ? team.color : colors.backgroundTertiary,
                    color: isSelected ? '#fff' : isBlocked ? colors.textMuted : colors.text,
                    border: `2px solid ${isBlocked ? colors.border : team.color}`,
                    opacity: isBlocked ? 0.4 : 1,
                    cursor: isBlocked ? 'not-allowed' : 'pointer',
                    textDecoration: isBlocked ? 'line-through' : 'none'
                  }}
                >
                  {team.name}
                  {isBlocked && ' 🚫'}
                </button>
              );
            })}
            <button
              onClick={() => onTeamResponse?.(null)}
              style={{ ...btnBase, background: colors.backgroundTertiary, color: colors.textMuted, border: `1px solid ${colors.border}` }}
            >
              Сброс
            </button>
          </div>

          {/* Правильно / Неправильно */}
          {currentState.respondingTeamId && (
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button
                onClick={onCorrect}
                style={{ ...btnBase, background: colors.correct, color: '#fff', padding: '16px 32px', fontSize: '1.1rem' }}
              >
                ✓ Правильно
              </button>
              <button
                onClick={onIncorrect}
                style={{ ...btnBase, background: colors.incorrect, color: '#fff', padding: '16px 32px', fontSize: '1.1rem' }}
              >
                ✗ Неправильно
              </button>
            </div>
          )}

          {/* Закрыть вопрос */}
          <button
            onClick={onClose}
            style={{ 
              ...btnBase, 
              background: 'transparent', 
              color: colors.textMuted, 
              border: `1px solid ${colors.border}`,
              marginTop: 16 
            }}
          >
            Закрыть вопрос
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default QuestionScreen;
