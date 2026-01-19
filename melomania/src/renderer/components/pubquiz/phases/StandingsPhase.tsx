import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { PubQuizGame } from '../../../types/game';
import { DesignSystem, getStyles } from '../designSystem';
import { QuizState, QuizActions } from '../hooks/useQuizGame';

interface StandingsPhaseProps {
  quiz: QuizState & QuizActions;
  game: PubQuizGame;
  ds: DesignSystem;
}

// Разбивка названия на строки
const formatName = (name: string): React.ReactNode => {
  if (name.length <= 10) return name;
  const words = name.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
  for (const word of words) {
    if ((currentLine + ' ' + word).trim().length <= 10) {
      currentLine = (currentLine + ' ' + word).trim();
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  
  return lines.map((line, i) => (
    <React.Fragment key={i}>
      {line}
      {i < lines.length - 1 && <br />}
    </React.Fragment>
  ));
};

const StandingsPhase: React.FC<StandingsPhaseProps> = memo(({ quiz, game, ds }) => {
  const styles = getStyles(ds);
  const { teams, scores, doneRounds, isLast, startBreak, goNextRound, getTotal } = quiz;

  const sortedTeams = [...teams].sort((a, b) => getTotal(b.id) - getTotal(a.id));

  return (
    <motion.div
      key="standings"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
    >
      <h2 style={{ marginBottom: 20, fontSize: '1.3rem', fontWeight: 700, color: ds.textPrimary }}>
        📊 Таблица
      </h2>

      <div style={{ flex: 1, overflow: 'auto', borderRadius: 14, border: `1px solid ${ds.border}` }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ background: ds.bgTertiary }}>
              <th style={{
                padding: '14px 16px',
                textAlign: 'left',
                fontWeight: 700,
                color: ds.textPrimary,
              }}>
                Команда
              </th>
              {doneRounds.map(i => (
                <th
                  key={i}
                  style={{
                    padding: '12px 8px',
                    textAlign: 'center',
                    fontWeight: 600,
                    color: ds.textSecondary,
                    lineHeight: 1.3,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {formatName(game.rounds[i]?.name || `Р${i + 1}`)}
                </th>
              ))}
              <th style={{
                padding: '14px 16px',
                textAlign: 'center',
                fontWeight: 700,
                background: `${ds.accent}10`,
                color: ds.accent,
              }}>
                Итого
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedTeams.map((t, i) => (
              <tr key={t.id} style={{ borderBottom: `1px solid ${ds.border}` }}>
                <td style={{
                  padding: '14px 16px',
                  fontWeight: 600,
                  color: ds.textPrimary,
                  borderLeft: `4px solid ${t.color}`,
                }}>
                  {i < 3 ? ['🥇', '🥈', '🥉'][i] + ' ' : ''}{t.name}
                </td>
                {doneRounds.map(r => (
                  <td
                    key={r}
                    style={{ padding: '14px 8px', textAlign: 'center', color: ds.textSecondary }}
                  >
                    {scores[t.id]?.[r] ?? '-'}
                  </td>
                ))}
                <td style={{
                  padding: '14px 16px',
                  textAlign: 'center',
                  fontWeight: 800,
                  fontSize: '1.1rem',
                  background: `${ds.accent}05`,
                  color: ds.accent,
                }}>
                  {getTotal(t.id)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
        <button onClick={startBreak} style={styles.btnSecondary}>
          ← Перерыв
        </button>
        <button onClick={goNextRound} style={styles.btnPrimary}>
          {isLast ? '🏆 Финал' : '▶ Далее'}
        </button>
      </div>
    </motion.div>
  );
});

export default StandingsPhase;
