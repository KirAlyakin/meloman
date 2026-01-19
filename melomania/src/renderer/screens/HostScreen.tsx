import React, { useEffect, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { getTheme, themeList } from '../themes';
import { audioManager } from '../audio/audioManager';
import GameBoard from '../components/GameBoard';
import Scoreboard from '../components/Scoreboard';
import QuestionScreen from '../components/QuestionScreen';
import GameEditor from '../components/GameEditor';
import GameLibrary, { saveGame, loadGames } from '../components/GameLibrary';
import GameStats from '../components/GameStats';
import { ThemeId, JeopardyGame, JeopardyCategory, JeopardyQuestion } from '../types/game';
import { v4 as uuidv4 } from 'uuid';

type ViewMode = 'library' | 'editor' | 'setup' | 'game';

const createDemoGame = (): JeopardyGame => ({
  id: uuidv4(),
  mode: 'jeopardy',
  name: 'Демо-игра',
  description: 'Тестовая игра',
  categories: [
    { id: uuidv4(), name: 'Рок', questions: Array.from({ length: 5 }, (_, i) => ({ id: uuidv4(), audioPath: '', answer: `Queen - Bohemian Rhapsody`, startTime: 0, endTime: 30, type: i === 2 ? 'bet' as const : 'normal' as const, played: false })) },
    { id: uuidv4(), name: 'Поп', questions: Array.from({ length: 5 }, (_, i) => ({ id: uuidv4(), audioPath: '', answer: `Michael Jackson - Thriller`, startTime: 0, endTime: 30, type: i === 3 ? 'auction' as const : 'normal' as const, played: false })) },
    { id: uuidv4(), name: 'Кино', questions: Array.from({ length: 5 }, (_, i) => ({ id: uuidv4(), audioPath: '', answer: `Титаник - My Heart Will Go On`, startTime: 0, endTime: 30, type: i === 1 ? 'cat' as const : 'normal' as const, played: false })) },
    { id: uuidv4(), name: '90-е', questions: Array.from({ length: 5 }, (_, i) => ({ id: uuidv4(), audioPath: '', answer: `Backstreet Boys`, startTime: 0, endTime: 30, type: i === 4 ? 'sing' as const : 'normal' as const, played: false })) },
    { id: uuidv4(), name: 'Хиты', questions: Array.from({ length: 5 }, () => ({ id: uuidv4(), audioPath: '', answer: `ABBA - Dancing Queen`, startTime: 0, endTime: 30, type: 'normal' as const, played: false })) }
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});

const HostScreen: React.FC = () => {
  const store = useGameStore();
  const { 
    game, teams, currentQuestion, status, theme, showScores,
    loadGame, startGame, pauseGame, resumeGame, endGame,
    addTeam, removeTeam, updateTeamName, setTeamScore,
    selectQuestion, setRespondingTeam, markCorrect, markIncorrect, closeQuestion,
    setPlaying, setCurrentTime, setTheme, toggleScores, getPublicState, resetGame,
    isTeamBlocked
  } = store;

  const [viewMode, setViewMode] = useState<ViewMode>('library');
  const [editingGame, setEditingGame] = useState<JeopardyGame | null>(null);
  const [showStats, setShowStats] = useState(false);
  
  // Настройка зума (сохраняем в localStorage)
  const [zoom, setZoom] = useState(() => {
    const saved = localStorage.getItem('melomania_zoom');
    return saved ? parseInt(saved) : 100;
  });

  // Применяем зум к документу
  useEffect(() => {
    document.documentElement.style.fontSize = `${zoom}%`;
    localStorage.setItem('melomania_zoom', zoom.toString());
  }, [zoom]);

  const themeData = getTheme(theme);
  const colors = themeData.colors;

  const syncToPublic = useCallback(() => {
    if (window.electronAPI) {
      window.electronAPI.syncState(getPublicState());
    }
  }, [getPublicState]);

  useEffect(() => {
    syncToPublic();
  }, [game, teams, currentQuestion, status, theme, showScores, syncToPublic]);

  // Переключаем режим при изменении статуса игры
  useEffect(() => {
    if (status === 'playing' || status === 'paused' || status === 'finished') {
      setViewMode('game');
    } else if (game && status === 'setup') {
      setViewMode('setup');
    }
  }, [status, game]);

  // Методы для особых вопросов
  const handleSetBet = (amount: number) => {
    store.setBetAmount(amount);
  };

  const handleSetAuctionBet = (teamId: string, amount: number) => {
    store.setAuctionBet(teamId, amount);
  };

  const handleSetCatTarget = (teamId: string) => {
    store.setCatTarget(teamId);
  };

  // Экспорт результатов в CSV
  const handleExportStats = () => {
    if (!game) return;
    
    const lines = ['Команда,Очки,Правильных ответов'];
    teams.forEach(team => {
      const correctAnswers = game.categories.reduce((sum: number, cat: JeopardyCategory) => 
        sum + cat.questions.filter((q: JeopardyQuestion) => q.answeredByTeamId === team.id).length, 0
      );
      lines.push(`${team.name},${team.score},${correctAnswers}`);
    });
    
    lines.push('');
    lines.push('Категория,Вопрос,Ответ,Команда');
    game.categories.forEach((cat: JeopardyCategory) => {
      cat.questions.forEach((q: JeopardyQuestion, i: number) => {
        const teamName = q.answeredByTeamId ? teams.find(t => t.id === q.answeredByTeamId)?.name || '-' : '-';
        lines.push(`${cat.name},${i + 1},"${q.answer}",${teamName}`);
      });
    });
    
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${game.name}_results_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSelectGame = (selectedGame: JeopardyGame) => {
    loadGame(selectedGame);
    setViewMode('setup');
  };

  const handleEditGame = (gameToEdit: JeopardyGame) => {
    setEditingGame(gameToEdit);
    setViewMode('editor');
  };

  const handleCreateNew = () => {
    setEditingGame(null);
    setViewMode('editor');
  };

  const handleSaveGame = (savedGame: JeopardyGame) => {
    saveGame(savedGame);
    setEditingGame(null);
    setViewMode('library');
  };

  const handleCancelEdit = () => {
    setEditingGame(null);
    setViewMode('library');
  };

  const getCurrentQuestionData = () => {
    if (!currentQuestion || !game) return null;
    const category = game.categories.find(c => c.id === currentQuestion.categoryId);
    if (!category) return null;
    const question = category.questions.find(q => q.id === currentQuestion.questionId);
    if (!question) return null;
    const questionIndex = category.questions.findIndex(q => q.id === currentQuestion.questionId);
    return { question, category, questionIndex };
  };

  const questionData = getCurrentQuestionData();

  const handlePlay = async () => {
    if (!questionData) return;
    const { question } = questionData;
    if (question.audioPath) {
      try {
        await audioManager.load(question.audioPath, question.startTime, question.endTime, (time) => setCurrentTime(time), () => setPlaying(false));
        audioManager.play();
      } catch (error) {
        console.error('Ошибка воспроизведения:', error);
      }
    }
    setPlaying(true);
  };

  const handlePause = () => {
    audioManager.pause();
    setPlaying(false);
  };

  const handleCorrect = () => {
    markCorrect();
    audioManager.stop();
    closeQuestion();
  };

  const handleIncorrect = () => {
    markIncorrect();
    // Команда заблокирована, музыка продолжает играть
  };

  // Стили Formix
  const cardStyle: React.CSSProperties = {
    background: colors.backgroundSecondary,
    backdropFilter: 'blur(20px)',
    borderRadius: 16,
    border: `1px solid ${colors.border}`,
    padding: 20,
    boxShadow: `0 10px 25px ${colors.shadow}`
  };

  const buttonBase: React.CSSProperties = {
    padding: '12px 20px',
    fontSize: '0.9rem',
    border: 'none',
    borderRadius: 12,
    cursor: 'pointer',
    fontWeight: 600,
    transition: 'all 0.3s ease'
  };

  const primaryBtn: React.CSSProperties = {
    ...buttonBase,
    background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
    color: '#ffffff',
    boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)'
  };

  const secondaryBtn: React.CSSProperties = {
    ...buttonBase,
    background: colors.backgroundTertiary,
    color: colors.text,
    border: `1px solid ${colors.border}`
  };

  return (
    <div style={{ 
      display: 'flex', 
      minHeight: '100vh', 
      background: colors.background, 
      color: colors.text 
    }}>
      {/* Левая панель — Навигация */}
      <aside style={{
        width: 240,
        background: colors.backgroundSecondary,
        backdropFilter: 'blur(20px)',
        borderRight: `1px solid ${colors.border}`,
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 8
      }}>
        {/* Логотип */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)'
          }}>
            <span style={{ fontSize: '1.2rem' }}>🎵</span>
          </div>
          <span style={{ 
            fontSize: '1.2rem', 
            fontWeight: 800, 
            letterSpacing: '-0.5px',
            background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Melomania
          </span>
        </div>

        {/* Навигация */}
        <h3 style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px', color: colors.textMuted, marginBottom: 8, fontWeight: 600 }}>
          Меню
        </h3>

        <motion.button
          onClick={() => { resetGame(); setViewMode('library'); }}
          whileHover={{ x: 4 }}
          style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
            background: viewMode === 'library' ? colors.accentMuted : 'transparent',
            border: viewMode === 'library' ? `1px solid ${colors.accent}` : `1px solid transparent`,
            borderRadius: 12, color: viewMode === 'library' ? colors.accent : colors.textSecondary,
            cursor: 'pointer', textAlign: 'left', fontSize: '0.9rem', fontWeight: 500
          }}
        >
          <span>📚</span> Библиотека
        </motion.button>

        <motion.button
          onClick={handleCreateNew}
          whileHover={{ x: 4 }}
          style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
            background: viewMode === 'editor' ? colors.accentMuted : 'transparent',
            border: viewMode === 'editor' ? `1px solid ${colors.accent}` : `1px solid transparent`,
            borderRadius: 12, color: viewMode === 'editor' ? colors.accent : colors.textSecondary,
            cursor: 'pointer', textAlign: 'left', fontSize: '0.9rem', fontWeight: 500
          }}
        >
          <span>✏️</span> Создать игру
        </motion.button>

        {game && (
          <motion.button
            onClick={() => setViewMode('setup')}
            whileHover={{ x: 4 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
              background: viewMode === 'setup' || viewMode === 'game' ? colors.accentMuted : 'transparent',
              border: viewMode === 'setup' || viewMode === 'game' ? `1px solid ${colors.accent}` : `1px solid transparent`,
              borderRadius: 12, color: viewMode === 'setup' || viewMode === 'game' ? colors.accent : colors.textSecondary,
              cursor: 'pointer', textAlign: 'left', fontSize: '0.9rem', fontWeight: 500
            }}
          >
            <span>🎮</span> Текущая игра
          </motion.button>
        )}

        <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${colors.border}` }}>
          <h3 style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px', color: colors.textMuted, marginBottom: 12, fontWeight: 600 }}>
            Тема оформления
          </h3>
        
          {themeList.map(t => (
            <motion.button
              key={t.id}
              onClick={() => setTheme(t.id)}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 14px',
                background: theme === t.id ? colors.accentMuted : 'transparent',
                border: theme === t.id ? `1px solid ${colors.accent}` : `1px solid transparent`,
                borderRadius: 10,
                color: theme === t.id ? colors.accent : colors.textSecondary,
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '0.85rem',
                fontWeight: 500,
                transition: 'all 0.2s ease',
                marginBottom: 4,
                width: '100%'
              }}
            >
              <span style={{ fontSize: '1.1rem' }}>{t.emoji}</span>
              <span>{t.name}</span>
            </motion.button>
          ))}
        </div>

        {/* Настройка масштаба */}
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${colors.border}` }}>
          <h3 style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px', color: colors.textMuted, marginBottom: 12, fontWeight: 600 }}>
            🔍 Масштаб интерфейса
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => setZoom(Math.max(80, zoom - 10))}
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                border: `1px solid ${colors.border}`,
                background: colors.backgroundSecondary,
                color: colors.text,
                cursor: 'pointer',
                fontSize: '1.2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              −
            </button>
            <div style={{
              flex: 1,
              textAlign: 'center',
              padding: '8px 0',
              background: colors.backgroundSecondary,
              borderRadius: 8,
              border: `1px solid ${colors.border}`,
              fontSize: '0.85rem',
              fontWeight: 600,
              color: colors.text
            }}>
              {zoom}%
            </div>
            <button
              onClick={() => setZoom(Math.min(150, zoom + 10))}
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                border: `1px solid ${colors.border}`,
                background: colors.backgroundSecondary,
                color: colors.text,
                cursor: 'pointer',
                fontSize: '1.2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              +
            </button>
          </div>
          <button
            onClick={() => setZoom(100)}
            style={{
              marginTop: 8,
              width: '100%',
              padding: '6px',
              borderRadius: 6,
              border: `1px solid ${colors.border}`,
              background: 'transparent',
              color: colors.textSecondary,
              cursor: 'pointer',
              fontSize: '0.75rem'
            }}
          >
            Сбросить (100%)
          </button>
        </div>

        <div style={{ flex: 1 }} />

        {/* Управление окнами */}
        <div style={{ 
          borderTop: `1px solid ${colors.border}`, 
          paddingTop: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 10
        }}>
          <button 
            onClick={() => window.electronAPI?.openPublicWindow()} 
            style={{ ...primaryBtn, width: '100%' }}
          >
            📺 Открыть экран
          </button>
          <button 
            onClick={() => window.electronAPI?.togglePublicFullscreen()} 
            style={{ ...secondaryBtn, width: '100%' }}
          >
            ⛶ Полный экран
          </button>
          <button 
            onClick={() => window.location.reload()} 
            style={{ ...secondaryBtn, width: '100%' }}
          >
            ← Главное меню
          </button>
        </div>
      </aside>

      {/* Основной контент */}
      <main style={{ flex: 1, padding: 32, overflow: 'auto' }}>
        {/* Библиотека игр */}
        {viewMode === 'library' && (
          <GameLibrary
            onSelectGame={handleSelectGame}
            onEditGame={handleEditGame}
            onCreateNew={handleCreateNew}
            colors={colors}
          />
        )}

        {/* Редактор игр */}
        {viewMode === 'editor' && (
          <GameEditor
            game={editingGame}
            onSave={handleSaveGame}
            onCancel={handleCancelEdit}
            colors={colors}
          />
        )}

        {/* SETUP — Настройка команд */}
        {viewMode === 'setup' && status === 'setup' && game && (
          <div style={{ maxWidth: 800 }}>
            <h2 style={{ margin: 0, marginBottom: 24, fontSize: '1.5rem', fontWeight: 700 }}>
              Настройка игры
            </h2>

            <div style={{ ...cardStyle, marginBottom: 20 }}>
              <h3 style={{ margin: 0, marginBottom: 16, color: colors.textSecondary, fontSize: '0.9rem', fontWeight: 600 }}>ВЫБРАННАЯ ИГРА</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{
                    width: 50, height: 50, borderRadius: 12,
                    background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.5rem'
                  }}>🎵</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{game.name}</div>
                    <div style={{ color: colors.textMuted, fontSize: '0.85rem' }}>
                      {game.categories.length} категорий · {game.categories.reduce((s, c) => s + c.questions.length, 0)} вопросов
                    </div>
                  </div>
                </div>
                <button onClick={() => setViewMode('library')} style={secondaryBtn}>Сменить</button>
              </div>
            </div>

            <div style={{ ...cardStyle, marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ margin: 0, color: colors.textSecondary, fontSize: '0.9rem', fontWeight: 600 }}>
                  КОМАНДЫ ({teams.length}/12)
                </h3>
                {teams.length < 12 && (
                  <button onClick={() => addTeam(`Команда ${teams.length + 1}`)} style={{ ...secondaryBtn, padding: '8px 16px' }}>
                    + Добавить
                  </button>
                )}
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                {teams.map((team, index) => (
                  <motion.div 
                    key={team.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{ 
                      display: 'flex', 
                      gap: 10, 
                      alignItems: 'center', 
                      padding: '12px 14px',
                      background: colors.backgroundTertiary,
                      borderRadius: 12,
                      borderLeft: `4px solid ${team.color}`
                    }}
                  >
                    <span style={{ 
                      width: 24, height: 24, borderRadius: 6,
                      background: team.color, color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.75rem', fontWeight: 700
                    }}>
                      {index + 1}
                    </span>
                    <input
                      type="text"
                      value={team.name}
                      onChange={(e) => updateTeamName(team.id, e.target.value)}
                      style={{
                        flex: 1,
                        padding: 8,
                        borderRadius: 6,
                        border: `1px solid ${colors.border}`,
                        background: colors.background,
                        color: colors.text,
                        fontSize: '0.9rem',
                        minWidth: 0
                      }}
                    />
                    <button 
                      onClick={() => removeTeam(team.id)} 
                      style={{ background: 'none', border: 'none', color: colors.incorrect, cursor: 'pointer', fontSize: '1.1rem', padding: 4 }}
                    >
                      ×
                    </button>
                  </motion.div>
                ))}
              </div>

              {teams.length === 0 && (
                <div style={{ textAlign: 'center', padding: 30, color: colors.textMuted }}>
                  Добавьте минимум 2 команды для начала игры
                </div>
              )}
            </div>

            {game && teams.length >= 2 && (
              <button 
                onClick={startGame} 
                style={{ ...primaryBtn, width: '100%', padding: 16, fontSize: '1.1rem' }}
              >
                ▶ Начать игру
              </button>
            )}
          </div>
        )}

        {/* PLAYING / PAUSED */}
        {(status === 'playing' || status === 'paused') && game && (
          <div>
            {/* Панель управления */}
            <div style={{ 
              ...cardStyle, 
              marginBottom: 20,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={status === 'paused' ? resumeGame : pauseGame} style={secondaryBtn}>
                  {status === 'paused' ? '▶ Продолжить' : '⏸ Пауза'}
                </button>
                <button 
                  onClick={toggleScores} 
                  style={{ 
                    ...primaryBtn, 
                    background: showScores 
                      ? colors.incorrect 
                      : 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)'
                  }}
                >
                  {showScores ? '✕ Скрыть итоги' : '📊 Показать итоги'}
                </button>
              </div>
              <button onClick={endGame} style={{ ...secondaryBtn, background: colors.incorrect, color: '#fff' }}>
                Завершить
              </button>
            </div>

            {/* Компактный счёт команд с редактированием */}
            <div style={{ ...cardStyle, marginBottom: 20, padding: 16 }}>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', 
                gap: 10
              }}>
                {teams.map(team => {
                  const blocked = currentQuestion ? isTeamBlocked(team.id) : false;
                  return (
                    <div key={team.id} style={{ 
                      textAlign: 'center', 
                      opacity: blocked ? 0.4 : 1,
                      padding: '8px 6px',
                      borderRadius: 10,
                      background: colors.backgroundTertiary,
                      borderLeft: `3px solid ${team.color}`
                    }}>
                      <div style={{ 
                        fontSize: '0.7rem', 
                        color: colors.textMuted, 
                        marginBottom: 4,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 4
                      }}>
                        {team.name.length > 8 ? team.name.slice(0, 8) + '..' : team.name}
                        {blocked && <span style={{ color: colors.incorrect }}>🚫</span>}
                      </div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: team.color, marginBottom: 4 }}>
                        {team.score}
                      </div>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                        <button onClick={() => setTeamScore(team.id, team.score - 1)} style={{ ...secondaryBtn, padding: '2px 8px', fontSize: '0.75rem' }}>−</button>
                        <button onClick={() => setTeamScore(team.id, team.score + 1)} style={{ ...secondaryBtn, padding: '2px 8px', fontSize: '0.75rem' }}>+</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Игровое поле или вопрос */}
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
                  isHost={true}
                  onPlay={handlePlay}
                  onPause={handlePause}
                  onTeamResponse={setRespondingTeam}
                  onCorrect={handleCorrect}
                  onIncorrect={handleIncorrect}
                  onClose={() => { audioManager.stop(); closeQuestion(); }}
                  onSetBet={handleSetBet}
                  onSetAuctionBet={handleSetAuctionBet}
                  onSetCatTarget={handleSetCatTarget}
                />
              ) : (
                <motion.div key="board" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <GameBoard categories={game.categories} theme={theme} teams={teams} onSelectQuestion={selectQuestion} isHost={true} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* FINISHED */}
        {status === 'finished' && (
          <div style={{ ...cardStyle, textAlign: 'center', maxWidth: 600, margin: '0 auto' }}>
            <h2 style={{ marginBottom: 24 }}>🏆 Игра завершена</h2>
            
            {[...teams].sort((a, b) => b.score - a.score).slice(0, 5).map((team, index) => (
              <div key={team.id} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                padding: 14, 
                background: colors.backgroundTertiary, 
                marginBottom: 8, 
                borderRadius: 8, 
                borderLeft: `3px solid ${team.color}` 
              }}>
                <span>#{index + 1} {team.name}</span>
                <strong>{team.score}</strong>
              </div>
            ))}

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24 }}>
              <button onClick={() => setShowStats(true)} style={secondaryBtn}>
                📊 Статистика
              </button>
              <button
                onClick={() => {
                  if (game) {
                    loadGame({ ...game, categories: game.categories.map(c => ({ ...c, questions: c.questions.map(q => ({ ...q, played: false, answeredByTeamId: null })) })) });
                  }
                  teams.forEach(t => setTeamScore(t.id, 0));
                }}
                style={primaryBtn}
              >
                Играть снова
              </button>
              <button onClick={resetGame} style={secondaryBtn}>Новая игра</button>
            </div>
          </div>
        )}

        {/* Модалка статистики */}
        <AnimatePresence>
          {showStats && game && (
            <GameStats
              game={game}
              teams={teams}
              theme={theme}
              onClose={() => setShowStats(false)}
              onExport={handleExportStats}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default HostScreen;
