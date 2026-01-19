import React, { useState, memo } from 'react';
import { PubQuizGame } from '../../../types/game';
import { DesignSystem, getStyles, getRoundIcon } from '../designSystem';
import { QuizState, QuizActions } from '../hooks/useQuizGame';

interface SidebarProps {
  quiz: QuizState & QuizActions;
  game: PubQuizGame;
  ds: DesignSystem;
}

const Sidebar: React.FC<SidebarProps> = memo(({ quiz, game, ds }) => {
  const styles = getStyles(ds);
  const {
    teams, editingTeam, roundIdx, qIdx, aIdx, phase, totalQ, scores, roundScores,
    getTotal, goQ, goA, goToRound, updateTeamName, setEditingTeam, 
    updateScore, editSavedScore, saveScores
  } = quiz;

  // Для просмотра/редактирования баллов других раундов
  const [viewingRound, setViewingRound] = useState<number | null>(null);
  const displayRound = viewingRound ?? roundIdx;

  // Сохранены ли баллы за просматриваемый раунд
  const isDisplayRoundSaved = scores[teams[0]?.id]?.[displayRound] !== undefined;
  const isCurrentRound = displayRound === roundIdx;

  return (
    <div style={{ width: 300, display: 'flex', flexDirection: 'column', gap: 12, overflow: 'hidden' }}>
      
      {/* === БЛОК БАЛЛОВ === */}
      <div style={{ ...styles.card, flex: 1, overflow: 'auto' }}>
        {/* Переключатель раундов */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <button
            onClick={() => setViewingRound(Math.max(0, displayRound - 1))}
            disabled={displayRound === 0}
            style={{
              ...styles.btnSecondary,
              padding: '6px 12px',
              opacity: displayRound === 0 ? 0.3 : 1,
              fontSize: '0.9rem',
              fontWeight: 600,
              lineHeight: 1,
            }}
          >
            ←
          </button>
          <div style={{ flex: 1, textAlign: 'center', minWidth: 0 }}>
            <div style={{ 
              fontSize: '0.8rem', 
              fontWeight: 600, 
              color: isCurrentRound ? ds.accent : ds.textSecondary,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {getRoundIcon(game.rounds[displayRound]?.type)} {displayRound + 1}. {game.rounds[displayRound]?.name}
            </div>
          </div>
          <button
            onClick={() => setViewingRound(Math.min(game.rounds.length - 1, displayRound + 1))}
            disabled={displayRound === game.rounds.length - 1}
            style={{
              ...styles.btnSecondary,
              padding: '6px 12px',
              opacity: displayRound === game.rounds.length - 1 ? 0.3 : 1,
              fontSize: '0.9rem',
              fontWeight: 600,
              lineHeight: 1,
            }}
          >
            →
          </button>
        </div>

        {/* Кнопка "вернуться к текущему" если смотрим другой раунд */}
        {!isCurrentRound && (
          <button
            onClick={() => setViewingRound(null)}
            style={{
              ...styles.btnSecondary,
              width: '100%',
              padding: '4px',
              marginBottom: 8,
              fontSize: '0.7rem',
            }}
          >
            ↩ К раунду {roundIdx + 1}
          </button>
        )}

        {/* Кнопка сохранения для текущего раунда */}
        {isCurrentRound && !isDisplayRoundSaved && (
          <button
            onClick={saveScores}
            style={{
              width: '100%',
              padding: '6px',
              marginBottom: 8,
              background: ds.accentSuccess,
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            💾 Сохранить баллы за раунд
          </button>
        )}

        {/* Список команд с вводом баллов */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {teams.map((t, i) => {
            // Для текущего раунда: если не сохранено — roundScores, иначе — scores
            // Для других раундов: всегда scores
            const savedValue = scores[t.id]?.[displayRound];
            const displayValue = isCurrentRound && !isDisplayRoundSaved 
              ? (roundScores[t.id] ?? '') 
              : (savedValue ?? '');

            return (
              <div
                key={t.id}
                style={{
                  padding: '6px 8px',
                  background: ds.bgTertiary,
                  borderRadius: 6,
                  borderLeft: `3px solid ${t.color}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span style={{ fontSize: '0.65rem', color: ds.textMuted, width: 18 }}>#{i + 1}</span>
                
                {editingTeam === t.id ? (
                  <input
                    value={t.name}
                    onChange={e => updateTeamName(t.id, e.target.value)}
                    onBlur={() => setEditingTeam(null)}
                    onKeyDown={e => e.key === 'Enter' && setEditingTeam(null)}
                    autoFocus
                    style={{ ...styles.input, flex: 1, padding: '2px 6px', fontSize: '0.75rem' }}
                  />
                ) : (
                  <span
                    onClick={() => setEditingTeam(t.id)}
                    style={{ 
                      flex: 1, 
                      fontSize: '0.75rem', 
                      cursor: 'pointer', 
                      color: ds.textPrimary,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title="Клик для редактирования"
                  >
                    {t.name}
                  </span>
                )}

                {/* Ввод баллов — ВСЕГДА редактируемый */}
                <input
                  type="number"
                  value={displayValue}
                  onChange={e => {
                    const val = parseInt(e.target.value) || 0;
                    if (isCurrentRound && !isDisplayRoundSaved) {
                      updateScore(t.id, val);
                    } else {
                      editSavedScore(t.id, displayRound, val);
                    }
                  }}
                  style={{
                    ...styles.input,
                    width: 44,
                    padding: '2px 4px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    textAlign: 'center',
                    background: isDisplayRoundSaved ? `${ds.accentSuccess}10` : ds.bgPrimary,
                  }}
                  placeholder="0"
                />

                {/* Итого */}
                <span style={{ 
                  width: 40, 
                  textAlign: 'right',
                  fontWeight: 700, 
                  fontSize: '0.8rem', 
                  color: ds.accent 
                }}>
                  Σ{getTotal(t.id)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* === НАВИГАЦИЯ ПО ВОПРОСАМ === */}
      {(phase === 'questions' || phase === 'show-answers') && (
        <div style={styles.card}>
          <h4 style={{ margin: 0, marginBottom: 6, fontWeight: 600, fontSize: '0.75rem', color: ds.textMuted }}>
            {phase === 'questions' ? 'Вопросы' : 'Ответы'}
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4 }}>
            {Array.from({ length: totalQ }).map((_, i) => {
              const cur = phase === 'questions' ? qIdx : aIdx;
              const active = i === cur;
              const past = i < cur;
              return (
                <button
                  key={i}
                  onClick={() => phase === 'questions' ? goQ(i) : goA(i)}
                  style={{
                    padding: 5,
                    background: active ? ds.gradientBrand : past ? `${ds.accentSuccess}25` : ds.bgTertiary,
                    border: 'none',
                    borderRadius: 5,
                    color: active ? '#fff' : past ? ds.accentSuccess : ds.textPrimary,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '0.7rem',
                  }}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* === РАУНДЫ — ВСЕГДА ПОКАЗЫВАЕМ === */}
      <div style={styles.card}>
        <h4 style={{ margin: 0, marginBottom: 6, fontWeight: 600, fontSize: '0.75rem', color: ds.textMuted }}>
          Раунды
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, maxHeight: 180, overflow: 'auto' }}>
          {game.rounds.map((r, i) => {
            const isCurrent = i === roundIdx;
            const isSaved = scores[teams[0]?.id]?.[i] !== undefined;
            return (
              <div
                key={r.id}
                onClick={() => goToRound(i)}
                style={{
                  padding: '6px 8px',
                  background: isCurrent ? `${ds.accent}15` : ds.bgTertiary,
                  border: isCurrent ? `1px solid ${ds.accent}` : '1px solid transparent',
                  borderRadius: 5,
                  fontSize: '0.7rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer',
                }}
              >
                <span>{getRoundIcon(r.type)}</span>
                <span style={{
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  color: ds.textPrimary,
                }}>
                  {r.name}
                </span>
                {isSaved && (
                  <span style={{ color: ds.accentSuccess, fontWeight: 600 }}>✓</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* === ПОЛНАЯ ТАБЛИЦА ПРИ ПЕРЕРЫВЕ === */}
      {(phase === 'break' || phase === 'standings' || phase === 'game-end') && (
        <div style={{ ...styles.card, overflow: 'auto' }}>
          <h4 style={{ margin: 0, marginBottom: 8, fontWeight: 600, fontSize: '0.75rem', color: ds.textMuted }}>
            📊 Сводка
          </h4>

          {/* Заголовки */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: `1fr repeat(${Math.min(game.rounds.length, 8)}, 28px) 36px`,
            gap: 2,
            marginBottom: 4,
            fontSize: '0.6rem',
            color: ds.textMuted,
          }}>
            <div></div>
            {game.rounds.slice(0, 8).map((r, i) => (
              <div key={i} style={{ textAlign: 'center' }} title={r.name}>
                {i + 1}
              </div>
            ))}
            <div style={{ textAlign: 'right' }}>Σ</div>
          </div>

          {/* Команды */}
          {teams
            .slice()
            .sort((a, b) => getTotal(b.id) - getTotal(a.id))
            .map((t, pos) => (
            <div
              key={t.id}
              style={{
                display: 'grid',
                gridTemplateColumns: `1fr repeat(${Math.min(game.rounds.length, 8)}, 28px) 36px`,
                gap: 2,
                padding: '3px 0',
                borderBottom: `1px solid ${ds.border}`,
                fontSize: '0.65rem',
              }}
            >
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 4,
                overflow: 'hidden',
              }}>
                <span style={{ 
                  fontWeight: 700,
                  color: pos === 0 ? '#FFD700' : pos === 1 ? '#C0C0C0' : pos === 2 ? '#CD7F32' : ds.textMuted,
                }}>
                  {pos + 1}
                </span>
                <span style={{ 
                  borderLeft: `2px solid ${t.color}`,
                  paddingLeft: 4,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  color: ds.textPrimary,
                }}>
                  {t.name}
                </span>
              </div>
              
              {game.rounds.slice(0, 8).map((_, ri) => (
                <div 
                  key={ri} 
                  style={{ 
                    textAlign: 'center',
                    color: scores[t.id]?.[ri] !== undefined ? ds.textPrimary : ds.textMuted,
                  }}
                >
                  {scores[t.id]?.[ri] ?? '-'}
                </div>
              ))}
              
              <div style={{ 
                textAlign: 'right', 
                fontWeight: 700, 
                color: ds.accent 
              }}>
                {getTotal(t.id)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

export default Sidebar;
