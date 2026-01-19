import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { DesignSystem, getStyles } from '../designSystem';
import { QuizState, QuizActions } from '../hooks/useQuizGame';

interface CollectBlanksProps {
  quiz: QuizState & QuizActions;
  ds: DesignSystem;
}

const CollectBlanks: React.FC<CollectBlanksProps> = memo(({ quiz, ds }) => {
  const styles = getStyles(ds);
  const { round, startAnswers } = quiz;

  return (
    <motion.div
      key="collect"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
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
        width: 90,
        height: 90,
        borderRadius: 24,
        background: ds.gradientPurple,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 24px',
        fontSize: '2.5rem',
      }}>
        📝
      </div>

      <h2 style={{ fontSize: '1.8rem', marginBottom: 12, fontWeight: 800, color: ds.textPrimary }}>
        Сдаём бланки!
      </h2>

      <p style={{ color: ds.textSecondary, marginBottom: 32 }}>
        Раунд "{round?.name}" завершён
      </p>

      <button onClick={startAnswers} style={styles.btnPrimary}>
        ✅ Показать ответы
      </button>
    </motion.div>
  );
});

export default CollectBlanks;
