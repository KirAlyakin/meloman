import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { DesignSystem, getStyles } from '../designSystem';
import { QuizState, QuizActions } from '../hooks/useQuizGame';

interface GameEndProps {
  quiz: QuizState & QuizActions;
  ds: DesignSystem;
  onEnd: () => void;
}

const GameEnd: React.FC<GameEndProps> = memo(({ quiz, ds, onEnd }) => {
  const styles = getStyles(ds);
  const { teams, getTotal } = quiz;

  const sortedTeams = [...teams].sort((a, b) => getTotal(b.id) - getTotal(a.id));

  return (
    <motion.div
      key="end"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      style={{
        textAlign: 'center',
        padding: 40,
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <div style={{
        width: 100,
        height: 100,
        borderRadius: 28,
        background: ds.gradientWarm,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 24px',
        fontSize: '3rem',
      }}>
        🏆
      </div>

      <h1 style={{ fontSize: '2rem', marginBottom: 28, fontWeight: 800, color: ds.textPrimary }}>
        Финал
      </h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
        {sortedTeams.map((t, i) => (
          <div
            key={t.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 20px',
              background: i === 0 ? ds.gradientWarm : ds.bgTertiary,
              borderRadius: 14,
              borderLeft: i > 0 ? `4px solid ${t.color}` : 'none',
            }}
          >
            <span style={{
              fontSize: '1.1rem',
              fontWeight: 600,
              color: i === 0 ? '#fff' : ds.textPrimary,
            }}>
              {['🥇', '🥈', '🥉'][i] || `#${i + 1}`} {t.name}
            </span>
            <span style={{
              fontWeight: 800,
              fontSize: '1.4rem',
              color: i === 0 ? '#fff' : ds.textPrimary,
            }}>
              {getTotal(t.id)}
            </span>
          </div>
        ))}
      </div>

      <button onClick={onEnd} style={styles.btnPrimary}>
        🏠 Завершить
      </button>
    </motion.div>
  );
});

export default GameEnd;
