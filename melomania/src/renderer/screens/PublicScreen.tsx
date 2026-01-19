import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { getTheme } from '../themes';
import GameBoard from '../components/GameBoard';
import Scoreboard from '../components/Scoreboard';
import QuestionScreen from '../components/QuestionScreen';
import Decorations from '../components/Decorations';
import { JeopardyCategory, JeopardyQuestion } from '../types/game';

const PublicScreen: React.FC = () => {
  const { 
    game, teams, currentQuestion, status, theme, showScores, syncFromHost 
  } = useGameStore();

  const themeData = getTheme(theme);
  const colors = themeData.colors;

  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.onStateUpdate((state) => {
        syncFromHost(state as any);
      });
    }
  }, [syncFromHost]);

  const getCurrentQuestionData = () => {
    if (!currentQuestion || !game) return null;
    const category = game.categories.find((c: JeopardyCategory) => c.id === currentQuestion.categoryId);
    if (!category) return null;
    const question = category.questions.find((q: JeopardyQuestion) => q.id === currentQuestion.questionId);
    if (!question) return null;
    const questionIndex = category.questions.findIndex((q: JeopardyQuestion) => q.id === currentQuestion.questionId);
    return { question, category, questionIndex };
  };

  const questionData = getCurrentQuestionData();

  return (
    <div
      style={{
        minHeight: '100vh',
        background: colors.background,
        color: colors.text,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      <Decorations theme={themeData} />

      {/* Компактная шапка */}
      <header
        style={{
          padding: '16px 40px',
          textAlign: 'center',
          borderBottom: `1px solid ${colors.border}`,
          position: 'relative',
          zIndex: 10,
          background: colors.backgroundSecondary,
          backdropFilter: 'blur(20px)'
        }}
      >
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            fontSize: '1.8rem',
            fontWeight: 800,
            background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            margin: 0,
            letterSpacing: '-0.5px'
          }}
        >
          МЕЛОМАНИЯ
        </motion.h1>
      </header>

      {/* Контент */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 10 }}>
        
        {/* Ожидание */}
        {status === 'setup' && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 2.5 }}
              style={{ fontSize: '1.5rem', color: colors.textMuted, fontWeight: 500 }}
            >
              Ожидание начала игры...
            </motion.div>
          </div>
        )}

        {/* Игра */}
        {(status === 'playing' || status === 'paused') && game && (
          <>
            {/* Счёт показываем только если showScores=true (кнопка Итоги) */}
            <AnimatePresence>
              {showScores && (
                <motion.div
                  initial={{ opacity: 0, y: -50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -50 }}
                  style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: `${colors.background}ee`,
                    backdropFilter: 'blur(10px)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 100
                  }}
                >
                  <motion.h2
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    style={{
                      fontSize: '2rem',
                      fontWeight: 800,
                      background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      marginBottom: 40
                    }}
                  >
                    📊 Промежуточные итоги
                  </motion.h2>
                  <Scoreboard
                    teams={teams}
                    theme={theme}
                    showScores={true}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              {questionData ? (
                <QuestionScreen
                  key="question"
                  question={questionData.question}
                  categoryName={questionData.category.name}
                  questionNumber={questionData.questionIndex + 1}
                  currentState={currentQuestion!}
                  teams={teams}
                  theme={theme}
                  isHost={false}
                />
              ) : (
                <motion.div
                  key="board"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <GameBoard
                    categories={game.categories}
                    theme={theme}
                    teams={teams}
                    isHost={false}
                    currentQuestionId={currentQuestion?.questionId}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}

        {/* Пауза */}
        {status === 'paused' && !currentQuestion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: `${colors.background}f0`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 50
            }}
          >
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ repeat: Infinity, duration: 2 }}
              style={{ fontSize: '4rem', marginBottom: 24 }}
            >
              ⏸
            </motion.div>
            <p style={{ fontSize: '1.5rem', color: colors.textMuted, fontWeight: 500 }}>Пауза</p>
            <div style={{ marginTop: 40 }}>
              <Scoreboard teams={teams} theme={theme} showScores={true} />
            </div>
          </motion.div>
        )}

        {/* Результаты */}
        {(status === 'results' || status === 'finished') && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
            <motion.h2
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              style={{ 
                fontSize: '3rem', 
                fontWeight: 800, 
                background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: 48,
                letterSpacing: '-0.5px'
              }}
            >
              🏆 Итоги игры
            </motion.h2>

            <div style={{ display: 'flex', gap: 32, alignItems: 'flex-end' }}>
              {[...teams].sort((a, b) => b.score - a.score).map((team, index) => {
                const heights = [240, 180, 140, 110];
                const medals = ['🥇', '🥈', '🥉', ''];
                
                return (
                  <motion.div
                    key={team.id}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: heights[index] || 90, opacity: 1 }}
                    transition={{ delay: index * 0.15, duration: 0.6, ease: 'easeOut' }}
                    style={{
                      width: 150,
                      background: index === 0 
                        ? 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)'
                        : `linear-gradient(180deg, ${team.color}, ${team.color}88)`,
                      borderRadius: '20px 20px 0 0',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      padding: 24,
                      boxShadow: index === 0 
                        ? '0 10px 30px -5px rgba(59, 130, 246, 0.4)'
                        : `0 10px 25px ${colors.shadow}`
                    }}
                  >
                    <span style={{ fontSize: '2.5rem' }}>{medals[index]}</span>
                    <span style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', textAlign: 'center', marginTop: 10 }}>
                      {team.name}
                    </span>
                    <span style={{ fontSize: '2.2rem', fontWeight: 800, color: '#fff', marginTop: 10 }}>
                      {team.score}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default PublicScreen;
