import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { PubQuizGame, Team, ThemeId } from '../../types/game';
import { getDS, getStyles } from './designSystem';
import { useQuizGame } from './hooks';
import { HostHeader, Sidebar, Timer, MediaPlayer, SoundSettings } from './ui';
import { renderProjector } from './projector';

interface Props {
  game: PubQuizGame;
  teams: Team[];
  theme: ThemeId;
  onUpdateTeamScore: (teamId: string, score: number) => void;
  onEnd: () => void;
  onSyncToPublic: (state: any) => void;
  onOpenProjector?: () => void;
}

const PubQuizHost: React.FC<Props> = ({ game, teams, theme, onUpdateTeamScore, onEnd, onSyncToPublic, onOpenProjector }) => {
  const ds = getDS(theme);
  const styles = getStyles(ds);
  const quiz = useQuizGame(game, teams, onUpdateTeamScore);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [showSoundSettings, setShowSoundSettings] = useState(false);
  const [previewScale, setPreviewScale] = useState(0.5);

  // Вычисляем scale для превью
  useEffect(() => {
    const container = previewContainerRef.current;
    if (!container) return;

    const updateScale = () => {
      const rect = container.getBoundingClientRect();
      // Целевой размер: 1920x1080 (Full HD проектор)
      const scaleX = rect.width / 1920;
      const scaleY = rect.height / 1080;
      setPreviewScale(Math.min(scaleX, scaleY));
    };

    updateScale();
    const resizeObserver = new ResizeObserver(updateScale);
    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  // Генерируем данные для превью
  const totals: Record<string, number> = {};
  quiz.teams.forEach(t => { totals[t.id] = quiz.getTotal(t.id); });

  // Структурные данные (не включают time, чтобы не перезагружать видео каждую секунду)
  const structureData = {
    phase: quiz.phase,
    roundIdx: quiz.roundIdx,
    qIdx: quiz.qIdx,
    aIdx: quiz.aIdx,
    time: quiz.time, // Начальное время для первого рендера
    timeLimit: quiz.timeLimit,
    timerOn: quiz.timerOn,
    theme,
    basePath: game.basePath,
    round: quiz.round,
    question: quiz.question,
    answer: quiz.answer,
    totalQ: quiz.totalQ,
    maxPts: quiz.maxPts,
    teams: quiz.teams,
    scores: quiz.scores,
    totals,
    game,
  };

  // Полные данные для синхронизации
  const previewData = structureData;
  const previewHtml = renderProjector(previewData);

  // Ключ для определения когда структура изменилась (исключаем time)
  const structureKey = `${quiz.phase}-${quiz.roundIdx}-${quiz.qIdx}-${quiz.aIdx}-${theme}`;
  const prevStructureKey = useRef(structureKey);

  // Обновляем iframe когда меняется структура
  useEffect(() => {
    if (iframeRef.current) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(previewHtml);
        doc.close();
      }
    }
  }, [structureKey, previewHtml]);

  // Обновляем таймер в iframe через postMessage (не перезагружая страницу!)
  useEffect(() => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ 
        type: 'pubquiz_timer', 
        time: quiz.time, 
        timerOn: quiz.timerOn,
        timeLimit: quiz.timeLimit,
      }, '*');
    }
  }, [quiz.time, quiz.timerOn, quiz.timeLimit]);

  // Sync to localStorage for PublicScreen
  useEffect(() => {
    onSyncToPublic({ type: 'pub-quiz', ...previewData });

    const pw = (window as any).projectorWindow;
    if (pw && !pw.closed) {
      pw.postMessage({ type: 'pubquiz_update', html: previewHtml }, '*');
    }
  }, [quiz.phase, quiz.roundIdx, quiz.qIdx, quiz.aIdx, quiz.scores, quiz.teams, theme]);

  // Sync TIMER state separately
  useEffect(() => {
    const pw = (window as any).projectorWindow;
    if (pw && !pw.closed) {
      pw.postMessage({ 
        type: 'pubquiz_timer', 
        time: quiz.time, 
        timerOn: quiz.timerOn,
        timeLimit: quiz.timeLimit,
      }, '*');
    }
  }, [quiz.time, quiz.timerOn, quiz.timeLimit]);

  // Send video control command to projector (and preview for sync)
  const sendVideoCommand = (action: 'play' | 'pause' | 'stop' | 'seek' | 'fullscreen', seekTime?: number) => {
    const pw = (window as any).projectorWindow;
    
    // Всегда отправляем в проектор
    if (pw && !pw.closed) {
      pw.postMessage({ 
        type: 'pubquiz_video', 
        action,
        time: seekTime,
      }, '*');
    }
    
    // В превью отправляем ВСЕ команды КРОМЕ fullscreen
    // (превью = миниатюра проектора, должна синхронизироваться)
    if (action !== 'fullscreen' && iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ 
        type: 'pubquiz_video', 
        action,
        time: seekTime,
      }, '*');
    }
  };

  // Определяем что показывать в контролах
  const renderControls = () => {
    const { phase, round, question, qIdx, totalQ, aIdx, time, timerOn, musicOn, answer } = quiz;
    const basePath = game.basePath;

    // Кнопки навигации
    const NavButtons = ({ onPrev, onNext, prevDisabled = false, nextLabel = '→' }: { 
      onPrev?: () => void; 
      onNext: () => void; 
      prevDisabled?: boolean;
      nextLabel?: string;
    }) => (
      <div style={{ display: 'flex', gap: 8 }}>
        {onPrev && (
          <button
            onClick={onPrev}
            disabled={prevDisabled}
            style={{ ...styles.btnSecondary, padding: '10px 16px', opacity: prevDisabled ? 0.5 : 1 }}
          >
            ← Назад
          </button>
        )}
        <button onClick={onNext} style={{ ...styles.btnPrimary, padding: '10px 20px' }}>
          {nextLabel}
        </button>
      </div>
    );

    switch (phase) {
      case 'round-intro':
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ 
                fontSize: '1.5rem',
                background: ds.bgTertiary,
                padding: '8px 12px',
                borderRadius: 10,
              }}>
                {round?.type === 'music' ? '🎵' : round?.type === 'picture' ? '🖼️' : round?.type === 'video' ? '🎬' : round?.type === 'blitz' ? '⚡' : round?.type === 'choice' ? '🔤' : '📝'}
              </span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: ds.textPrimary }}>{round?.name}</div>
                <div style={{ fontSize: '0.8rem', color: ds.textMuted }}>
                  {quiz.totalQ} вопросов · {round?.defaultTimeLimit || 60} сек · {round?.defaultPoints || 1} балл
                </div>
              </div>
            </div>
            <NavButtons onNext={quiz.startRound} nextLabel="▶️ Начать раунд" />
          </div>
        );

      case 'questions':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Компактная строка: Ответ + Управление медиа */}
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Ответ для ведущего - компактный */}
              <div style={{
                padding: '10px 16px',
                background: `${ds.accentSuccess}15`,
                border: `2px solid ${ds.accentSuccess}`,
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}>
                <span style={{ color: ds.textMuted, fontSize: '0.8rem' }}>✅</span>
                <span style={{ fontWeight: 700, color: ds.accentSuccess, fontSize: '1.1rem' }}>
                  {question?.answer || '—'}
                </span>
                {question?.hint && (
                  <span style={{ color: ds.textMuted, fontSize: '0.75rem', borderLeft: `1px solid ${ds.border}`, paddingLeft: 12, marginLeft: 4 }}>
                    💡 {question.hint}
                  </span>
                )}
              </div>

              {/* Медиа плеер только для музыки (видео управляется на проекторе) */}
              {question?.mediaPath && round?.type === 'music' && (
                <MediaPlayer
                  type="music"
                  src={question.mediaPath}
                  basePath={basePath}
                  startTime={question.mediaStartTime}
                  endTime={question.mediaEndTime}
                  showControls={true}
                  compact={true}
                  ds={ds}
                />
              )}
              
              {/* Управление видео на проекторе */}
              {question?.mediaPath && round?.type === 'video' && (
                <div style={{
                  padding: '8px 12px',
                  background: ds.bgTertiary,
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}>
                  <span style={{ color: ds.textMuted, fontSize: '0.8rem' }}>📺</span>
                  <button
                    onClick={() => sendVideoCommand('play')}
                    style={{
                      ...styles.btnSecondary,
                      padding: '6px 14px',
                      background: `${ds.accentSuccess}20`,
                      color: ds.accentSuccess,
                      borderColor: ds.accentSuccess,
                      fontSize: '0.85rem',
                    }}
                  >
                    ▶ Play
                  </button>
                  <button
                    onClick={() => sendVideoCommand('pause')}
                    style={{
                      ...styles.btnSecondary,
                      padding: '6px 14px',
                      background: `${ds.accentWarning}20`,
                      color: ds.accentWarning,
                      borderColor: ds.accentWarning,
                      fontSize: '0.85rem',
                    }}
                  >
                    ⏸
                  </button>
                  <button
                    onClick={() => sendVideoCommand('stop')}
                    style={{
                      ...styles.btnSecondary,
                      padding: '6px 10px',
                      fontSize: '0.85rem',
                    }}
                  >
                    ⏹
                  </button>
                  <button
                    onClick={() => sendVideoCommand('fullscreen')}
                    style={{
                      ...styles.btnSecondary,
                      padding: '6px 10px',
                      fontSize: '0.85rem',
                    }}
                    title="На весь экран"
                  >
                    ⛶
                  </button>
                </div>
              )}
            </div>

            {/* Таймер + Навигация */}
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <Timer
                time={time}
                timerOn={timerOn}
                musicOn={musicOn}
                sfxOn={quiz.sfxOn}
                onStart={quiz.startTimer}
                onStop={quiz.stopTimer}
                onReset={quiz.resetTimer}
                onToggleMusic={quiz.toggleMusic}
                onToggleSfx={quiz.toggleSfx}
                ds={ds}
              />
              <NavButtons 
                onPrev={quiz.prevQ} 
                prevDisabled={qIdx === 0}
                onNext={quiz.nextQ} 
                nextLabel={qIdx < totalQ - 1 ? 'Следующий →' : '✓ Завершить'} 
              />
            </div>
          </div>
        );

      case 'collect-blanks':
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div style={{ 
              padding: '12px 20px',
              background: ds.bgTertiary,
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}>
              <span style={{ fontSize: '1.5rem' }}>📋</span>
              <span style={{ color: ds.textPrimary, fontWeight: 600 }}>Собираем бланки...</span>
            </div>
            <NavButtons onNext={quiz.startAnswers} nextLabel="✓ Показать ответы" />
          </div>
        );

      case 'show-answers':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Текущий ответ */}
            {answer && (
              <div style={{
                padding: '12px 16px',
                background: ds.bgTertiary,
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 16,
              }}>
                <span style={{ 
                  background: ds.accentSuccess,
                  color: '#fff',
                  padding: '6px 12px',
                  borderRadius: 8,
                  fontWeight: 700,
                  fontSize: '0.9rem',
                }}>
                  #{aIdx + 1}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ color: ds.textMuted, fontSize: '0.75rem' }}>{answer.text}</div>
                  <div style={{ color: ds.accentSuccess, fontWeight: 700, fontSize: '1.1rem' }}>{answer.answer}</div>
                </div>
                <span style={{ color: ds.textMuted }}>⭐ {answer.points}</span>
              </div>
            )}

            {/* Навигация */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <NavButtons 
                onPrev={quiz.prevA}
                prevDisabled={aIdx === 0}
                onNext={quiz.nextA} 
                nextLabel={aIdx < totalQ - 1 ? 'Следующий ответ →' : '✓ Далее'} 
              />
            </div>
          </div>
        );

      case 'break':
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div style={{ 
              padding: '12px 20px',
              background: ds.bgTertiary,
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}>
              <span style={{ fontSize: '1.5rem' }}>☕</span>
              <span style={{ color: ds.textPrimary, fontWeight: 600 }}>Перерыв — введите баллы в sidebar</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={quiz.showStandings} style={styles.btnSecondary}>
                📊 Таблица
              </button>
              <NavButtons onNext={quiz.goNextRound} nextLabel={quiz.isLast ? '🏆 Финал' : '▶️ Далее'} />
            </div>
          </div>
        );

      case 'standings':
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div style={{ 
              padding: '12px 20px',
              background: ds.bgTertiary,
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}>
              <span style={{ fontSize: '1.5rem' }}>🏆</span>
              <span style={{ color: ds.textPrimary, fontWeight: 600 }}>Турнирная таблица</span>
            </div>
            <NavButtons 
              onNext={quiz.goNextRound} 
              nextLabel={quiz.isLast ? '🏁 Завершить игру' : '▶️ Следующий раунд'} 
            />
          </div>
        );

      case 'game-end':
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
            <button onClick={onEnd} style={{ ...styles.btnPrimary, padding: '14px 28px', fontSize: '1rem' }}>
              🏠 Вернуться в меню
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      height: 'calc(100vh - 120px)',
      fontFamily: "'Manrope', sans-serif",
    }}>
      <HostHeader
        quiz={quiz}
        ds={ds}
        onBreak={quiz.startBreak}
        onStandings={quiz.showStandings}
        onEnd={onEnd}
        onOpenProjector={onOpenProjector}
        onOpenSoundSettings={() => setShowSoundSettings(true)}
        ambientOn={quiz.ambientOn}
        onToggleAmbient={quiz.toggleAmbient}
      />

      <div style={{ display: 'flex', gap: 12, flex: 1, overflow: 'hidden' }}>
        {/* Основная область: Превью + Контролы */}
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column',
          gap: 12,
          overflow: 'hidden',
        }}>
          {/* Превью проектора - рендерим в 1920x1080 и масштабируем */}
          <div 
            ref={previewContainerRef}
            style={{
              flex: 1,
              position: 'relative',
              borderRadius: 12,
              overflow: 'hidden',
              background: '#000',
              border: `2px solid ${ds.border}`,
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              minHeight: 100,
            }}
          >
            {/* iframe рендерится в 1920x1080, потом scale уменьшает */}
            <iframe
              ref={iframeRef}
              title="Превью проектора"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '1920px',
                height: '1080px',
                border: 'none',
                pointerEvents: 'none',
                transformOrigin: 'top left',
                transform: `scale(${previewScale})`,
              }}
            />
            
            {/* Бейдж "Превью" */}
            <div style={{
              position: 'absolute',
              top: 8,
              left: 8,
              background: 'rgba(0,0,0,0.7)',
              color: '#fff',
              padding: '4px 10px',
              borderRadius: 6,
              fontSize: '0.7rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              zIndex: 10,
            }}>
              📺 Это видит публика
            </div>
          </div>

          {/* Контролы */}
          <motion.div
            key={quiz.phase}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
            style={{
              ...styles.card,
              padding: 16,
              flexShrink: 0,
            }}
          >
            {renderControls()}
          </motion.div>
        </div>

        {/* Sidebar */}
        <Sidebar quiz={quiz} game={game} ds={ds} />
      </div>

      {/* Sound Settings Modal */}
      <SoundSettings
        isOpen={showSoundSettings}
        onClose={() => setShowSoundSettings(false)}
        colors={{
          background: ds.bgPrimary,
          backgroundSecondary: ds.bgSecondary,
          text: ds.textPrimary,
          textMuted: ds.textMuted,
          accent: ds.accent,
          border: ds.border,
        }}
      />
    </div>
  );
};

export default PubQuizHost;
