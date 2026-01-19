import React, { memo } from 'react';
import { DesignSystem, getStyles, getRoundIcon } from '../designSystem';
import { QuizState } from '../hooks/useQuizGame';

interface HostHeaderProps {
  quiz: QuizState;
  ds: DesignSystem;
  onBreak: () => void;
  onStandings: () => void;
  onEnd: () => void;
  onOpenProjector?: () => void;
  onOpenSoundSettings?: () => void;
  ambientOn?: boolean;
  onToggleAmbient?: () => void;
}

const HostHeader: React.FC<HostHeaderProps> = memo(({ quiz, ds, onBreak, onStandings, onEnd, onOpenProjector, onOpenSoundSettings, ambientOn, onToggleAmbient }) => {
  const styles = getStyles(ds);
  const { round, roundIdx, totalQ, phase, qIdx, aIdx } = quiz;

  const phaseLabel = {
    'round-intro': '🎬 Начало',
    'questions': `❓ ${qIdx + 1}/${totalQ}`,
    'collect-blanks': '📝 Сбор',
    'show-answers': `✅ ${aIdx + 1}/${totalQ}`,
    'break': '☕ Перерыв',
    'standings': '📊 Таблица',
    'game-end': '🏆 Финал',
  }[phase];

  return (
    <div style={{
      ...styles.card,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '14px 20px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Кнопка проектора */}
        {onOpenProjector && (
          <button
            onClick={onOpenProjector}
            title="Открыть экран проектора"
            style={{
              ...styles.btnSecondary,
              background: `${ds.accentSecondary}15`,
              color: ds.accentSecondary,
              borderColor: ds.accentSecondary,
              padding: '10px 14px',
              fontSize: '1.1rem',
            }}
          >
            📺
          </button>
        )}
        
        <div style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: ds.gradientBrand,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.3rem',
          boxShadow: ds.shadowPrimary,
        }}>
          {getRoundIcon(round?.type || 'text')}
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: ds.textPrimary }}>
            {round?.name}
          </h2>
          <p style={{ margin: 0, marginTop: 2, color: ds.textMuted, fontSize: '0.8rem' }}>
            Раунд {roundIdx + 1} · {totalQ} вопросов
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={styles.tag(ds.accent)}>{phaseLabel}</span>

        {/* Кнопка фоновой музыки */}
        {onToggleAmbient && (
          <button
            onClick={onToggleAmbient}
            title={ambientOn ? 'Выключить фоновую музыку' : 'Включить фоновую музыку'}
            style={{
              ...styles.btnSecondary,
              background: ambientOn ? `${ds.accent}30` : `${ds.accent}10`,
              color: ambientOn ? ds.accent : ds.textMuted,
              borderColor: ambientOn ? ds.accent : ds.border,
              padding: '10px 14px',
            }}
          >
            🎵
          </button>
        )}

        {/* Кнопка настроек звуков */}
        {onOpenSoundSettings && (
          <button
            onClick={onOpenSoundSettings}
            title="Настройки звуков"
            style={{
              ...styles.btnSecondary,
              padding: '10px 14px',
            }}
          >
            🔊
          </button>
        )}

        {phase !== 'break' && phase !== 'standings' && phase !== 'game-end' && (
          <button
            onClick={onBreak}
            style={{
              ...styles.btnSecondary,
              background: `${ds.accentWarning}15`,
              color: ds.accentWarning,
              borderColor: ds.accentWarning,
              padding: '10px 14px',
            }}
          >
            ☕
          </button>
        )}

        <button onClick={onStandings} style={{ ...styles.btnSecondary, padding: '10px 14px' }}>
          📊
        </button>

        <button
          onClick={onEnd}
          style={{
            ...styles.btnSecondary,
            background: `${ds.accentDanger}15`,
            color: ds.accentDanger,
            borderColor: ds.accentDanger,
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
});

export default HostHeader;
