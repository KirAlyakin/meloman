import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { DesignSystem, getStyles } from '../designSystem';
import { QuizState, QuizActions } from '../hooks/useQuizGame';

interface BreakPhaseProps {
  quiz: QuizState & QuizActions;
  ds: DesignSystem;
}

const BreakPhase: React.FC<BreakPhaseProps> = memo(({ quiz, ds }) => {
  const styles = getStyles(ds);
  const {
    round, teams, roundScores, maxPts, isLast, isRoundSaved,
    updateScore, saveScores, showStandings, goNextRound, getTotal
  } = quiz;

  return (
    <motion.div
      key="break"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 70,
          height: 70,
          borderRadius: 18,
          background: ds.gradientWarm,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
          fontSize: '2rem',
        }}>
          ☕
        </div>
        <h2 style={{ fontSize: '1.5rem', marginBottom: 8, fontWeight: 800, color: ds.textPrimary }}>
          Перерыв
        </h2>
        <p style={{ color: ds.textSecondary, fontSize: '0.9rem' }}>
          Введите баллы за раунд · Макс: {maxPts}
        </p>
      </div>

      {/* Warning */}
      {!isRoundSaved && (
        <div style={{
          padding: '12px 16px',
          background: `${ds.accentWarning}10`,
          border: `1px solid ${ds.accentWarning}`,
          borderRadius: 10,
        }}>
          <span style={{ color: ds.accentWarning, fontWeight: 500 }}>
            📝 Баллы за "{round?.name}" ещё не сохранены
          </span>
        </div>
      )}

      {/* Score Input */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {teams.map(t => (
          <div
            key={t.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '12px 16px',
              background: ds.bgTertiary,
              borderRadius: 12,
              borderLeft: `4px solid ${t.color}`,
              marginBottom: 8,
            }}
          >
            <span style={{ flex: 1, fontWeight: 600, color: ds.textPrimary }}>{t.name}</span>
            <button
              onClick={() => updateScore(t.id, (roundScores[t.id] || 0) - 1)}
              style={{ ...styles.btnSecondary, padding: '6px 12px' }}
            >
              −
            </button>
            <input
              type="number"
              value={roundScores[t.id] || 0}
              onChange={e => updateScore(t.id, parseInt(e.target.value) || 0)}
              style={{
                ...styles.input,
                width: 60,
                textAlign: 'center',
                fontWeight: 700,
                padding: '8px',
              }}
            />
            <button
              onClick={() => updateScore(t.id, (roundScores[t.id] || 0) + 1)}
              style={{ ...styles.btnSecondary, padding: '6px 12px' }}
            >
              +
            </button>
            <span style={{ color: ds.textMuted, fontSize: '0.85rem', minWidth: 60 }}>
              = {getTotal(t.id) + (roundScores[t.id] || 0)}
            </span>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        {!isRoundSaved && (
          <button
            onClick={saveScores}
            style={{
              ...styles.btnSecondary,
              background: `${ds.accentSuccess}15`,
              color: ds.accentSuccess,
              borderColor: ds.accentSuccess,
            }}
          >
            ✓ Сохранить
          </button>
        )}
        <button onClick={showStandings} style={styles.btnSecondary}>
          📊 Таблица
        </button>
        <button onClick={goNextRound} style={styles.btnPrimary}>
          {isLast ? '🏆 Финал' : '▶ Далее'}
        </button>
      </div>
    </motion.div>
  );
});

export default BreakPhase;
