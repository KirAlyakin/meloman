import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { DesignSystem, getStyles } from '../designSystem';
import { QuizState, QuizActions } from '../hooks/useQuizGame';
import MediaPlayer from '../ui/MediaPlayer';

interface AnswerPhaseProps {
  quiz: QuizState & QuizActions;
  ds: DesignSystem;
  basePath?: string;
}

const AnswerPhase: React.FC<AnswerPhaseProps> = memo(({ quiz, ds, basePath }) => {
  const styles = getStyles(ds);
  const { round, answer, aIdx, totalQ, isLast, prevA, nextA } = quiz;

  if (!answer) return null;

  // Определяем тип медиа
  const mediaType = round?.type === 'music' ? 'music' : round?.type === 'video' ? 'video' : 'picture';

  return (
    <motion.div
      key={`a-${aIdx}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
    >
      <span style={{ ...styles.tag('#fff'), background: ds.accentSuccess, marginBottom: 16 }}>
        Ответ {aIdx + 1} · {answer.points} б.
      </span>

      {/* Media Player — компактный режим для ответов */}
      {answer.mediaPath && (
        <MediaPlayer
          type={mediaType}
          src={answer.mediaPath}
          basePath={basePath}
          startTime={answer.mediaStartTime}
          endTime={answer.mediaEndTime}
          showControls={mediaType !== 'picture'}
          compact={true}
          ds={ds}
        />
      )}

      <p style={{ fontSize: '1.05rem', color: ds.textSecondary, marginBottom: 12 }}>
        {answer.text}
      </p>

      {/* Options for choice type */}
      {round?.type === 'choice' && answer.options && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
          {['A', 'B', 'C', 'D'].map((letter, idx) => {
            const isCorrect = answer.correctOptionIndex === idx;
            return (
              <div
                key={letter}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '14px 16px',
                  background: isCorrect ? `${ds.accentSuccess}15` : ds.bgTertiary,
                  border: isCorrect ? `2px solid ${ds.accentSuccess}` : `1px solid ${ds.border}`,
                  borderRadius: 12,
                }}
              >
                <span style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: isCorrect ? ds.accentSuccess : ds.bgSecondary,
                  color: isCorrect ? '#fff' : ds.textPrimary,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                }}>
                  {letter}
                </span>
                <span style={{ fontWeight: isCorrect ? 600 : 400, color: ds.textPrimary }}>
                  {answer.options?.[idx] || ''}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Correct answer */}
      <div style={{
        padding: '24px',
        background: `${ds.accentSuccess}10`,
        border: `2px solid ${ds.accentSuccess}`,
        borderRadius: 16,
        textAlign: 'center',
        marginBottom: 20,
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}>
        <span style={{ color: ds.textMuted, fontSize: '0.9rem' }}>Правильный ответ:</span>
        <p style={{ margin: 0, marginTop: 8, fontSize: '1.6rem', fontWeight: 800, color: ds.accentSuccess }}>
          {answer.answer}
        </p>
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={prevA}
          disabled={aIdx === 0}
          style={{ ...styles.btnSecondary, opacity: aIdx === 0 ? 0.5 : 1 }}
        >
          ←
        </button>
        <button onClick={nextA} style={styles.btnPrimary}>
          {aIdx < totalQ - 1 ? '→' : (isLast ? '🏆' : '→ Раунд')}
        </button>
      </div>
    </motion.div>
  );
});

export default AnswerPhase;
