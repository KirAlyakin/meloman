// ============================================
// ОБЩИЕ ТИПЫ
// ============================================

export type GameMode = 'jeopardy' | 'pub-quiz';

export interface Team {
  id: string;
  name: string;
  score: number;
  color: string;
}

export type ThemeId = 
  | 'nordic-dark' 
  | 'nordic-light' 
  | 'winter'
  | 'autumn' 
  | 'spring' 
  | 'summer'
  | 'cyber-night'    // Неоновая темная
  | 'emerald-tech'   // Бильярдная
  | 'royal-gold';    // Премиальная золотая

export interface Theme {
  id: ThemeId;
  name: string;
  emoji: string;
  colors: {
    background: string;
    backgroundSecondary: string;
    backgroundTertiary: string;
    text: string;
    textSecondary: string;
    textMuted: string;
    accent: string;
    accentSecondary: string;
    accentMuted: string;
    correct: string;
    incorrect: string;
    border: string;
    shadow: string;
    teamColors: string[];
  };
  particles?: {
    type: 'geometric' | 'aurora' | 'dots' | 'lines' | 'leaves' | 'petals' | 'snowflakes';
    enabled: boolean;
    color: string;
    secondaryColor?: string;
  };
}

// ============================================
// МОДУЛЬ 1: СВОЯ ИГРА (Jeopardy)
// ============================================

export type JeopardyQuestionType = 'normal' | 'bet' | 'auction' | 'cat' | 'sing';

export interface JeopardyQuestion {
  id: string;
  audioPath: string;
  answer: string;
  startTime: number;
  endTime: number;
  type: JeopardyQuestionType;
  played: boolean;
  answeredByTeamId?: string | null;
}

export interface JeopardyCategory {
  id: string;
  name: string;
  questions: JeopardyQuestion[];
}

export interface JeopardyGame {
  id: string;
  mode: 'jeopardy';
  name: string;
  description?: string;
  categories: JeopardyCategory[];
  createdAt: string;
  updatedAt: string;
}

export interface JeopardyCurrentQuestion {
  categoryId: string;
  questionId: string;
  isPlaying: boolean;
  currentTime: number;
  respondingTeamId: string | null;
  blockedTeamIds: string[];
  betAmount?: number;
  auctionBets?: Record<string, number>;
  catTargetTeamId?: string;
}

// ============================================
// МОДУЛЬ 2: ПАБ-КВИЗ
// ============================================

export type PubQuizRoundType = 
  | 'text'        // Текстовые вопросы
  | 'music'       // Музыкальный раунд
  | 'picture'     // Картинки
  | 'blitz'       // Блиц (много вопросов подряд)
  | 'video'       // Видео вопросы
  | 'choice';     // Вопросы с вариантами ответов (A, B, C, D)

// Настройки отображения раунда на проекторе
export type FontSize = 'small' | 'medium' | 'large' | 'xlarge';
export type MediaPosition = 'top' | 'left' | 'right' | 'background' | 'hidden';
export type MediaSize = 'small' | 'medium' | 'large' | 'fullscreen';

export interface RoundDisplaySettings {
  // Размеры шрифтов
  questionFontSize: FontSize;     // small=32, medium=48, large=64, xlarge=80
  answerFontSize: FontSize;       // small=48, medium=64, large=80, xlarge=96
  
  // Настройки "Вопрос X из Y"
  questionNumberFontSize: FontSize;  // Размер текста "Вопрос X из Y"
  questionNumberColor?: string;      // HEX цвет (по умолчанию textMuted)
  
  // Позиционирование медиа
  mediaPosition: MediaPosition;
  mediaSize: MediaSize;           // small=30%, medium=50%, large=70%, fullscreen=100%
  
  // Видимость элементов
  showQuestionText: boolean;      // Скрыть текст (для чистых картинок)
  showQuestionNumber: boolean;    // Показать "Вопрос 1 из 8"
  showTimer: boolean;             // Показать таймер
  showRoundBadge: boolean;        // Показать название раунда в шапке
  
  // Цвета текста (кастомизация)
  questionTextColor?: string;     // HEX цвет текста вопроса
  answerTextColor?: string;       // HEX цвет текста ответа
  answerShadowColor?: string;     // HEX цвет тени ответа (null = без тени)
  answerShadowBlur?: number;      // Размытие тени ответа (0-100px)
  textOpacity?: number;           // 0-100, прозрачность текста
}

// Пресеты настроек по типу раунда
export const ROUND_DISPLAY_PRESETS: Record<PubQuizRoundType, RoundDisplaySettings> = {
  text: {
    questionFontSize: 'large',
    answerFontSize: 'large',
    questionNumberFontSize: 'small',
    mediaPosition: 'hidden',
    mediaSize: 'medium',
    showQuestionText: true,
    showQuestionNumber: true,
    showTimer: true,
    showRoundBadge: true,
  },
  music: {
    questionFontSize: 'large',
    answerFontSize: 'large',
    questionNumberFontSize: 'small',
    mediaPosition: 'top',
    mediaSize: 'small',
    showQuestionText: true,
    showQuestionNumber: true,
    showTimer: true,
    showRoundBadge: true,
  },
  picture: {
    questionFontSize: 'medium',
    answerFontSize: 'large',
    questionNumberFontSize: 'small',
    mediaPosition: 'top',
    mediaSize: 'fullscreen',
    showQuestionText: true,
    showQuestionNumber: true,
    showTimer: true,
    showRoundBadge: true,
  },
  video: {
    questionFontSize: 'medium',
    answerFontSize: 'large',
    questionNumberFontSize: 'small',
    mediaPosition: 'top',
    mediaSize: 'fullscreen',
    showQuestionText: true,
    showQuestionNumber: true,
    showTimer: true,
    showRoundBadge: true,
  },
  blitz: {
    questionFontSize: 'xlarge',
    answerFontSize: 'xlarge',
    questionNumberFontSize: 'medium',
    mediaPosition: 'hidden',
    mediaSize: 'medium',
    showQuestionText: true,
    showQuestionNumber: true,
    showTimer: true,
    showRoundBadge: false,
  },
  choice: {
    questionFontSize: 'medium',
    answerFontSize: 'large',
    questionNumberFontSize: 'small',
    mediaPosition: 'top',
    mediaSize: 'medium',
    showQuestionText: true,
    showQuestionNumber: true,
    showTimer: true,
    showRoundBadge: true,
  },
};

export interface PubQuizQuestion {
  id: string;
  text: string;                    // Текст вопроса
  answer: string;                  // Правильный ответ
  acceptableAnswers?: string[];    // Альтернативные варианты ответа
  options?: string[];              // Варианты ответов (A, B, C, D) — если заполнено, показываем выбор
  correctOptionIndex?: number;     // Индекс правильного варианта (0-3)
  points: number;                  // Очки за вопрос
  mediaPath?: string;              // Путь к медиа (аудио/картинка/видео)
  mediaStartTime?: number;         // Для аудио/видео
  mediaEndTime?: number;
  timeLimit?: number;              // Лимит времени в секундах (для блица)
  hint?: string;                   // Подсказка
  answered?: boolean;
}

export interface PubQuizRound {
  id: string;
  name: string;
  type: PubQuizRoundType;
  questions: PubQuizQuestion[];
  description?: string;           // Краткое описание раунда
  rules?: string;                 // Правила раунда (показываются перед началом)
  topic?: string;                 // Тема раунда (например: "Кино 90-х")
  defaultTimeLimit: number;        // Время на ответ по умолчанию (секунды)
  defaultPoints?: number;          // Баллы за вопрос по умолчанию
  showAnswersAfterRound: boolean;  // Показывать ответы после раунда
  displaySettings?: Partial<RoundDisplaySettings>;  // Кастомные настройки отображения
  
  // Настройки слайда правил раунда
  introImagePath?: string;         // Картинка для слайда правил
  introMusicPath?: string;         // Фоновая мелодия для слайда правил
  introMusicVolume?: number;       // Громкость мелодии (0-100, по умолчанию 50)
  
  // Макет слайда правил
  introLayout?: IntroSlideLayout;
}

// Настройки макета слайда правил раунда
export type IntroImagePosition = 'right' | 'left' | 'top' | 'background' | 'hidden';
export type IntroImageSize = 'small' | 'medium' | 'large';

export interface IntroSlideLayout {
  // Позиция и размер картинки
  imagePosition: IntroImagePosition;  // right = классический квиз-формат
  imageSize: IntroImageSize;          // small=30%, medium=40%, large=50%
  
  // Видимость элементов информации
  showRoundNumber: boolean;           // "Раунд 1 из 8"
  showRoundName: boolean;             // Название раунда
  showTopic: boolean;                 // Тема раунда
  showQuestionCount: boolean;         // "8 вопросов"
  showTimeLimit: boolean;             // "60 секунд на ответ"
  showPoints: boolean;                // "1 балл за правильный ответ"
  showRules: boolean;                 // Дополнительные условия
  showRoundIcon: boolean;             // Иконка типа раунда
  
  // Стилизация
  accentColor?: string;               // Акцентный цвет для раунда
}

// Пресет по умолчанию
export const DEFAULT_INTRO_LAYOUT: IntroSlideLayout = {
  imagePosition: 'right',
  imageSize: 'large',
  showRoundNumber: true,
  showRoundName: true,
  showTopic: true,
  showQuestionCount: true,
  showTimeLimit: true,
  showPoints: true,
  showRules: true,
  showRoundIcon: true,
};

// ============================================
// НАСТРОЙКИ СЛАЙДА ПАУЗЫ/ПЕРЕРЫВА
// ============================================

export type BreakImagePosition = 'center' | 'left' | 'right' | 'top' | 'background' | 'hidden';
export type BreakImageSize = 'small' | 'medium' | 'large' | 'fullscreen';

export interface BreakSlideSettings {
  // Текст
  title: string;                      // Заголовок (по умолчанию "Перерыв")
  subtitle?: string;                  // Подзаголовок
  showTimer: boolean;                 // Показывать таймер перерыва
  timerMinutes: number;               // Длительность перерыва в минутах
  
  // Картинка
  imagePath?: string;                 // Путь к картинке
  imagePosition: BreakImagePosition;  // Позиция картинки
  imageSize: BreakImageSize;          // Размер картинки
  
  // Стилизация
  backgroundColor?: string;           // Цвет фона (по умолчанию из темы)
  titleColor?: string;                // Цвет заголовка
  accentColor?: string;               // Акцентный цвет
  
  // Дополнительные элементы
  showNextRoundPreview: boolean;      // Показать превью следующего раунда
  customMessage?: string;             // Кастомное сообщение
}

// Пресет настроек паузы по умолчанию
export const DEFAULT_BREAK_SETTINGS: BreakSlideSettings = {
  title: 'Перерыв',
  showTimer: true,
  timerMinutes: 5,
  imagePosition: 'center',
  imageSize: 'medium',
  showNextRoundPreview: true,
};

// ============================================
// НАСТРОЙКИ СЛАЙДА СБОРА БЛАНКОВ
// ============================================

export interface CollectBlanksSettings {
  title: string;                      // Заголовок (по умолчанию "Сдавайте бланки")
  subtitle?: string;                  // Подзаголовок
  imagePath?: string;                 // Картинка
  imagePosition: BreakImagePosition;
  imageSize: BreakImageSize;
  showRoundInfo: boolean;             // Показать инфо о текущем раунде
  accentColor?: string;
}

export const DEFAULT_COLLECT_BLANKS_SETTINGS: CollectBlanksSettings = {
  title: 'Сдавайте бланки',
  imagePosition: 'center',
  imageSize: 'medium',
  showRoundInfo: true,
};

export interface PubQuizGame {
  id: string;
  mode: 'pub-quiz';
  name: string;
  description?: string;
  rounds: PubQuizRound[];
  settings: PubQuizSettings;
  basePath?: string;        // Путь к папке квиза (для относительных путей к медиа)
  createdAt: string;
  updatedAt: string;
}

export interface PubQuizSettings {
  answerMethod: 'paper' | 'digital';  // Бланки или телефоны
  showTimer: boolean;
  showQuestionNumber: boolean;
  autoAdvance: boolean;               // Автопереход к следующему вопросу
  teamCount: number;
  
  // Глобальные настройки слайдов
  breakSettings?: Partial<BreakSlideSettings>;       // Настройки перерыва
  collectBlanksSettings?: Partial<CollectBlanksSettings>;  // Настройки сбора бланков
}

export interface PubQuizCurrentState {
  roundIndex: number;
  questionIndex: number;
  phase: 'intro' | 'question' | 'answer-time' | 'reveal' | 'round-results';
  timeRemaining: number;
  isTimerRunning: boolean;
  mediaPlaying: boolean;
  answers: Record<string, TeamAnswer>;  // teamId -> ответ
}

export interface TeamAnswer {
  answer: string;
  timestamp: number;
  isCorrect?: boolean;
  pointsAwarded?: number;
}

// Результаты OCR сканирования бланка
export interface BlankScanResult {
  teamName: string;
  answers: {
    questionNumber: number;
    answer: string;
    confidence: number;  // 0-1
  }[];
  imageUrl: string;
}

// ============================================
// ОБЪЕДИНЁННЫЕ ТИПЫ
// ============================================

export type Game = JeopardyGame | PubQuizGame;

export type GameStatus = 'setup' | 'playing' | 'paused' | 'results' | 'finished';

export interface GameSession {
  game: Game | null;
  teams: Team[];
  status: GameStatus;
  theme: ThemeId;
  showScores: boolean;
  // Для Своей игры
  jeopardyState?: JeopardyCurrentQuestion | null;
  // Для Паб-квиза
  pubQuizState?: PubQuizCurrentState | null;
}

// ============================================
// LEGACY ALIASES (для обратной совместимости)
// ============================================

export type QuestionType = JeopardyQuestionType;
export type Question = JeopardyQuestion;
export type Category = JeopardyCategory;
export type CurrentQuestion = JeopardyCurrentQuestion;
