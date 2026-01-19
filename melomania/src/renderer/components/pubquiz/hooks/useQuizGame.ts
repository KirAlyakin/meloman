import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { PubQuizGame, Team } from '../../../types/game';
import timerAudio from '../TimerAudio';
import { systemSounds } from '../../../audio/SystemSounds';

export type Phase = 'round-intro' | 'questions' | 'collect-blanks' | 'show-answers' | 'break' | 'standings' | 'game-end';

export interface QuizState {
  // Navigation
  roundIdx: number;
  qIdx: number;
  aIdx: number;
  phase: Phase;
  // Timer
  time: number;
  timerOn: boolean;
  musicOn: boolean;
  sfxOn: boolean;
  ambientOn: boolean;
  // Data
  teams: Team[];
  scores: Record<string, Record<number, number>>;
  roundScores: Record<string, number>;
  editingTeam: string | null;
  // Computed
  round: PubQuizGame['rounds'][0] | undefined;
  question: PubQuizGame['rounds'][0]['questions'][0] | undefined;
  answer: PubQuizGame['rounds'][0]['questions'][0] | undefined;
  totalQ: number;
  maxPts: number;
  timeLimit: number;
  isLast: boolean;
  doneRounds: number[];
  isRoundSaved: boolean;
}

export interface QuizActions {
  // Navigation
  startRound: () => void;
  nextQ: () => void;
  prevQ: () => void;
  goQ: (i: number) => void;
  startAnswers: () => void;
  nextA: () => void;
  prevA: () => void;
  goA: (i: number) => void;
  goToRound: (idx: number) => void;
  goNextRound: () => void;
  // Phases
  startBreak: () => void;
  showStandings: () => void;
  // Timer
  startTimer: () => void;
  stopTimer: () => void;
  resetTimer: () => void;
  toggleMusic: () => void;
  toggleSfx: () => void;
  toggleAmbient: () => void;
  // Scores
  updateScore: (teamId: string, value: number) => void;
  saveScores: () => void;
  editSavedScore: (teamId: string, roundIndex: number, value: number) => void;
  getTotal: (teamId: string) => number;
  // Teams
  updateTeamName: (teamId: string, name: string) => void;
  setEditingTeam: (teamId: string | null) => void;
}

export const useQuizGame = (
  game: PubQuizGame,
  initTeams: Team[],
  onUpdateTeamScore: (teamId: string, score: number) => void
): QuizState & QuizActions => {
  // State
  const [teams, setTeams] = useState<Team[]>(initTeams);
  const [roundIdx, setRoundIdx] = useState(0);
  const [qIdx, setQIdx] = useState(0);
  const [aIdx, setAIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>('round-intro');
  const [time, setTime] = useState(60);
  const [timerOn, setTimerOn] = useState(false);
  const [musicOn, setMusicOn] = useState(true);
  const [sfxOn, setSfxOn] = useState(true);
  const [ambientOn, setAmbientOn] = useState(false);
  const [editingTeam, setEditingTeam] = useState<string | null>(null);

  const [scores, setScores] = useState<Record<string, Record<number, number>>>(() => {
    const s: Record<string, Record<number, number>> = {};
    initTeams.forEach(t => s[t.id] = {});
    return s;
  });

  const [roundScores, setRoundScores] = useState<Record<string, number>>(() => {
    const s: Record<string, number> = {};
    initTeams.forEach(t => s[t.id] = 0);
    return s;
  });

  // Computed с мемоизацией
  const round = useMemo(() => game.rounds[roundIdx], [game.rounds, roundIdx]);
  const question = useMemo(() => round?.questions[qIdx], [round, qIdx]);
  const answer = useMemo(() => round?.questions[aIdx], [round, aIdx]);
  const totalQ = useMemo(() => round?.questions.length || 0, [round]);
  const maxPts = useMemo(() => round?.questions.reduce((s, q) => s + q.points, 0) || 0, [round]);
  const timeLimit = useMemo(() => round?.defaultTimeLimit || 60, [round]);
  const isLast = useMemo(() => roundIdx === game.rounds.length - 1, [roundIdx, game.rounds.length]);
  
  const doneRounds = useMemo(() => {
    const firstTeamId = teams[0]?.id;
    if (!firstTeamId) return [];
    return Object.keys(scores[firstTeamId] || {}).map(Number).sort((a, b) => a - b);
  }, [scores, teams]);
  
  const isRoundSaved = useMemo(() => {
    const firstTeamId = teams[0]?.id;
    return firstTeamId ? scores[firstTeamId]?.[roundIdx] !== undefined : false;
  }, [scores, teams, roundIdx]);

  // getTotal с мемоизацией через useCallback
  const getTotal = useCallback((teamId: string) => 
    Object.values(scores[teamId] || {}).reduce((a, b) => a + b, 0),
  [scores]);

  // Timer with audio
  const wasRunning = useRef(false);

  useEffect(() => {
    const initAudio = async () => {
      await timerAudio.init();
      await systemSounds.init();
      
      // Загружаем кастомные папки из настроек
      const electronAPI = (window as any).electronAPI;
      const savedStr = localStorage.getItem('melomania_sound_settings');
      if (savedStr && electronAPI?.scanCustomFolder) {
        try {
          const saved = JSON.parse(savedStr);
          
          // Загружаем треки для timer
          if (saved?.timer?.customFolder) {
            const files = await electronAPI.scanCustomFolder(saved.timer.customFolder);
            if (files && files.length > 0) {
              await systemSounds.replaceTracksFromFiles('timer', files);
            }
          }
          
          // Загружаем треки для break
          if (saved?.break?.customFolder) {
            const files = await electronAPI.scanCustomFolder(saved.break.customFolder);
            if (files && files.length > 0) {
              await systemSounds.replaceTracksFromFiles('break', files);
            }
          }
          
          // Загружаем треки для blanks (сбор бланков)
          if (saved?.blanks?.customFolder) {
            const files = await electronAPI.scanCustomFolder(saved.blanks.customFolder);
            if (files && files.length > 0) {
              await systemSounds.replaceTracksFromFiles('blanks', files);
            }
          }
          
          // Загружаем кастомные SFX
          if (saved?.customSfxPaths) {
            for (const [key, path] of Object.entries(saved.customSfxPaths)) {
              if (path) {
                await systemSounds.loadCustomSfx(key as any, path as string);
              }
            }
          }
        } catch (e) {
          console.error('Failed to load sound settings:', e);
        }
      }
    };
    
    initAudio();
    
    return () => {
      timerAudio.stopAll();
      if (phase !== 'collect-blanks') {
      systemSounds.stopAll();
    }
    };
  }, []);

  // Автоматическое воспроизведение звуков при смене фаз
  useEffect(() => {
    if (phase !== 'collect-blanks' && phase !== 'round-intro' && !sfxOn) return;

    switch (phase) {
      case 'round-intro':
        // Звук начала раунда
        systemSounds.play('roundStart');
        // Музыка для экрана правил
        if (musicOn && systemSounds.hasTracksFor('intro')) {
          systemSounds.fadeIn('intro', 1000);
        }
        break;
      case 'collect-blanks':
        // Музыка при сборе бланков
        if (musicOn && systemSounds.hasTracksFor('blanks')) {
          systemSounds.fadeIn('blanks', 1000);
        }
        break;
      case 'break':
        // Музыка перерыва
        if (musicOn) systemSounds.fadeIn('break', 1000);
        break;
      case 'game-end':
        // Звук конца игры
        systemSounds.play('gameEnd');
        break;
      default:
        // Останавливаем музыку перерыва если вышли из перерыва
        if (systemSounds.isPlaying('break')) {
          systemSounds.fadeOut('break', 500);
        }
        // Останавливаем музыку сбора бланков
        if (systemSounds.isPlaying('blanks')) {
          systemSounds.fadeOut('blanks', 500);
        }
    }
    
    // Останавливаем intro музыку при выходе из round-intro
    if (phase !== 'round-intro' && systemSounds.isPlaying('intro')) {
      systemSounds.fadeOut('intro', 500);
    }
  }, [phase, sfxOn, musicOn]);

  // Звук при показе нового ответа (кроме первого - он в startAnswers)
  const prevAIdx = useRef(-1);
  useEffect(() => {
    if (sfxOn && phase === 'show-answers' && aIdx > 0 && aIdx !== prevAIdx.current) {
      systemSounds.play('correct');
    }
    prevAIdx.current = aIdx;
  }, [phase, aIdx, sfxOn]);

  // Получаем настройку shuffle из localStorage
  const getSoundSettings = useCallback(() => {
    try {
      const saved = localStorage.getItem('melomania_sound_settings');
      if (saved) {
        const settings = JSON.parse(saved);
        return {
          timerShuffle: settings.timer?.shuffle ?? true,
          breakShuffle: settings.break?.shuffle ?? true,
        };
      }
    } catch (e) {
      console.error('Failed to load sound settings:', e);
    }
    return { timerShuffle: true, breakShuffle: true };
  }, []);

  useEffect(() => {
    if (!timerOn || time <= 0) {
      if (wasRunning.current) {
        timerAudio.stopAll();
        wasRunning.current = false;
      }
      return;
    }

    if (!wasRunning.current && musicOn) {
      // При каждом запуске таймера - следующий трек
      const { timerShuffle } = getSoundSettings();
      timerAudio.startNextTrack(timerShuffle);
      wasRunning.current = true;
    }

    const t = setInterval(() => {
      setTime(prev => {
        // За 5 секунд до конца - начинаем тики поверх музыки (не останавливая её)
        if (prev === 6 && sfxOn) {
          timerAudio.startTick();
        }
        if (prev <= 1) {
          setTimerOn(false);
          timerAudio.stopAll();
          wasRunning.current = false;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(t);
  }, [timerOn, musicOn, sfxOn, getSoundSettings]);

  // Actions с useCallback для стабильных ссылок
  const stopTimerAudio = useCallback(() => {
    timerAudio.stopAll();
    wasRunning.current = false;
  }, []);

  const startRound = useCallback(() => {
    setQIdx(0);
    setPhase('questions');
    setTime(timeLimit);
    setTimerOn(false);
  }, [timeLimit]);

  const nextQ = useCallback(() => {
    if (qIdx < totalQ - 1) {
      setQIdx(qIdx + 1);
      setTime(timeLimit);
      setTimerOn(false);
      stopTimerAudio();
    } else {
      setPhase('collect-blanks');
    }
  }, [qIdx, totalQ, timeLimit, stopTimerAudio]);

  const prevQ = useCallback(() => {
    if (qIdx > 0) {
      setQIdx(qIdx - 1);
      setTime(timeLimit);
      setTimerOn(false);
      stopTimerAudio();
    }
  }, [qIdx, timeLimit, stopTimerAudio]);

  const goQ = useCallback((i: number) => {
    setQIdx(i);
    setTime(timeLimit);
    setTimerOn(false);
    stopTimerAudio();
  }, [timeLimit, stopTimerAudio]);

  const startAnswers = useCallback(() => {
    setAIdx(0);
    setPhase('show-answers');
    // Звук первого ответа
    if (sfxOn) systemSounds.play('correct');
  }, [sfxOn]);

  const nextA = useCallback(() => {
    if (aIdx < totalQ - 1) {
      setAIdx(aIdx + 1);
    } else {
      // goNextRound inline to avoid circular dependency
      if (roundIdx < game.rounds.length - 1) {
        setRoundIdx(roundIdx + 1);
        setQIdx(0);
        setAIdx(0);
        setPhase('round-intro');
        setRoundScores(Object.fromEntries(teams.map(t => [t.id, 0])));
      } else {
        setPhase('game-end');
      }
    }
  }, [aIdx, totalQ, roundIdx, game.rounds.length, teams]);

  const prevA = useCallback(() => {
    if (aIdx > 0) setAIdx(aIdx - 1);
  }, [aIdx]);

  const goA = useCallback((i: number) => setAIdx(i), []);

  const goToRound = useCallback((idx: number) => {
    setRoundIdx(idx);
    setQIdx(0);
    setAIdx(0);
    setPhase('round-intro');
    setRoundScores(Object.fromEntries(teams.map(t => [t.id, 0])));
  }, [teams]);

  const goNextRound = useCallback(() => {
    if (roundIdx < game.rounds.length - 1) {
      setRoundIdx(roundIdx + 1);
      setQIdx(0);
      setAIdx(0);
      setPhase('round-intro');
      setRoundScores(Object.fromEntries(teams.map(t => [t.id, 0])));
    } else {
      setPhase('game-end');
    }
  }, [roundIdx, game.rounds.length, teams]);

  const startBreak = useCallback(() => setPhase('break'), []);
  const showStandings = useCallback(() => setPhase('standings'), []);

  const startTimer = useCallback(() => setTimerOn(true), []);
  const stopTimer = useCallback(() => {
    setTimerOn(false);
    stopTimerAudio();
  }, [stopTimerAudio]);
  
  const resetTimer = useCallback(() => {
    setTime(timeLimit);
    setTimerOn(false);
    stopTimerAudio();
  }, [timeLimit, stopTimerAudio]);
  
  const toggleMusic = useCallback(() => {
    if (musicOn) {
      timerAudio.stopAll();
      systemSounds.stop('break');
    }
    setMusicOn(m => !m);
  }, [musicOn]);

  const toggleSfx = useCallback(() => {
    setSfxOn(s => !s);
  }, []);

  const toggleAmbient = useCallback(() => {
    if (ambientOn) {
      // Выключаем
      systemSounds.fadeOut('ambient', 500);
    } else {
      // Включаем
      if (systemSounds.hasTracksFor('ambient')) {
        systemSounds.fadeIn('ambient', 1000);
      }
    }
    setAmbientOn(a => !a);
  }, [ambientOn]);

  const updateScore = useCallback((teamId: string, value: number) => {
    setRoundScores(prev => ({ ...prev, [teamId]: Math.max(0, value) }));
  }, []);

  const editSavedScore = useCallback((teamId: string, roundIndex: number, value: number) => {
    setScores(prev => {
      const newScores = { ...prev };
      newScores[teamId] = { ...newScores[teamId], [roundIndex]: Math.max(0, value) };
      return newScores;
    });
    // Вычисляем новый total для callback
    const currentScores = scores[teamId] || {};
    const newTotal = Object.entries({ ...currentScores, [roundIndex]: Math.max(0, value) })
      .reduce((a, [, v]) => a + v, 0);
    onUpdateTeamScore(teamId, newTotal);
  }, [scores, onUpdateTeamScore]);

  const saveScores = useCallback(() => {
    setScores(prev => {
      const newScores = { ...prev };
      teams.forEach(t => {
        newScores[t.id] = { ...newScores[t.id], [roundIdx]: roundScores[t.id] || 0 };
      });
      // Update parent after state update
      teams.forEach(t => {
        const total = Object.values(newScores[t.id]).reduce((a, b) => a + b, 0);
        onUpdateTeamScore(t.id, total);
      });
      return newScores;
    });
  }, [teams, roundIdx, roundScores, onUpdateTeamScore]);

  const updateTeamName = useCallback((teamId: string, name: string) => {
    setTeams(prev => prev.map(t => t.id === teamId ? { ...t, name } : t));
  }, []);

  const setEditingTeamCb = useCallback((teamId: string | null) => {
    setEditingTeam(teamId);
  }, []);

  return {
    // State
    roundIdx, qIdx, aIdx, phase, time, timerOn, musicOn, sfxOn, ambientOn,
    teams, scores, roundScores, editingTeam,
    round, question, answer, totalQ, maxPts, timeLimit, isLast, doneRounds, isRoundSaved,
    // Actions
    startRound, nextQ, prevQ, goQ,
    startAnswers, nextA, prevA, goA,
    goToRound, goNextRound,
    startBreak, showStandings,
    startTimer, stopTimer, resetTimer, toggleMusic, toggleSfx, toggleAmbient,
    updateScore, saveScores, editSavedScore, getTotal,
    updateTeamName, setEditingTeam: setEditingTeamCb,
  };
};
