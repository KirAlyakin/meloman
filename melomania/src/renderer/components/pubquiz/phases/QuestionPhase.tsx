import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { DesignSystem, getStyles } from '../designSystem';
import { QuizState, QuizActions } from '../hooks/useQuizGame';
import Timer from '../ui/Timer';
import MediaPlayer from '../ui/MediaPlayer';

interface QuestionPhaseProps {
  quiz: QuizState & QuizActions;
  ds: DesignSystem;
  basePath?: string;
}

const QuestionPhase: React.FC<QuestionPhaseProps> = memo(({ quiz, ds, basePath }) => {
  const styles = getStyles(ds);
  const {
    round, question, qIdx, totalQ, time, timerOn, musicOn,
    prevQ, nextQ, startTimer, stopTimer, resetTimer, toggleMusic
  } = quiz;

  if (!question) return null;

  // Определяем тип медиа
  const mediaType = round?.type === 'music' ? 'music' : round?.type === 'video' ? 'video' : 'picture';

  return (
    <motion.div
      key={`q-${qIdx}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
    >
      <span style={{ ...styles.tag('#fff'), background: ds.gradientWarm, marginBottom: 16 }}>
        Вопрос {qIdx + 1} · {question.points} б.
      </span>

      {/* Media Player — универсальный для картинок, аудио, видео */}
      {question.mediaPath && (
        <MediaPlayer
          type={mediaType}
          src={question.mediaPath}
          basePath={basePath}
          startTime={question.mediaStartTime}
          endTime={question.mediaEndTime}
          showControls={true}
          ds={ds}
        />
      )}

      <p style={{
        fontSize: '1.25rem',
        fontWeight: 600,
        lineHeight: 1.6,
        marginBottom: 20,
        color: ds.textPrimary,
        flex: 1,
      }}>
        {question.text}
      </p>

      {/* Options for choice type */}
      {round?.type === 'choice' && question.options && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
          {['A', 'B', 'C', 'D'].map((letter, idx) => (
            <div
              key={letter}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '14px 16px',
                background: ds.bgTertiary,
                borderRadius: 12,
                border: `1px solid ${ds.border}`,
              }}
            >
              <span style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: ds.bgSecondary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.9rem',
                color: ds.textPrimary,
              }}>
                {letter}
              </span>
              <span style={{ color: ds.textPrimary }}>{question.options?.[idx] || ''}</span>
            </div>
          ))}
        </div>
      )}

      {/* Answer for host */}
      <div style={{
        padding: '14px 18px',
        background: `${ds.accentSuccess}10`,
        border: `1px solid ${ds.accentSuccess}`,
        borderRadius: 12,
        marginBottom: 20,
      }}>
        <span style={{ color: ds.textMuted, fontSize: '0.8rem' }}>Ответ:</span>
        <p style={{ margin: 0, marginTop: 4, fontWeight: 700, color: ds.accentSuccess, fontSize: '1.1rem' }}>
          {question.answer}
        </p>
      </div>

      {/* Navigation + Timer */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <button
          onClick={prevQ}
          disabled={qIdx === 0}
          style={{ ...styles.btnSecondary, opacity: qIdx === 0 ? 0.5 : 1 }}
        >
          ←
        </button>

        <Timer
          time={time}
          timerOn={timerOn}
          musicOn={musicOn}
          onStart={startTimer}
          onStop={stopTimer}
          onReset={resetTimer}
          onToggleMusic={toggleMusic}
          ds={ds}
        />

        <button onClick={nextQ} style={styles.btnPrimary}>
          {qIdx < totalQ - 1 ? '→' : '✓'}
        </button>
      </div>
    </motion.div>
  );
});

export default QuestionPhase;
