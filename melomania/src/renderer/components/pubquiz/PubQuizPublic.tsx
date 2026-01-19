import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PubQuizGame, PubQuizCurrentState, Team, ThemeId } from '../../types/game';
import { getTheme } from '../../themes';

interface PubQuizPublicProps {
  game: PubQuizGame;
  state: PubQuizCurrentState;
  teams: Team[];
  teamScores: Record<string, number>;
  theme: ThemeId;
}

const PubQuizPublic: React.FC<PubQuizPublicProps> = ({
  game,
  state,
  teams,
  teamScores,
  theme
}) => {
  const colors = getTheme(theme).colors;

  const currentRound = game.rounds[state.roundIndex];
  const currentQuestion = currentRound?.questions[state.questionIndex];

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const getRoundTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      text: '📝',
      music: '🎵',
      picture: '🖼️',
      blitz: '⚡',
      video: '🎬',
      choice: '🔘'
    };
    return icons[type] || '❓';
  };

  const timerColor = state.timeRemaining <= 10 ? colors.incorrect : 
                     state.timeRemaining <= 30 ? '#F59E0B' : colors.correct;

  return (
    <div style={{
      minHeight: '100vh',
      background: colors.background,
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Верхняя панель */}
      <header style={{
        padding: '20px 40px',
        background: colors.backgroundSecondary,
        borderBottom: `1px solid ${colors.border}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{
            margin: 0,
            fontSize: '1.5rem',
            fontWeight: 700,
            background: 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            {game.name}
          </h1>
          <p style={{ margin: 0, marginTop: 4, color: colors.textMuted }}>
            {getRoundTypeIcon(currentRound?.type || 'text')} {currentRound?.name} · Вопрос {state.questionIndex + 1}/{currentRound?.questions.length}
          </p>
        </div>

        {/* Таймер */}
        {(state.phase === 'answer-time' || state.phase === 'question') && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            style={{
              padding: '16px 32px',
              background: timerColor + '20',
              border: `3px solid ${timerColor}`,
              borderRadius: 16
            }}
          >
            <motion.span
              animate={{ 
                scale: state.isTimerRunning && state.timeRemaining <= 10 ? [1, 1.1, 1] : 1 
              }}
              transition={{ repeat: Infinity, duration: 0.5 }}
              style={{
                fontSize: '3rem',
                fontWeight: 800,
                fontFamily: 'monospace',
                color: timerColor
              }}
            >
              {formatTime(state.timeRemaining)}
            </motion.span>
          </motion.div>
        )}
      </header>

      {/* Основной контент */}
      <main style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 60
      }}>
        <AnimatePresence mode="wait">
          {/* Интро раунда */}
          {state.phase === 'intro' && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              style={{ textAlign: 'center' }}
            >
              <motion.div
                initial={{ y: -50 }}
                animate={{ y: 0 }}
                style={{
                  width: 140,
                  height: 140,
                  borderRadius: 32,
                  background: 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 40px',
                  fontSize: '4rem',
                  boxShadow: '0 20px 60px rgba(245, 158, 11, 0.4)'
                }}
              >
                {getRoundTypeIcon(currentRound?.type || 'text')}
              </motion.div>
              <h1 style={{
                fontSize: '4rem',
                fontWeight: 800,
                margin: 0,
                marginBottom: 16,
                background: 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                {currentRound?.name}
              </h1>
              <p style={{
                fontSize: '1.5rem',
                color: colors.textMuted
              }}>
                {currentRound?.questions.length} вопросов · {currentRound?.defaultTimeLimit} секунд на ответ
              </p>
              {currentRound?.description && (
                <p style={{ fontSize: '1.2rem', color: colors.textSecondary, marginTop: 16 }}>
                  {currentRound.description}
                </p>
              )}
            </motion.div>
          )}

          {/* Вопрос */}
          {(state.phase === 'question' || state.phase === 'answer-time') && currentQuestion && (
            <motion.div
              key="question"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              style={{ textAlign: 'center', maxWidth: 1200 }}
            >
              {/* Номер и баллы */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: '12px 24px',
                  background: colors.backgroundSecondary,
                  borderRadius: 12,
                  marginBottom: 40
                }}
              >
                <span style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  color: '#fff'
                }}>
                  {state.questionIndex + 1}
                </span>
                <span style={{ color: colors.textMuted, fontSize: '1.2rem' }}>
                  {currentQuestion.points} {currentQuestion.points === 1 ? 'балл' : 'балла'}
                </span>
              </motion.div>

              {/* Картинка */}
              {currentQuestion.mediaPath && currentRound?.type === 'picture' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{
                    maxWidth: 800,
                    maxHeight: 450,
                    margin: '0 auto 40px',
                    borderRadius: 20,
                    overflow: 'hidden',
                    boxShadow: `0 20px 60px ${colors.shadow}`
                  }}
                >
                  <img
                    src={currentQuestion.mediaPath}
                    alt="Question"
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                </motion.div>
              )}

              {/* Текст вопроса */}
              <motion.h2
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                style={{
                  fontSize: '2.5rem',
                  fontWeight: 600,
                  lineHeight: 1.4,
                  margin: 0,
                  color: colors.text
                }}
              >
                {currentQuestion.text}
              </motion.h2>

              {/* Варианты ответов для типа choice */}
              {currentRound?.type === 'choice' && currentQuestion.options && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 20,
                    marginTop: 48,
                    maxWidth: 900
                  }}
                >
                  {['A', 'B', 'C', 'D'].map((letter, idx) => (
                    <motion.div
                      key={letter}
                      initial={{ opacity: 0, x: idx % 2 === 0 ? -50 : 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + idx * 0.1 }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 16,
                        padding: '20px 28px',
                        background: colors.backgroundSecondary,
                        borderRadius: 16,
                        border: `2px solid ${colors.border}`,
                        fontSize: '1.4rem'
                      }}
                    >
                      <div style={{
                        width: 50,
                        height: 50,
                        borderRadius: 12,
                        background: colors.backgroundTertiary,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '1.5rem',
                        color: colors.text
                      }}>
                        {letter}
                      </div>
                      <span style={{ color: colors.text, fontWeight: 500 }}>
                        {currentQuestion.options?.[idx] || ''}
                      </span>
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {/* Подсказка */}
              {currentQuestion.hint && state.phase === 'answer-time' && state.timeRemaining <= 30 && (
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    marginTop: 40,
                    padding: '16px 24px',
                    background: colors.backgroundSecondary,
                    borderRadius: 12,
                    color: colors.textSecondary,
                    fontSize: '1.2rem',
                    display: 'inline-block'
                  }}
                >
                  💡 {currentQuestion.hint}
                </motion.p>
              )}
            </motion.div>
          )}

          {/* Ответ */}
          {state.phase === 'reveal' && currentQuestion && (
            <motion.div
              key="reveal"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              style={{ textAlign: 'center' }}
            >
              {/* Для вопросов с вариантами - показываем анимированные варианты */}
              {currentRound?.type === 'choice' && currentQuestion.options ? (
                <div>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{ color: colors.textMuted, fontSize: '1.5rem', marginBottom: 32 }}
                  >
                    Правильный ответ:
                  </motion.p>
                  <motion.div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 20,
                      maxWidth: 900,
                      margin: '0 auto'
                    }}
                  >
                    {['A', 'B', 'C', 'D'].map((letter, idx) => {
                      const isCorrect = idx === currentQuestion.correctOptionIndex;
                      return (
                        <motion.div
                          key={letter}
                          initial={{ 
                            opacity: 0.3,
                            scale: 1,
                            borderColor: colors.border
                          }}
                          animate={{ 
                            opacity: isCorrect ? 1 : 0.3,
                            scale: isCorrect ? [1, 1.05, 1] : 1,
                            borderColor: isCorrect ? colors.correct : colors.border,
                            boxShadow: isCorrect ? `0 0 40px ${colors.correct}60` : 'none'
                          }}
                          transition={{ 
                            delay: isCorrect ? 0.5 : 0,
                            duration: isCorrect ? 0.8 : 0.3,
                            scale: { repeat: isCorrect ? 2 : 0, repeatType: 'reverse' }
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 16,
                            padding: '20px 28px',
                            background: isCorrect ? `${colors.correct}20` : colors.backgroundSecondary,
                            borderRadius: 16,
                            border: `3px solid`,
                            fontSize: '1.4rem'
                          }}
                        >
                          <motion.div 
                            animate={isCorrect ? {
                              background: [colors.backgroundTertiary, colors.correct, colors.correct],
                              color: [colors.text, '#fff', '#fff']
                            } : {}}
                            transition={{ delay: 0.5, duration: 0.5 }}
                            style={{
                              width: 50,
                              height: 50,
                              borderRadius: 12,
                              background: colors.backgroundTertiary,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: '1.5rem',
                              color: colors.text
                            }}
                          >
                            {isCorrect ? '✓' : letter}
                          </motion.div>
                          <span style={{ 
                            color: isCorrect ? colors.correct : colors.textMuted, 
                            fontWeight: isCorrect ? 700 : 500 
                          }}>
                            {currentQuestion.options?.[idx] || ''}
                          </span>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                </div>
              ) : (
                // Стандартное отображение ответа для других типов вопросов
                <>
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 0.5 }}
                    style={{
                      width: 120,
                      height: 120,
                      borderRadius: 30,
                      background: colors.correct,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 40px',
                      fontSize: '4rem',
                      boxShadow: `0 20px 60px ${colors.correct}40`
                    }}
                  >
                    ✓
                  </motion.div>
                  <p style={{ color: colors.textMuted, fontSize: '1.5rem', marginBottom: 16 }}>
                    Правильный ответ:
                  </p>
                  <motion.h1
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    style={{
                      fontSize: '4rem',
                      fontWeight: 800,
                      color: colors.correct,
                      margin: 0
                    }}
                  >
                    {currentQuestion.answer}
                  </motion.h1>
                </>
              )}
            </motion.div>
          )}

          {/* Результаты раунда */}
          {state.phase === 'round-results' && (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ width: '100%', maxWidth: 800 }}
            >
              <h1 style={{
                textAlign: 'center',
                fontSize: '2.5rem',
                fontWeight: 800,
                marginBottom: 48,
                background: 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                📊 Итоги раунда
              </h1>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[...teams]
                  .sort((a, b) => (teamScores[b.id] || 0) - (teamScores[a.id] || 0))
                  .map((team, index) => (
                    <motion.div
                      key={team.id}
                      initial={{ opacity: 0, x: -50 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 20,
                        padding: '20px 24px',
                        background: colors.backgroundSecondary,
                        borderRadius: 16,
                        borderLeft: `6px solid ${team.color}`
                      }}
                    >
                      <span style={{
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        background: index === 0 ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)' :
                                   index === 1 ? 'linear-gradient(135deg, #C0C0C0 0%, #A0A0A0 100%)' :
                                   index === 2 ? 'linear-gradient(135deg, #CD7F32 0%, #B87333 100%)' :
                                   colors.backgroundTertiary,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.5rem',
                        fontWeight: 800,
                        color: index < 3 ? '#fff' : colors.text
                      }}>
                        {index + 1}
                      </span>
                      <span style={{ flex: 1, fontSize: '1.5rem', fontWeight: 600 }}>
                        {team.name}
                      </span>
                      <span style={{
                        fontSize: '2rem',
                        fontWeight: 800,
                        color: team.color
                      }}>
                        {teamScores[team.id] || 0}
                      </span>
                    </motion.div>
                  ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Прогресс-бар снизу */}
      <div style={{
        height: 6,
        background: colors.backgroundTertiary
      }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ 
            width: `${((state.questionIndex + 1) / (currentRound?.questions.length || 1)) * 100}%` 
          }}
          style={{
            height: '100%',
            background: 'linear-gradient(90deg, #F59E0B, #EF4444)',
            borderRadius: 3
          }}
        />
      </div>
    </div>
  );
};

export default PubQuizPublic;
