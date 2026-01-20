import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { 
  JeopardyGame,
  JeopardyCategory,
  JeopardyQuestion,
  Team, 
  ThemeId, 
  JeopardyCurrentQuestion,
  GameStatus
} from '../types/game';

interface GameStore {
  game: JeopardyGame | null;
  teams: Team[];
  currentQuestion: JeopardyCurrentQuestion | null;
  status: GameStatus;
  theme: ThemeId;
  showScores: boolean;
  
  loadGame: (game: JeopardyGame) => void;
  resetGame: () => void;
  startGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  endGame: () => void;
  
  addTeam: (name: string) => void;
  removeTeam: (id: string) => void;
  updateTeamName: (id: string, name: string) => void;
  updateTeamScore: (id: string, delta: number) => void;
  setTeamScore: (id: string, score: number) => void;
  
  selectQuestion: (categoryId: string, questionId: string) => void;
  setRespondingTeam: (teamId: string | null) => void;
  markCorrect: () => void;
  markIncorrect: () => void;
  closeQuestion: () => void;
  
  isTeamBlocked: (teamId: string) => boolean;
  getAvailableTeams: () => Team[];
  
  setBetAmount: (amount: number) => void;
  setAuctionBet: (teamId: string, amount: number) => void;
  setCatTarget: (teamId: string) => void;
  
  setPlaying: (isPlaying: boolean) => void;
  setCurrentTime: (time: number) => void;
  
  setTheme: (theme: ThemeId) => void;
  toggleScores: () => void;
  
  getPublicState: () => Partial<GameStore>;
  syncFromHost: (state: Partial<GameStore>) => void;
}

const defaultTeamColors = [
  '#ef4444', '#3b82f6', '#10b981', '#f59e0b', 
  '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
  '#f97316', '#6366f1', '#14b8a6', '#e11d48'
];

export const useGameStore = create<GameStore>((set, get) => ({
  game: null,
  teams: [],
  currentQuestion: null,
  status: 'setup',
  theme: 'nordic-dark',
  showScores: false,
  
  loadGame: (game) => set({ 
    game, 
    status: 'setup',
    currentQuestion: null 
  }),
  
  resetGame: () => set({
    game: null,
    teams: [],
    currentQuestion: null,
    status: 'setup'
  }),
  
  startGame: () => {
    const { teams } = get();
    if (teams.length < 2) return;
    set({ status: 'playing' });
  },
  
  pauseGame: () => set({ status: 'paused' }),
  resumeGame: () => set({ status: 'playing' }),
  endGame: () => set({ status: 'finished' }),
  
  addTeam: (name) => {
    const { teams } = get();
    if (teams.length >= 12) return;
    
    const newTeam: Team = {
      id: uuidv4(),
      name,
      score: 0,
      color: defaultTeamColors[teams.length] || '#888888'
    };
    set({ teams: [...teams, newTeam] });
  },
  
  removeTeam: (id) => {
    const { teams } = get();
    set({ teams: teams.filter(t => t.id !== id) });
  },
  
  updateTeamName: (id, name) => {
    const { teams } = get();
    set({ 
      teams: teams.map(t => t.id === id ? { ...t, name } : t) 
    });
  },
  
  updateTeamScore: (id, delta) => {
    const { teams } = get();
    set({ 
      teams: teams.map(t => t.id === id ? { ...t, score: t.score + delta } : t) 
    });
  },
  
  setTeamScore: (id, score) => {
    const { teams } = get();
    set({ 
      teams: teams.map(t => t.id === id ? { ...t, score } : t) 
    });
  },
  
  // Выбор вопроса — сбрасываем блокировки
  selectQuestion: (categoryId, questionId) => {
    set({
      currentQuestion: {
        categoryId,
        questionId,
        isPlaying: false,
        currentTime: 0,
        respondingTeamId: null,
        blockedTeamIds: [] // Новый вопрос — все команды разблокированы
      }
    });
  },
  
  setRespondingTeam: (teamId) => {
    const { currentQuestion } = get();
    if (!currentQuestion) return;
    
    // Проверяем, не заблокирована ли команда
    if (teamId && currentQuestion.blockedTeamIds.includes(teamId)) {
      return; // Команда уже отвечала неправильно
    }
    
    set({
      currentQuestion: { ...currentQuestion, respondingTeamId: teamId }
    });
  },
  
  // Проверка блокировки команды
  isTeamBlocked: (teamId) => {
    const { currentQuestion } = get();
    if (!currentQuestion) return false;
    return currentQuestion.blockedTeamIds.includes(teamId);
  },
  
  // Получить команды, которые ещё могут отвечать
  getAvailableTeams: () => {
    const { teams, currentQuestion } = get();
    if (!currentQuestion) return teams;
    return teams.filter(t => !currentQuestion.blockedTeamIds.includes(t.id));
  },
  
  markCorrect: () => {
    const { currentQuestion, game } = get();
    if (!currentQuestion || !game) return;
    
    const category = game.categories.find(c => c.id === currentQuestion.categoryId);
    const question = category?.questions.find(q => q.id === currentQuestion.questionId);
    if (!question || !currentQuestion.respondingTeamId) return;
    
    let points = 1;
    
    if (question.type === 'bet' && currentQuestion.betAmount) {
      points = currentQuestion.betAmount;
    } else if (question.type === 'auction' && currentQuestion.auctionBets) {
      const bets = Object.values(currentQuestion.auctionBets) as number[];
      const winningBet = Math.max(...bets);
      points = winningBet;
    } else if (question.type === 'cat') {
      points = 2;
    }
    
    const targetTeamId = question.type === 'cat' 
      ? currentQuestion.catTargetTeamId 
      : currentQuestion.respondingTeamId;
    
    if (targetTeamId) {
      get().updateTeamScore(targetTeamId, points);
      
      // Сохраняем команду-победителя в вопросе
      const updatedCategories = game.categories.map(c => {
        if (c.id === currentQuestion.categoryId) {
          return {
            ...c,
            questions: c.questions.map(q => {
              if (q.id === currentQuestion.questionId) {
                return { ...q, answeredByTeamId: targetTeamId };
              }
              return q;
            })
          };
        }
        return c;
      });
      
      set({ game: { ...game, categories: updatedCategories } });
    }
  },
  
  markIncorrect: () => {
    const { currentQuestion, game, teams } = get();
    if (!currentQuestion || !game || !currentQuestion.respondingTeamId) return;
    
    const category = game.categories.find(c => c.id === currentQuestion.categoryId);
    const question = category?.questions.find(q => q.id === currentQuestion.questionId);
    if (!question) return;
    
    // Вычитаем очки для особых вопросов
    if (['bet', 'auction', 'cat'].includes(question.type)) {
      let points = 1;
      
      if (question.type === 'bet' && currentQuestion.betAmount) {
        points = currentQuestion.betAmount;
      } else if (question.type === 'auction' && currentQuestion.auctionBets) {
        const bets = Object.values(currentQuestion.auctionBets) as number[];
        const winningBet = Math.max(...bets);
        points = winningBet;
      } else if (question.type === 'cat') {
        points = 2;
      }
      
      const targetTeamId = question.type === 'cat' 
        ? currentQuestion.catTargetTeamId 
        : currentQuestion.respondingTeamId;
      
      if (targetTeamId) {
        get().updateTeamScore(targetTeamId, -points);
      }
    }
    
    // БЛОКИРУЕМ команду — она больше не может отвечать на этот вопрос
    const newBlockedTeamIds = [...currentQuestion.blockedTeamIds, currentQuestion.respondingTeamId];
    
    set({
      currentQuestion: {
        ...currentQuestion,
        respondingTeamId: null,
        blockedTeamIds: newBlockedTeamIds
      }
    });
  },
  
  closeQuestion: () => {
    const { currentQuestion, game } = get();
    if (!currentQuestion || !game) return;
    
    const updatedGame: JeopardyGame = {
      ...game,
      categories: game.categories.map(cat => {
        if (cat.id !== currentQuestion.categoryId) return cat;
        return {
          ...cat,
          questions: cat.questions.map(q => 
            q.id === currentQuestion.questionId ? { ...q, played: true } : q
          )
        };
      })
    };
    
    set({ 
      game: updatedGame,
      currentQuestion: null 
    });
  },
  
  setBetAmount: (amount) => {
    const { currentQuestion } = get();
    if (!currentQuestion) return;
    set({
      currentQuestion: { ...currentQuestion, betAmount: Math.min(3, Math.max(1, amount)) }
    });
  },
  
  setAuctionBet: (teamId, amount) => {
    const { currentQuestion } = get();
    if (!currentQuestion) return;
    const auctionBets = currentQuestion.auctionBets || {};
    set({
      currentQuestion: { 
        ...currentQuestion, 
        auctionBets: { ...auctionBets, [teamId]: Math.min(5, Math.max(0, amount)) }
      }
    });
  },
  
  setCatTarget: (teamId) => {
    const { currentQuestion } = get();
    if (!currentQuestion) return;
    set({
      currentQuestion: { ...currentQuestion, catTargetTeamId: teamId }
    });
  },
  
  setPlaying: (isPlaying) => {
    const { currentQuestion } = get();
    if (!currentQuestion) return;
    set({
      currentQuestion: { ...currentQuestion, isPlaying }
    });
  },
  
  setCurrentTime: (time) => {
    const { currentQuestion } = get();
    if (!currentQuestion) return;
    set({
      currentQuestion: { ...currentQuestion, currentTime: time }
    });
  },
  
  setTheme: (theme) => set({ theme }),
  toggleScores: () => set(state => ({ showScores: !state.showScores })),
  
  getPublicState: () => {
    const { game, teams, currentQuestion, status, theme, showScores } = get();
    
    const publicGame = game ? {
      ...game,
      categories: game.categories.map(cat => ({
        ...cat,
        questions: cat.questions.map(q => ({
          ...q,
          answer: ''
        }))
      }))
    } : null;
    
    return {
      game: publicGame,
      teams,
      currentQuestion,
      status,
      theme,
      showScores
    };
  },
  
  syncFromHost: (state) => set(state)
}));
