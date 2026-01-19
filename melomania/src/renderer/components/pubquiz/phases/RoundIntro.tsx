import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { PubQuizGame } from '../../../types/game';
import { DesignSystem, getStyles, getRoundIcon } from '../designSystem';
import { QuizState, QuizActions } from '../hooks/useQuizGame';
import { printRoundBlanks } from '../BlankGenerator';

interface RoundIntroProps {
  quiz: QuizState & QuizActions;
  game: PubQuizGame;
  ds: DesignSystem;
}

// Правила по умолчанию для типов раундов
const defaultRules: Record<string, string> = {
  text: 'Классический раунд. Отвечайте на вопросы письменно на бланках.',
  music: 'Прослушайте музыкальный фрагмент и угадайте исполнителя/название.',
  picture: 'Посмотрите на изображение и ответьте на вопрос.',
  blitz: 'Быстрые вопросы! На каждый ответ даётся меньше времени.',
  video: 'Посмотрите видео и ответьте на вопрос.',
  choice: 'Выберите один правильный ответ из четырёх вариантов (A, B, C, D).',
};

const RoundIntro: React.FC<RoundIntroProps> = memo(({ quiz, game, ds }) => {
  const styles = getStyles(ds);
  const { round, roundIdx, totalQ, maxPts, teams, startRound } = quiz;

  const rules = round?.rules || defaultRules[round?.type || 'text'];

  return (
    <motion.div
      key="intro"
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
        alignItems: 'center',
      }}
    >
      {/* Иконка раунда */}
      <div style={{
        width: 80,
        height: 80,
        borderRadius: 20,
        background: ds.gradientBrand,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 20px',
        fontSize: '2.2rem',
        boxShadow: ds.shadowPrimary,
      }}>
        {getRoundIcon(round?.type || 'text')}
      </div>

      {/* Номер раунда */}
      <p style={{ fontSize: '1rem', color: ds.textMuted, marginBottom: 8 }}>
        Раунд {roundIdx + 1} из {game.rounds.length}
      </p>

      {/* Название раунда */}
      <h1 style={{ fontSize: '2rem', marginBottom: 8, fontWeight: 800, color: ds.textPrimary }}>
        {round?.name}
      </h1>

      {/* Тема раунда */}
      {round?.topic && (
        <p style={{ 
          fontSize: '1.1rem', 
          color: ds.accent, 
          marginBottom: 16,
          fontWeight: 600,
        }}>
          Тема: {round.topic}
        </p>
      )}

      {/* Статистика */}
      <p style={{ color: ds.textSecondary, marginBottom: 20 }}>
        {totalQ} вопросов · {maxPts} баллов · {round?.defaultTimeLimit} сек на ответ
      </p>

      {/* Правила раунда */}
      <div style={{
        background: ds.bgTertiary,
        borderRadius: 12,
        padding: '16px 24px',
        maxWidth: 500,
        marginBottom: 24,
        border: `1px solid ${ds.border}`,
      }}>
        <p style={{ 
          fontSize: '0.85rem', 
          color: ds.textMuted, 
          marginBottom: 6,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}>
          📋 Правила
        </p>
        <p style={{ 
          fontSize: '0.95rem', 
          color: ds.textSecondary, 
          lineHeight: 1.5,
          margin: 0,
        }}>
          {rules}
        </p>
      </div>

      {/* Кнопки */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        <button
          onClick={() => printRoundBlanks(game, roundIdx, teams.length)}
          style={styles.btnSecondary}
        >
          🖨️ Бланки
        </button>
        <button onClick={startRound} style={styles.btnPrimary}>
          ▶ Начать раунд
        </button>
      </div>
    </motion.div>
  );
});

export default RoundIntro;
