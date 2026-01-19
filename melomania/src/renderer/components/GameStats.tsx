import React from 'react';
import { motion } from 'framer-motion';
import { JeopardyGame, JeopardyCategory, JeopardyQuestion, Team, ThemeId, JeopardyQuestionType } from '../types/game';
import { getTheme } from '../themes';

interface GameStatsProps {
  game: JeopardyGame;
  teams: Team[];
  theme: ThemeId;
  onClose: () => void;
  onExport: () => void;
}

const GameStats: React.FC<GameStatsProps> = ({ game, teams, theme, onClose, onExport }) => {
  const colors = getTheme(theme).colors;

  // Статистика по командам
  const teamStats = teams.map(team => {
    let correctAnswers = 0;
    let totalAnswered = 0;

    game.categories.forEach((cat: JeopardyCategory) => {
      cat.questions.forEach((q: JeopardyQuestion) => {
        if (q.answeredByTeamId === team.id) {
          correctAnswers++;
        }
        if (q.played && q.answeredByTeamId) {
          // Подсчёт только отвеченных вопросов
        }
      });
    });

    return {
      ...team,
      correctAnswers,
      accuracy: totalAnswered > 0 ? Math.round((correctAnswers / totalAnswered) * 100) : 0
    };
  }).sort((a, b) => b.score - a.score);

  // Общая статистика
  const totalQuestions = game.categories.reduce((sum: number, c: JeopardyCategory) => sum + c.questions.length, 0);
  const playedQuestions = game.categories.reduce((sum: number, c: JeopardyCategory) => 
    sum + c.questions.filter((q: JeopardyQuestion) => q.played).length, 0
  );
  const answeredQuestions = game.categories.reduce((sum: number, c: JeopardyCategory) =>
    sum + c.questions.filter((q: JeopardyQuestion) => q.answeredByTeamId).length, 0
  );

  // Статистика по категориям
  const categoryStats = game.categories.map((cat: JeopardyCategory) => {
    const played = cat.questions.filter((q: JeopardyQuestion) => q.played).length;
    const answered = cat.questions.filter((q: JeopardyQuestion) => q.answeredByTeamId).length;
    return {
      name: cat.name,
      total: cat.questions.length,
      played,
      answered,
      percentage: cat.questions.length > 0 ? Math.round((played / cat.questions.length) * 100) : 0
    };
  });

  // Статистика по типам вопросов
  const questionTypeStats: Record<JeopardyQuestionType, { total: number; answered: number }> = {
    normal: { total: 0, answered: 0 },
    bet: { total: 0, answered: 0 },
    auction: { total: 0, answered: 0 },
    cat: { total: 0, answered: 0 },
    sing: { total: 0, answered: 0 }
  };

  game.categories.forEach((cat: JeopardyCategory) => {
    cat.questions.forEach((q: JeopardyQuestion) => {
      questionTypeStats[q.type].total++;
      if (q.answeredByTeamId) {
        questionTypeStats[q.type].answered++;
      }
    });
  });

  const cardStyle: React.CSSProperties = {
    background: colors.backgroundSecondary,
    backdropFilter: 'blur(20px)',
    borderRadius: 16,
    border: `1px solid ${colors.border}`,
    padding: 24
  };

  const btnPrimary: React.CSSProperties = {
    padding: '12px 24px',
    borderRadius: 12,
    border: 'none',
    background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
    color: '#fff',
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: '0.9rem'
  };

  const btnSecondary: React.CSSProperties = {
    padding: '10px 20px',
    borderRadius: 10,
    border: `1px solid ${colors.border}`,
    background: colors.backgroundTertiary,
    color: colors.text,
    fontWeight: 500,
    cursor: 'pointer',
    fontSize: '0.85rem'
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `${colors.background}f5`,
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
        padding: 40,
        overflow: 'auto'
      }}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        style={{
          maxWidth: 900,
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto'
        }}
      >
        {/* Заголовок */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h2 style={{
            fontSize: '2rem',
            fontWeight: 800,
            background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: 8
          }}>
            📊 Статистика игры
          </h2>
          <p style={{ color: colors.textMuted }}>{game.name}</p>
        </div>

        {/* Подиум */}
        <div style={{ ...cardStyle, marginBottom: 20 }}>
          <h3 style={{ margin: 0, marginBottom: 20, fontSize: '1.1rem', fontWeight: 600 }}>🏆 Итоговые результаты</h3>
          
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 20, marginBottom: 20 }}>
            {teamStats.slice(0, 3).map((team, index) => {
              const heights = [160, 120, 90];
              const medals = ['🥇', '🥈', '🥉'];
              const order = [1, 0, 2]; // 2nd, 1st, 3rd place order
              const actualIndex = order[index];
              const actualTeam = teamStats[actualIndex];
              
              if (!actualTeam) return null;

              return (
                <motion.div
                  key={actualTeam.id}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: heights[actualIndex], opacity: 1 }}
                  transition={{ delay: actualIndex * 0.15, duration: 0.5 }}
                  style={{
                    width: 140,
                    background: actualIndex === 0 
                      ? 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)'
                      : `linear-gradient(180deg, ${actualTeam.color}, ${actualTeam.color}88)`,
                    borderRadius: '16px 16px 0 0',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 16,
                    color: '#fff',
                    textAlign: 'center'
                  }}
                >
                  <span style={{ fontSize: '2rem' }}>{medals[actualIndex]}</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, marginTop: 8 }}>{actualTeam.name}</span>
                  <span style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: 4 }}>{actualTeam.score}</span>
                  <span style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: 4 }}>
                    {actualTeam.correctAnswers} ответов
                  </span>
                </motion.div>
              );
            })}
          </div>

          {/* Остальные команды */}
          {teamStats.length > 3 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
              {teamStats.slice(3).map((team, index) => (
                <div
                  key={team.id}
                  style={{
                    padding: '10px 16px',
                    background: colors.backgroundTertiary,
                    borderRadius: 10,
                    borderLeft: `4px solid ${team.color}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12
                  }}
                >
                  <span style={{ color: colors.textMuted, fontSize: '0.85rem' }}>#{index + 4}</span>
                  <span style={{ fontWeight: 600 }}>{team.name}</span>
                  <span style={{ color: team.color, fontWeight: 700 }}>{team.score}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Общая статистика */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
          <div style={{ ...cardStyle, textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: colors.accent }}>{playedQuestions}</div>
            <div style={{ fontSize: '0.85rem', color: colors.textMuted }}>из {totalQuestions} вопросов</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 500, marginTop: 4 }}>Сыграно</div>
          </div>
          <div style={{ ...cardStyle, textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: colors.correct }}>{answeredQuestions}</div>
            <div style={{ fontSize: '0.85rem', color: colors.textMuted }}>правильных</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 500, marginTop: 4 }}>Угадано</div>
          </div>
          <div style={{ ...cardStyle, textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: colors.incorrect }}>{playedQuestions - answeredQuestions}</div>
            <div style={{ fontSize: '0.85rem', color: colors.textMuted }}>без ответа</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 500, marginTop: 4 }}>Не угадано</div>
          </div>
        </div>

        {/* Статистика по категориям */}
        <div style={{ ...cardStyle, marginBottom: 20 }}>
          <h3 style={{ margin: 0, marginBottom: 16, fontSize: '1rem', fontWeight: 600 }}>📁 По категориям</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {categoryStats.map(cat => (
              <div key={cat.name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ width: 120, fontSize: '0.9rem', fontWeight: 500 }}>{cat.name}</span>
                <div style={{ flex: 1, height: 8, background: colors.backgroundTertiary, borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{
                    width: `${cat.percentage}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #3B82F6, #8B5CF6)',
                    borderRadius: 4
                  }} />
                </div>
                <span style={{ fontSize: '0.85rem', color: colors.textMuted, width: 80, textAlign: 'right' }}>
                  {cat.played}/{cat.total}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Статистика по типам */}
        <div style={{ ...cardStyle, marginBottom: 24 }}>
          <h3 style={{ margin: 0, marginBottom: 16, fontSize: '1rem', fontWeight: 600 }}>🎯 По типам вопросов</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {[
              { type: 'normal', icon: '🎵', label: 'Обычные' },
              { type: 'bet', icon: '💰', label: 'Ставка' },
              { type: 'auction', icon: '🔨', label: 'Аукцион' },
              { type: 'cat', icon: '🐱', label: 'Кот в мешке' },
              { type: 'sing', icon: '🎤', label: 'Спой!' }
            ].map(({ type, icon, label }) => {
              const stats = questionTypeStats[type as keyof typeof questionTypeStats];
              if (stats.total === 0) return null;
              return (
                <div key={type} style={{
                  padding: '10px 16px',
                  background: colors.backgroundTertiary,
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  <span>{icon}</span>
                  <span style={{ fontWeight: 500 }}>{label}</span>
                  <span style={{ color: colors.textMuted }}>
                    {stats.answered}/{stats.total}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Кнопки */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
          <button onClick={onExport} style={btnSecondary}>
            📥 Экспорт CSV
          </button>
          <button onClick={onClose} style={btnPrimary}>
            Закрыть
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default GameStats;
