import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PubQuizGame, PubQuizRound, PubQuizQuestion, PubQuizRoundType, ThemeId,
  RoundDisplaySettings, ROUND_DISPLAY_PRESETS, FontSize, MediaPosition, MediaSize,
  IntroSlideLayout, IntroImagePosition, IntroImageSize, DEFAULT_INTRO_LAYOUT
} from '../../types/game';
import { getTheme } from '../../themes';
import { toFileUrl } from './designSystem';
import { renderProjector } from './projector/renderer';
import { v4 as uuidv4 } from 'uuid';

// Компонент выбора файла
interface FilePickerProps {
  value: string;
  onChange: (path: string) => void;
  accept: string;
  placeholder?: string;
  colors: any;
  basePath?: string;
  onBasePathSuggest?: (path: string) => void;
  inputStyle: React.CSSProperties;
  btnStyle: React.CSSProperties;
}

const FilePicker: React.FC<FilePickerProps> = ({ 
  value, onChange, accept, placeholder, colors, basePath, onBasePathSuggest, inputStyle, btnStyle 
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const filePath = ((file as any).path || file.name).replace(/\\/g, '/');
      const normalizedBasePath = basePath?.replace(/\\/g, '/');
      
      // Если есть basePath и файл в этой папке — сохраняем относительный путь
      if (normalizedBasePath && filePath.toLowerCase().startsWith(normalizedBasePath.toLowerCase() + '/')) {
        const relativePath = filePath.substring(normalizedBasePath.length + 1);
        onChange(relativePath);
      } else {
        onChange(filePath);
        
        // Предлагаем установить basePath если его нет
        if (!normalizedBasePath && onBasePathSuggest) {
          const lastSlash = Math.max(filePath.lastIndexOf('/'), filePath.lastIndexOf('\\'));
          const folderPath = lastSlash > 0 ? filePath.substring(0, lastSlash) : '';
          if (folderPath && window.confirm(`Установить "${folderPath}" как папку с медиа?\n\nЭто позволит использовать относительные пути для переносимости квиза.`)) {
            onBasePathSuggest(folderPath);
            const relativePath = filePath.substring(folderPath.length + 1);
            onChange(relativePath);
          }
        }
      }
    }
    e.target.value = '';
  }, [basePath, onChange, onBasePathSuggest]);

  const fileName = value ? value.split('/').pop() || value : '';
  
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        alignItems: 'center', 
        gap: 8,
        padding: '8px 10px',
        background: colors.backgroundTertiary,
        borderRadius: 8,
        border: `1px solid ${colors.border}`,
        minHeight: 36
      }}>
        {value ? (
          <>
            <span style={{ 
              flex: 1, 
              fontSize: '0.8rem', 
              color: colors.text,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }} title={value}>
              {fileName}
            </span>
            <button
              onClick={() => onChange('')}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: colors.incorrect, 
                cursor: 'pointer',
                padding: '2px 6px',
                fontSize: '0.8rem'
              }}
              title="Удалить"
            >
              ✕
            </button>
          </>
        ) : (
          <span style={{ flex: 1, fontSize: '0.75rem', color: colors.textMuted }}>
            {placeholder || 'Файл не выбран'}
          </span>
        )}
      </div>
      <button 
        onClick={() => inputRef.current?.click()}
        style={{ ...btnStyle, padding: '8px 12px', fontSize: '0.8rem' }}
      >
        📁 Выбрать
      </button>
    </div>
  );
};

interface PubQuizEditorProps {
  theme: ThemeId;
  initialGame?: PubQuizGame | null;
  onSave: (game: PubQuizGame) => void;
  onCancel: () => void;
}

const roundTypeInfo: Record<PubQuizRoundType, { icon: string; label: string; description: string }> = {
  text: { icon: '📝', label: 'Текстовый', description: 'Классические вопросы' },
  music: { icon: '🎵', label: 'Музыкальный', description: 'Угадай мелодию' },
  picture: { icon: '🖼️', label: 'Картинки', description: 'Вопросы с изображениями' },
  blitz: { icon: '⚡', label: 'Блиц', description: 'Быстрые вопросы' },
  video: { icon: '🎬', label: 'Видео', description: 'Видео-вопросы' },
  choice: { icon: '🔘', label: 'Выбор ответа', description: 'Вопросы с вариантами A, B, C, D' }
};

const createEmptyQuestion = (): PubQuizQuestion => ({
  id: uuidv4(),
  text: '',
  answer: '',
  points: 1,
  answered: false
});

const createEmptyRound = (): PubQuizRound => ({
  id: uuidv4(),
  name: 'Новый раунд',
  type: 'text',
  questions: [createEmptyQuestion()],
  defaultTimeLimit: 60,
  showAnswersAfterRound: true
});

const PubQuizEditor: React.FC<PubQuizEditorProps> = ({ theme, initialGame, onSave, onCancel }) => {
  const colors = getTheme(theme).colors;
  
  const [game, setGame] = useState<PubQuizGame>(initialGame || {
    id: uuidv4(),
    mode: 'pub-quiz',
    name: '',
    description: '',
    rounds: [createEmptyRound()],
    settings: {
      answerMethod: 'paper',
      showTimer: true,
      showQuestionNumber: true,
      autoAdvance: false,
      teamCount: 10
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  const [selectedRoundIndex, setSelectedRoundIndex] = useState(0);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);
  
  // State для модальных окон предпросмотра
  const [previewType, setPreviewType] = useState<'question' | 'answer' | 'intro' | null>(null);

  const selectedRound = game.rounds[selectedRoundIndex];
  const selectedQuestion = selectedRound?.questions[selectedQuestionIndex];

  // Стили
  const cardStyle: React.CSSProperties = {
    background: colors.backgroundSecondary,
    backdropFilter: 'blur(20px)',
    border: `1px solid ${colors.border}`,
    borderRadius: 16,
    padding: 20
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    background: colors.background,
    border: `1px solid ${colors.border}`,
    borderRadius: 10,
    color: colors.text,
    fontSize: '0.9rem',
    outline: 'none'
  };

  const btnPrimary: React.CSSProperties = {
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
    border: 'none',
    borderRadius: 12,
    color: '#fff',
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: '0.9rem'
  };

  const btnSecondary: React.CSSProperties = {
    padding: '10px 18px',
    background: colors.backgroundTertiary,
    border: `1px solid ${colors.border}`,
    borderRadius: 10,
    color: colors.text,
    fontWeight: 500,
    cursor: 'pointer',
    fontSize: '0.85rem'
  };

  // Handlers
  const updateRound = (roundIndex: number, updates: Partial<PubQuizRound>) => {
    setGame(prev => ({
      ...prev,
      rounds: prev.rounds.map((r, i) => i === roundIndex ? { ...r, ...updates } : r)
    }));
  };

  const updateQuestion = (roundIndex: number, questionIndex: number, updates: Partial<PubQuizQuestion>) => {
    setGame(prev => ({
      ...prev,
      rounds: prev.rounds.map((r, ri) => 
        ri === roundIndex 
          ? { ...r, questions: r.questions.map((q, qi) => qi === questionIndex ? { ...q, ...updates } : q) }
          : r
      )
    }));
  };

  const addRound = () => {
    const newRound = createEmptyRound();
    newRound.name = `Раунд ${game.rounds.length + 1}`;
    setGame(prev => ({ ...prev, rounds: [...prev.rounds, newRound] }));
    setSelectedRoundIndex(game.rounds.length);
    setSelectedQuestionIndex(0);
  };

  const deleteRound = (index: number) => {
    if (game.rounds.length <= 1) return;
    setGame(prev => ({ ...prev, rounds: prev.rounds.filter((_, i) => i !== index) }));
    if (selectedRoundIndex >= game.rounds.length - 1) {
      setSelectedRoundIndex(Math.max(0, game.rounds.length - 2));
    }
    setSelectedQuestionIndex(0);
  };

  const addQuestion = () => {
    const newQuestion = createEmptyQuestion();
    setGame(prev => ({
      ...prev,
      rounds: prev.rounds.map((r, i) => 
        i === selectedRoundIndex 
          ? { ...r, questions: [...r.questions, newQuestion] }
          : r
      )
    }));
    setSelectedQuestionIndex(selectedRound.questions.length);
  };

  const deleteQuestion = (questionIndex: number) => {
    if (selectedRound.questions.length <= 1) return;
    setGame(prev => ({
      ...prev,
      rounds: prev.rounds.map((r, i) => 
        i === selectedRoundIndex 
          ? { ...r, questions: r.questions.filter((_, qi) => qi !== questionIndex) }
          : r
      )
    }));
    if (selectedQuestionIndex >= selectedRound.questions.length - 1) {
      setSelectedQuestionIndex(Math.max(0, selectedRound.questions.length - 2));
    }
  };

  const handleSave = () => {
    if (!game.name.trim()) {
      alert('Введите название квиза');
      return;
    }
    if (game.rounds.some(r => r.questions.some(q => !q.text.trim() || !q.answer.trim()))) {
      alert('Заполните все вопросы и ответы');
      return;
    }
    onSave({
      ...game,
      updatedAt: new Date().toISOString()
    });
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '220px 220px 1fr',
      gap: 16,
      height: 'calc(100vh - 120px)',
      maxHeight: 'calc(100vh - 120px)',
      overflow: 'hidden'
    }}>
      {/* Колонка 1: Раунды */}
      <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexShrink: 0 }}>
          <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: colors.text }}>📋 Раунды</h3>
          <button onClick={addRound} style={{ ...btnSecondary, padding: '5px 10px', fontSize: '0.75rem' }}>
            + Раунд
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflow: 'auto', flex: 1 }}>
          {game.rounds.map((round, index) => (
            <motion.div
              key={round.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => { setSelectedRoundIndex(index); setSelectedQuestionIndex(0); }}
              style={{
                padding: '12px 14px',
                background: selectedRoundIndex === index ? colors.accentMuted : colors.backgroundTertiary,
                border: `1px solid ${selectedRoundIndex === index ? colors.accent : 'transparent'}`,
                borderRadius: 10,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                minWidth: 0,  // Fix for flex overflow
              }}
            >
              <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>{roundTypeInfo[round.type].icon}</span>
              <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                <div style={{ 
                  fontWeight: 600, 
                  fontSize: '0.9rem',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  color: colors.text,
                }}>{round.name}</div>
                <div style={{ fontSize: '0.75rem', color: colors.textMuted }}>
                  {round.questions.length} вопр. · {round.questions.reduce((s, q) => s + q.points, 0)} б.
                </div>
              </div>
              {game.rounds.length > 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); deleteRound(index); }}
                  style={{ background: 'none', border: 'none', color: colors.incorrect, cursor: 'pointer', fontSize: '1rem', flexShrink: 0 }}
                >
                  ×
                </button>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Колонка 2: Вопросы раунда */}
      <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexShrink: 0 }}>
          <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: colors.text }}>❓ Вопросы</h3>
          <button onClick={addQuestion} style={{ ...btnSecondary, padding: '5px 10px', fontSize: '0.75rem' }}>
            + Вопрос
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, overflow: 'auto', flex: 1 }}>
          {selectedRound?.questions.map((question, index) => (
            <motion.div
              key={question.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => setSelectedQuestionIndex(index)}
              style={{
                padding: '10px 12px',
                background: selectedQuestionIndex === index ? colors.accentMuted : colors.backgroundTertiary,
                border: `1px solid ${selectedQuestionIndex === index ? colors.accent : 'transparent'}`,
                borderRadius: 8,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                minWidth: 0,  // Fix for flex overflow
              }}
            >
              <span style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                background: colors.backgroundTertiary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 600,
                flexShrink: 0,
                color: colors.text,
              }}>
                {index + 1}
              </span>
              <div style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
                <div style={{
                  fontSize: '0.85rem',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  color: colors.text,
                }}>
                  {question.text || 'Без вопроса'}
                </div>
                <div style={{ fontSize: '0.7rem', color: colors.textMuted }}>
                  {question.points} б.
                </div>
              </div>
              {selectedRound.questions.length > 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); deleteQuestion(index); }}
                  style={{ background: 'none', border: 'none', color: colors.incorrect, cursor: 'pointer', flexShrink: 0 }}
                >
                  ×
                </button>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Колонка 3: Редактор */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, overflow: 'auto', paddingRight: 4 }}>
        {/* Настройки квиза */}
        <div style={cardStyle}>
          <h3 style={{ margin: 0, marginBottom: 12, fontSize: '0.95rem', fontWeight: 600, color: colors.text }}>🎯 Настройки квиза</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: colors.textMuted, display: 'block', marginBottom: 4 }}>
                Название
              </label>
              <input
                value={game.name}
                onChange={(e) => setGame(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Мой паб-квиз"
                style={{ ...inputStyle, padding: '10px 12px' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: colors.textMuted, display: 'block', marginBottom: 4 }}>
                Формат ответов
              </label>
              <select
                value={game.settings.answerMethod}
                onChange={(e) => setGame(prev => ({ 
                  ...prev, 
                  settings: { ...prev.settings, answerMethod: e.target.value as 'paper' | 'digital' }
                }))}
                style={{ ...inputStyle, padding: '10px 12px', cursor: 'pointer' }}
              >
                <option value="paper">📄 Бланки</option>
                <option value="digital">📱 Телефоны</option>
              </select>
            </div>
          </div>

          <div style={{ marginTop: 10 }}>
            <label style={{ fontSize: '0.75rem', color: colors.textMuted, display: 'block', marginBottom: 4 }}>
              Описание
            </label>
            <textarea
              value={game.description || ''}
              onChange={(e) => setGame(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Описание квиза..."
              rows={2}
              style={{ ...inputStyle, padding: '10px 12px', resize: 'vertical' }}
            />
          </div>

          {/* Папка с медиа */}
          <div style={{ marginTop: 10 }}>
            <label style={{ fontSize: '0.75rem', color: colors.textMuted, display: 'block', marginBottom: 4 }}>
              📁 Папка с медиафайлами (для относительных путей)
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={game.basePath || ''}
                onChange={(e) => setGame(prev => ({ ...prev, basePath: e.target.value }))}
                placeholder="C:\Users\...\quiz_folder или оставьте пустым для абсолютных путей"
                style={{ ...inputStyle, padding: '10px 12px', flex: 1, fontSize: '0.8rem' }}
              />
              <input
                type="file"
                id="basepath-folder-input"
                // @ts-ignore - webkitdirectory для выбора папки
                webkitdirectory=""
                style={{ display: 'none' }}
                onChange={(e) => {
                  const files = e.target.files;
                  if (files && files.length > 0) {
                    // Берём путь первого файла и извлекаем директорию
                    const filePath = (files[0] as any).path || '';
                    const lastSlash = Math.max(filePath.lastIndexOf('/'), filePath.lastIndexOf('\\'));
                    const folderPath = lastSlash > 0 ? filePath.substring(0, lastSlash) : '';
                    if (folderPath) {
                      setGame(prev => ({ ...prev, basePath: folderPath }));
                    }
                  }
                  e.target.value = '';
                }}
              />
              <button 
                onClick={() => document.getElementById('basepath-folder-input')?.click()}
                style={{ ...btnSecondary, padding: '8px 12px' }}
              >
                Выбрать
              </button>
            </div>
            <p style={{ fontSize: '0.7rem', color: colors.textMuted, marginTop: 4 }}>
              💡 Если медиа в подпапках (images/, audio/), укажите родительскую папку
            </p>
          </div>
        </div>

        {/* Редактор раунда */}
        {selectedRound && (
          <div style={cardStyle}>
            <h3 style={{ margin: 0, marginBottom: 10, fontSize: '0.95rem', fontWeight: 600, color: colors.text }}>
              {roundTypeInfo[selectedRound.type].icon} Раунд {selectedRoundIndex + 1}
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: colors.textMuted, display: 'block', marginBottom: 4 }}>
                  Название раунда
                </label>
                <input
                  value={selectedRound.name}
                  onChange={(e) => updateRound(selectedRoundIndex, { name: e.target.value })}
                  style={{ ...inputStyle, padding: '10px 12px' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: colors.textMuted, display: 'block', marginBottom: 4 }}>
                  Тип раунда
                </label>
                <select
                  value={selectedRound.type}
                  onChange={(e) => updateRound(selectedRoundIndex, { type: e.target.value as PubQuizRoundType })}
                  style={{ ...inputStyle, padding: '10px 12px', cursor: 'pointer' }}
                >
                  {Object.entries(roundTypeInfo).map(([type, info]) => (
                    <option key={type} value={type}>{info.icon} {info.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: colors.textMuted, display: 'block', marginBottom: 4 }}>
                  Время на вопрос (сек)
                </label>
                <input
                  type="number"
                  value={selectedRound.defaultTimeLimit}
                  onChange={(e) => updateRound(selectedRoundIndex, { defaultTimeLimit: parseInt(e.target.value) || 60 })}
                  min={5}
                  max={300}
                  style={{ ...inputStyle, padding: '10px 12px' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 4 }}>
                <label 
                  style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
                  onClick={() => updateRound(selectedRoundIndex, { showAnswersAfterRound: !selectedRound.showAnswersAfterRound })}
                >
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 4,
                      border: `2px solid ${selectedRound.showAnswersAfterRound ? colors.accent : colors.border}`,
                      background: selectedRound.showAnswersAfterRound ? colors.accent : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      flexShrink: 0,
                    }}
                  >
                    {selectedRound.showAnswersAfterRound && (
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6L5 9L10 3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <span style={{ fontSize: '0.8rem', color: colors.textSecondary }}>
                    Показать ответы после раунда
                  </span>
                </label>
              </div>
            </div>

            {/* Тема раунда */}
            <div style={{ marginTop: 10 }}>
              <label style={{ fontSize: '0.75rem', color: colors.textMuted, display: 'block', marginBottom: 4 }}>
                🎯 Тема раунда (опционально)
              </label>
              <input
                value={selectedRound.topic || ''}
                onChange={(e) => updateRound(selectedRoundIndex, { topic: e.target.value })}
                placeholder="Например: Кино 90-х, Советские мультфильмы..."
                style={{ ...inputStyle, padding: '10px 12px' }}
              />
            </div>

            {/* Правила раунда */}
            <div style={{ marginTop: 10 }}>
              <label style={{ fontSize: '0.75rem', color: colors.textMuted, display: 'block', marginBottom: 4 }}>
                📋 Правила раунда (опционально)
              </label>
              <textarea
                value={selectedRound.rules || ''}
                onChange={(e) => updateRound(selectedRoundIndex, { rules: e.target.value })}
                placeholder="Если не заполнено — будут показаны правила по умолчанию для этого типа раунда"
                rows={2}
                style={{ ...inputStyle, padding: '10px 12px', resize: 'vertical' }}
              />
            </div>

            {/* Разделитель — Настройки слайда правил */}
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${colors.border}` }}>
              <h4 style={{ margin: 0, marginBottom: 16, fontSize: '0.9rem', fontWeight: 600, color: colors.text }}>
                🎬 Настройки слайда правил
              </h4>
              
              {(() => {
                const layout = selectedRound.introLayout || DEFAULT_INTRO_LAYOUT;
                const updateLayout = (updates: Partial<IntroSlideLayout>) => {
                  updateRound(selectedRoundIndex, { 
                    introLayout: { ...layout, ...updates }
                  });
                };

                const accentColor = layout.accentColor || colors.accent;

                // Стиль чекбокса
                const checkboxStyle = (checked: boolean): React.CSSProperties => ({
                  width: 18,
                  height: 18,
                  borderRadius: 4,
                  border: `2px solid ${checked ? colors.accent : colors.border}`,
                  background: checked ? colors.accent : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  flexShrink: 0,
                });

                return (
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    {/* Левая колонка — Медиа */}
                    <div style={{ flex: '1 1 280px', minWidth: 250 }}>
                      
                      {/* Картинка раунда */}
                      <div style={{ marginBottom: 14 }}>
                        <label style={{ fontSize: '0.75rem', color: colors.textMuted, display: 'block', marginBottom: 6, fontWeight: 500 }}>
                          🖼️ Картинка раунда
                        </label>
                        <FilePicker
                          value={selectedRound.introImagePath || ''}
                          onChange={(path) => updateRound(selectedRoundIndex, { introImagePath: path })}
                          accept="image/*"
                          placeholder="Выберите изображение..."
                          colors={colors}
                          basePath={game.basePath}
                          onBasePathSuggest={(path) => setGame(prev => ({ ...prev, basePath: path }))}
                          inputStyle={inputStyle}
                          btnStyle={btnSecondary}
                        />
                      </div>

                      {/* Позиция и размер */}
                      <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: '0.7rem', color: colors.textMuted, display: 'block', marginBottom: 6 }}>
                            Позиция
                          </label>
                          <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                            {([
                              { value: 'right', icon: '➡️' },
                              { value: 'left', icon: '⬅️' },
                              { value: 'top', icon: '⬆️' },
                              { value: 'background', icon: '🖼️' },
                              { value: 'hidden', icon: '✕' },
                            ] as { value: IntroImagePosition; icon: string }[]).map(pos => (
                              <button
                                key={pos.value}
                                onClick={() => updateLayout({ imagePosition: pos.value })}
                                style={{
                                  width: 32,
                                  height: 28,
                                  background: layout.imagePosition === pos.value ? colors.accent : colors.backgroundSecondary,
                                  color: layout.imagePosition === pos.value ? '#fff' : colors.textSecondary,
                                  border: 'none',
                                  borderRadius: 5,
                                  cursor: 'pointer',
                                  fontSize: '0.75rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                                title={pos.value}
                              >
                                {pos.icon}
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        {layout.imagePosition !== 'hidden' && layout.imagePosition !== 'background' && (
                          <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '0.7rem', color: colors.textMuted, display: 'block', marginBottom: 6 }}>
                              Размер
                            </label>
                            <div style={{ display: 'flex', gap: 3 }}>
                              {(['small', 'medium', 'large'] as IntroImageSize[]).map((size, i) => (
                                <button
                                  key={size}
                                  onClick={() => updateLayout({ imageSize: size })}
                                  style={{
                                    flex: 1,
                                    padding: '4px 8px',
                                    background: layout.imageSize === size ? colors.accent : colors.backgroundSecondary,
                                    color: layout.imageSize === size ? '#fff' : colors.textSecondary,
                                    border: 'none',
                                    borderRadius: 5,
                                    cursor: 'pointer',
                                    fontSize: '0.7rem',
                                    fontWeight: 600
                                  }}
                                >
                                  {['S', 'M', 'L'][i]}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Фоновая музыка */}
                      <div style={{ marginBottom: 14 }}>
                        <label style={{ fontSize: '0.75rem', color: colors.textMuted, display: 'block', marginBottom: 6, fontWeight: 500 }}>
                          🎵 Фоновая музыка
                        </label>
                        <FilePicker
                          value={selectedRound.introMusicPath || ''}
                          onChange={(path) => updateRound(selectedRoundIndex, { introMusicPath: path })}
                          accept="audio/*"
                          placeholder="MP3 файл..."
                          colors={colors}
                          basePath={game.basePath}
                          onBasePathSuggest={(path) => setGame(prev => ({ ...prev, basePath: path }))}
                          inputStyle={inputStyle}
                          btnStyle={btnSecondary}
                        />
                        {selectedRound.introMusicPath && (
                          <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: '0.65rem' }}>🔊</span>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={selectedRound.introMusicVolume || 50}
                              onChange={(e) => updateRound(selectedRoundIndex, { introMusicVolume: Number(e.target.value) })}
                              style={{ flex: 1, height: 4, accentColor: colors.accent, cursor: 'pointer' }}
                            />
                            <span style={{ fontSize: '0.65rem', color: colors.textSecondary, minWidth: 28 }}>
                              {selectedRound.introMusicVolume || 50}%
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Акцентный цвет */}
                      <div>
                        <label style={{ fontSize: '0.7rem', color: colors.textMuted, display: 'block', marginBottom: 6 }}>
                          🎨 Акцентный цвет
                        </label>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <input
                            type="color"
                            value={layout.accentColor || colors.accent}
                            onChange={(e) => updateLayout({ accentColor: e.target.value })}
                            style={{ width: 36, height: 28, border: 'none', borderRadius: 6, cursor: 'pointer', padding: 0 }}
                          />
                          <span style={{ fontSize: '0.7rem', color: colors.textMuted }}>{layout.accentColor || 'По умолчанию'}</span>
                          {layout.accentColor && (
                            <button
                              onClick={() => updateLayout({ accentColor: undefined })}
                              style={{ ...btnSecondary, padding: '2px 8px', fontSize: '0.65rem' }}
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Правая колонка — Элементы + Кнопка */}
                    <div style={{ flex: '1 1 280px', minWidth: 250 }}>
                      {/* Элементы на слайде */}
                      <div style={{ 
                        background: colors.backgroundSecondary, 
                        padding: 12, 
                        borderRadius: 8,
                        marginBottom: 14
                      }}>
                        <label style={{ fontSize: '0.75rem', color: colors.text, display: 'block', marginBottom: 10, fontWeight: 600 }}>
                          Элементы на слайде:
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                          {[
                            { key: 'showRoundNumber', label: '№ раунда', icon: '🔢' },
                            { key: 'showRoundName', label: 'Название', icon: '📝' },
                            { key: 'showTopic', label: 'Тема', icon: '🏷️' },
                            { key: 'showQuestionCount', label: 'Вопросов', icon: '❓' },
                            { key: 'showTimeLimit', label: 'Время', icon: '⏱️' },
                            { key: 'showPoints', label: 'Баллы', icon: '⭐' },
                            { key: 'showRules', label: 'Правила', icon: '📋' },
                            { key: 'showRoundIcon', label: 'Иконка', icon: '🎯' },
                          ].map(({ key, label, icon }) => {
                            const isChecked = layout[key as keyof IntroSlideLayout] as boolean;
                            return (
                              <div 
                                key={key} 
                                onClick={() => updateLayout({ [key]: !isChecked })}
                                style={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: 8, 
                                  cursor: 'pointer',
                                  padding: '6px 8px',
                                  borderRadius: 6,
                                  background: isChecked ? `${colors.accent}15` : 'transparent',
                                  transition: 'background 0.15s ease'
                                }}
                              >
                                <div style={checkboxStyle(isChecked)}>
                                  {isChecked && <span style={{ color: '#fff', fontSize: '0.65rem' }}>✓</span>}
                                </div>
                                <span style={{ fontSize: '0.7rem', color: isChecked ? colors.text : colors.textSecondary }}>
                                  {icon} {label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Кнопка предпросмотра */}
                      <button
                        onClick={() => setPreviewType('intro')}
                        style={{ 
                          width: '100%',
                          padding: '12px 20px',
                          background: accentColor,
                          color: '#fff',
                          border: 'none',
                          borderRadius: 8,
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 8
                        }}
                      >
                        👁️ Предпросмотр слайда правил
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Настройки отображения раунда */}
        {selectedRound && (
          <div style={cardStyle}>
            <h3 style={{ margin: 0, marginBottom: 12, fontSize: '0.95rem', fontWeight: 600, color: colors.text }}>
              🖥️ Настройки проектора
            </h3>
            
            {(() => {
              const preset = ROUND_DISPLAY_PRESETS[selectedRound.type];
              const ds = { ...preset, ...selectedRound.displaySettings };
              
              const updateDisplay = (updates: Partial<RoundDisplaySettings>) => {
                updateRound(selectedRoundIndex, { 
                  displaySettings: { ...selectedRound.displaySettings, ...updates }
                });
              };

              const fontSizeLabels: Record<FontSize, string> = {
                small: 'S',
                medium: 'M', 
                large: 'L',
                xlarge: 'XL'
              };

              const mediaPosLabels: Record<MediaPosition, string> = {
                top: '⬆️ Сверху',
                left: '⬅️ Слева',
                right: '➡️ Справа',
                background: '🖼️ Фон',
                hidden: '🚫 Скрыть'
              };

              const mediaSizeLabels: Record<MediaSize, string> = {
                small: '30%',
                medium: '50%',
                large: '70%',
                fullscreen: '100%'
              };

              return (
                <>
                  {/* Размеры шрифтов */}
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: '0.75rem', color: colors.textMuted, display: 'block', marginBottom: 6 }}>
                      Размер текста вопроса
                    </label>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {(['small', 'medium', 'large', 'xlarge'] as FontSize[]).map(size => (
                        <button
                          key={size}
                          onClick={() => updateDisplay({ questionFontSize: size })}
                          style={{
                            flex: 1,
                            padding: '8px 12px',
                            background: ds.questionFontSize === size ? colors.accent : colors.backgroundTertiary,
                            color: ds.questionFontSize === size ? '#fff' : colors.text,
                            border: 'none',
                            borderRadius: 8,
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            fontWeight: 600
                          }}
                        >
                          {fontSizeLabels[size]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Настройки "Вопрос X из Y" */}
                  <div style={{ marginBottom: 12, padding: 10, background: colors.backgroundSecondary, borderRadius: 8 }}>
                    <label style={{ fontSize: '0.75rem', color: colors.textMuted, display: 'block', marginBottom: 6 }}>
                      Настройки "Вопрос X из Y"
                    </label>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <div>
                        <span style={{ fontSize: '0.65rem', color: colors.textMuted, display: 'block', marginBottom: 2 }}>Размер</span>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {(['small', 'medium', 'large'] as FontSize[]).map(size => (
                            <button
                              key={size}
                              onClick={() => updateDisplay({ questionNumberFontSize: size })}
                              style={{
                                padding: '4px 8px',
                                background: (ds.questionNumberFontSize || 'small') === size ? colors.accent : colors.backgroundTertiary,
                                color: (ds.questionNumberFontSize || 'small') === size ? '#fff' : colors.text,
                                border: 'none',
                                borderRadius: 4,
                                cursor: 'pointer',
                                fontSize: '0.65rem',
                                fontWeight: 600
                              }}
                            >
                              {fontSizeLabels[size]}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.65rem', color: colors.textMuted, display: 'block', marginBottom: 2 }}>Цвет</span>
                        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                          <input
                            type="color"
                            value={ds.questionNumberColor || colors.textMuted}
                            onChange={(e) => updateDisplay({ questionNumberColor: e.target.value })}
                            style={{ width: 24, height: 24, border: 'none', borderRadius: 4, cursor: 'pointer' }}
                          />
                          <button
                            onClick={() => updateDisplay({ questionNumberColor: undefined })}
                            style={{ ...btnSecondary, padding: '2px 6px', fontSize: '0.6rem' }}
                          >
                            ↺
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Позиция медиа */}
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: '0.75rem', color: colors.textMuted, display: 'block', marginBottom: 6 }}>
                      Позиция медиа
                    </label>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {(['top', 'left', 'right', 'background', 'hidden'] as MediaPosition[]).map(pos => (
                        <button
                          key={pos}
                          onClick={() => updateDisplay({ mediaPosition: pos })}
                          style={{
                            padding: '6px 10px',
                            background: ds.mediaPosition === pos ? colors.accent : colors.backgroundTertiary,
                            color: ds.mediaPosition === pos ? '#fff' : colors.text,
                            border: 'none',
                            borderRadius: 6,
                            cursor: 'pointer',
                            fontSize: '0.7rem'
                          }}
                        >
                          {mediaPosLabels[pos]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Размер медиа */}
                  {ds.mediaPosition !== 'hidden' && (
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ fontSize: '0.75rem', color: colors.textMuted, display: 'block', marginBottom: 6 }}>
                        Размер медиа
                      </label>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {(['small', 'medium', 'large', 'fullscreen'] as MediaSize[]).map(size => (
                          <button
                            key={size}
                            onClick={() => updateDisplay({ mediaSize: size })}
                            style={{
                              flex: 1,
                              padding: '6px 10px',
                              background: ds.mediaSize === size ? colors.accent : colors.backgroundTertiary,
                              color: ds.mediaSize === size ? '#fff' : colors.text,
                              border: 'none',
                              borderRadius: 6,
                              cursor: 'pointer',
                              fontSize: '0.75rem'
                            }}
                          >
                            {mediaSizeLabels[size]}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Чекбоксы видимости */}
                  <div style={{ 
                    background: colors.backgroundSecondary, 
                    padding: 12, 
                    borderRadius: 8,
                    marginBottom: 12 
                  }}>
                    <label style={{ fontSize: '0.75rem', color: colors.text, display: 'block', marginBottom: 10, fontWeight: 600 }}>
                      Показывать на слайде вопроса:
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {[
                        { key: 'showQuestionText', label: 'Текст вопроса', icon: '📝' },
                        { key: 'showQuestionNumber', label: 'Номер вопроса', icon: '🔢' },
                        { key: 'showTimer', label: 'Таймер', icon: '⏱️' },
                        { key: 'showRoundBadge', label: 'Название раунда', icon: '🏷️' },
                      ].map(({ key, label, icon }) => {
                        const isChecked = ds[key as keyof RoundDisplaySettings] as boolean;
                        return (
                          <div 
                            key={key} 
                            onClick={() => updateDisplay({ [key]: !isChecked })}
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: 8, 
                              cursor: 'pointer',
                              padding: '6px 8px',
                              borderRadius: 6,
                              background: isChecked ? `${colors.accent}15` : 'transparent',
                              transition: 'background 0.15s ease'
                            }}
                          >
                            <div style={{
                              width: 18,
                              height: 18,
                              borderRadius: 4,
                              border: `2px solid ${isChecked ? colors.accent : colors.border}`,
                              background: isChecked ? colors.accent : 'transparent',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.15s ease',
                              flexShrink: 0,
                            }}>
                              {isChecked && <span style={{ color: '#fff', fontSize: '0.65rem' }}>✓</span>}
                            </div>
                            <span style={{ fontSize: '0.75rem', color: isChecked ? colors.text : colors.textSecondary }}>
                              {icon} {label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Цвет текста */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ fontSize: '0.7rem', color: colors.textMuted, display: 'block', marginBottom: 4 }}>
                        Цвет вопроса
                      </label>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <input
                          type="color"
                          value={ds.questionTextColor || '#ffffff'}
                          onChange={(e) => updateDisplay({ questionTextColor: e.target.value })}
                          style={{ width: 36, height: 28, border: 'none', borderRadius: 6, cursor: 'pointer', padding: 0 }}
                        />
                        <span style={{ 
                          fontSize: '0.65rem', 
                          color: colors.textMuted, 
                          fontFamily: 'monospace' 
                        }}>
                          {ds.questionTextColor || 'авто'}
                        </span>
                        {ds.questionTextColor && (
                          <button
                            onClick={() => updateDisplay({ questionTextColor: undefined })}
                            style={{ ...btnSecondary, padding: '2px 6px', fontSize: '0.6rem' }}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.7rem', color: colors.textMuted, display: 'block', marginBottom: 4 }}>
                        Цвет ответа
                      </label>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <input
                          type="color"
                          value={ds.answerTextColor || '#10b981'}
                          onChange={(e) => updateDisplay({ answerTextColor: e.target.value })}
                          style={{ width: 36, height: 28, border: 'none', borderRadius: 6, cursor: 'pointer', padding: 0 }}
                        />
                        <span style={{ 
                          fontSize: '0.65rem', 
                          color: colors.textMuted, 
                          fontFamily: 'monospace' 
                        }}>
                          {ds.answerTextColor || 'авто'}
                        </span>
                        {ds.answerTextColor && (
                          <button
                            onClick={() => updateDisplay({ answerTextColor: undefined })}
                            style={{ ...btnSecondary, padding: '2px 6px', fontSize: '0.6rem' }}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Тень ответа */}
                  <div style={{ marginTop: 12 }}>
                    <label style={{ fontSize: '0.7rem', color: colors.textMuted, display: 'block', marginBottom: 6 }}>
                      🌟 Тень ответа
                    </label>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input
                          type="color"
                          value={ds.answerShadowColor || ds.answerTextColor || '#10b981'}
                          onChange={(e) => updateDisplay({ answerShadowColor: e.target.value })}
                          style={{ width: 36, height: 28, border: 'none', borderRadius: 6, cursor: 'pointer', padding: 0 }}
                        />
                        <span style={{ fontSize: '0.65rem', color: colors.textMuted, fontFamily: 'monospace' }}>
                          {ds.answerShadowColor || 'как текст'}
                        </span>
                        {ds.answerShadowColor && (
                          <button
                            onClick={() => updateDisplay({ answerShadowColor: undefined })}
                            style={{ ...btnSecondary, padding: '2px 6px', fontSize: '0.6rem' }}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: '0.65rem', color: colors.textMuted }}>Размытие:</span>
                        <input
                          type="range"
                          min="0"
                          max="80"
                          value={ds.answerShadowBlur ?? 40}
                          onChange={(e) => updateDisplay({ answerShadowBlur: Number(e.target.value) })}
                          style={{ width: 80, accentColor: colors.accent, cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: '0.65rem', color: colors.textMuted, minWidth: 30 }}>
                          {ds.answerShadowBlur ?? 40}px
                        </span>
                      </div>
                      {(ds.answerShadowBlur ?? 40) > 0 && (
                        <button
                          onClick={() => updateDisplay({ answerShadowBlur: 0 })}
                          style={{ ...btnSecondary, padding: '4px 8px', fontSize: '0.65rem' }}
                        >
                          Без тени
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Кнопка сброса на пресет */}
                  <button
                    onClick={() => updateRound(selectedRoundIndex, { displaySettings: undefined })}
                    style={{ ...btnSecondary, width: '100%', marginTop: 10, fontSize: '0.75rem' }}
                  >
                    🔄 Сбросить на настройки по умолчанию для "{roundTypeInfo[selectedRound.type].label}"
                  </button>
                </>
              );
            })()}

            {/* Разделитель между секциями */}
            {selectedQuestion && (
              <div style={{ 
                borderTop: `1px solid ${colors.border}`, 
                margin: '20px 0', 
                paddingTop: 20 
              }}>
                <h3 style={{ margin: 0, marginBottom: 12, fontSize: '0.95rem', fontWeight: 600, color: colors.text }}>
                  ✏️ Редактирование вопроса {selectedQuestionIndex + 1}
                </h3>

                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: '0.75rem', color: colors.textMuted, display: 'block', marginBottom: 4 }}>
                    Текст вопроса
                  </label>
                  <textarea
                    value={selectedQuestion.text}
                    onChange={(e) => updateQuestion(selectedRoundIndex, selectedQuestionIndex, { text: e.target.value })}
                    placeholder="Введите вопрос..."
                    rows={2}
                    style={{ ...inputStyle, padding: '10px 12px', resize: 'vertical' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10, marginBottom: 12 }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: colors.textMuted, display: 'block', marginBottom: 4 }}>
                      Правильный ответ
                    </label>
                    <input
                      value={selectedQuestion.answer}
                      onChange={(e) => updateQuestion(selectedRoundIndex, selectedQuestionIndex, { answer: e.target.value })}
                      placeholder="Ответ"
                      style={{ ...inputStyle, padding: '10px 12px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: colors.textMuted, display: 'block', marginBottom: 4 }}>
                      Баллы
                    </label>
                    <input
                      type="number"
                      value={selectedQuestion.points}
                      onChange={(e) => updateQuestion(selectedRoundIndex, selectedQuestionIndex, { points: parseInt(e.target.value) || 1 })}
                      min={0.5}
                      step={0.5}
                      style={{ ...inputStyle, padding: '10px 12px' }}
                    />
                  </div>
                </div>

            {/* Медиа для музыки/картинок/видео */}
            {(selectedRound.type === 'music' || selectedRound.type === 'picture' || selectedRound.type === 'video') && (
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: '0.75rem', color: colors.textMuted, display: 'block', marginBottom: 4 }}>
                  {selectedRound.type === 'music' ? '🎵 Аудио файл' : selectedRound.type === 'picture' ? '🖼️ Изображение' : '🎬 Видео'}
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    value={selectedQuestion.mediaPath || ''}
                    onChange={(e) => updateQuestion(selectedRoundIndex, selectedQuestionIndex, { mediaPath: e.target.value })}
                    placeholder="images/photo.jpg или полный путь"
                    style={{ ...inputStyle, padding: '10px 12px', flex: 1, fontSize: '0.85rem' }}
                  />
                  <input
                    type="file"
                    id="media-file-input"
                    accept={selectedRound.type === 'picture' ? 'image/*' : selectedRound.type === 'music' ? 'audio/*' : 'video/*'}
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const filePath = ((file as any).path || file.name).replace(/\\/g, '/');
                        const basePath = game.basePath?.replace(/\\/g, '/');
                        
                        // Если есть basePath и файл в этой папке — сохраняем относительный путь
                        if (basePath && filePath.startsWith(basePath + '/')) {
                          const relativePath = filePath.substring(basePath.length + 1);
                          updateQuestion(selectedRoundIndex, selectedQuestionIndex, { mediaPath: relativePath });
                        } else if (basePath && filePath.toLowerCase().startsWith(basePath.toLowerCase() + '/')) {
                          // Case-insensitive для Windows
                          const relativePath = filePath.substring(basePath.length + 1);
                          updateQuestion(selectedRoundIndex, selectedQuestionIndex, { mediaPath: relativePath });
                        } else {
                          // Нет basePath или файл вне папки — сохраняем абсолютный путь
                          updateQuestion(selectedRoundIndex, selectedQuestionIndex, { mediaPath: filePath });
                          
                          // Предлагаем установить basePath если его нет
                          if (!basePath) {
                            const lastSlash = Math.max(filePath.lastIndexOf('/'), filePath.lastIndexOf('\\'));
                            const folderPath = lastSlash > 0 ? filePath.substring(0, lastSlash) : '';
                            if (folderPath && window.confirm(`Установить "${folderPath}" как папку с медиа?\n\nЭто позволит использовать относительные пути для переносимости квиза.`)) {
                              setGame(prev => ({ ...prev, basePath: folderPath }));
                              // Пересохраняем как относительный путь
                              const relativePath = filePath.substring(folderPath.length + 1);
                              updateQuestion(selectedRoundIndex, selectedQuestionIndex, { mediaPath: relativePath });
                            }
                          }
                        }
                      }
                      e.target.value = '';
                    }}
                  />
                  <button 
                    onClick={() => document.getElementById('media-file-input')?.click()}
                    style={{ ...btnSecondary, padding: '8px 12px' }}
                  >
                    Выбрать
                  </button>
                </div>
              </div>
            )}

            {/* Превью медиа — показываем для любого типа раунда если есть mediaPath */}
            {selectedQuestion.mediaPath && (
              <div style={{ marginBottom: 12 }}>
                {/* Debug info */}
                <div style={{ 
                  fontSize: '0.7rem', 
                  color: colors.textMuted, 
                  marginBottom: 6,
                  wordBreak: 'break-all'
                }}>
                  📁 {toFileUrl(selectedQuestion.mediaPath, game.basePath)}
                </div>
                
                {/* Картинки — показываем для picture или если расширение изображения */}
                {(selectedRound.type === 'picture' || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(selectedQuestion.mediaPath)) && (
                  <img
                    src={toFileUrl(selectedQuestion.mediaPath, game.basePath)}
                    alt="Превью"
                    style={{
                      maxWidth: '100%',
                      maxHeight: 150,
                      borderRadius: 8,
                      border: `1px solid ${colors.border}`,
                    }}
                    onError={(e) => { 
                      const target = e.target as HTMLImageElement;
                      target.style.border = `2px solid ${colors.incorrect}`;
                      target.alt = '❌ Не удалось загрузить изображение';
                      target.style.padding = '20px';
                      target.style.background = `${colors.incorrect}10`;
                    }}
                  />
                )}

                {/* Аудио */}
                {(selectedRound.type === 'music' || /\.(mp3|wav|ogg|m4a|flac)$/i.test(selectedQuestion.mediaPath)) && (
                  <audio
                    src={toFileUrl(selectedQuestion.mediaPath, game.basePath)}
                    controls
                    style={{ width: '100%', borderRadius: 8 }}
                  />
                )}

                {/* Видео */}
                {(selectedRound.type === 'video' || /\.(mp4|webm|avi|mov|mkv)$/i.test(selectedQuestion.mediaPath)) && (
                  <video
                    src={toFileUrl(selectedQuestion.mediaPath, game.basePath)}
                    controls
                    style={{ width: '100%', maxHeight: 200, borderRadius: 8, background: '#000' }}
                  />
                )}
              </div>
            )}

            {/* Тайминг для аудио/видео */}
            {(selectedRound.type === 'music' || selectedRound.type === 'video') && selectedQuestion.mediaPath && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: colors.textMuted, display: 'block', marginBottom: 4 }}>
                    Начало (сек)
                  </label>
                  <input
                    type="number"
                    value={selectedQuestion.mediaStartTime || 0}
                    onChange={(e) => updateQuestion(selectedRoundIndex, selectedQuestionIndex, { mediaStartTime: parseInt(e.target.value) || 0 })}
                    min={0}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: colors.textMuted, display: 'block', marginBottom: 6 }}>
                    Конец (сек)
                  </label>
                  <input
                    type="number"
                    value={selectedQuestion.mediaEndTime || 30}
                    onChange={(e) => updateQuestion(selectedRoundIndex, selectedQuestionIndex, { mediaEndTime: parseInt(e.target.value) || 30 })}
                    min={1}
                    style={inputStyle}
                  />
                </div>
              </div>
            )}

            {/* Варианты ответов для типа choice */}
            {selectedRound.type === 'choice' && (
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: '0.75rem', color: colors.textMuted, display: 'block', marginBottom: 8 }}>
                  🔘 Варианты ответов
                </label>
                {['A', 'B', 'C', 'D'].map((letter, idx) => (
                  <div key={letter} style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'center' }}>
                    <button
                      onClick={() => updateQuestion(selectedRoundIndex, selectedQuestionIndex, { 
                        correctOptionIndex: idx,
                        answer: selectedQuestion.options?.[idx] || ''
                      })}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 6,
                        border: selectedQuestion.correctOptionIndex === idx 
                          ? '2px solid #10b981' 
                          : `1px solid ${colors.border}`,
                        background: selectedQuestion.correctOptionIndex === idx 
                          ? 'rgba(16, 185, 129, 0.2)' 
                          : colors.backgroundTertiary,
                        color: selectedQuestion.correctOptionIndex === idx 
                          ? '#10b981' 
                          : colors.text,
                        fontWeight: 700,
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        flexShrink: 0
                      }}
                      title={selectedQuestion.correctOptionIndex === idx ? 'Правильный ответ' : 'Нажмите, чтобы отметить как правильный'}
                    >
                      {letter}
                    </button>
                    <input
                      value={selectedQuestion.options?.[idx] || ''}
                      onChange={(e) => {
                        const newOptions = [...(selectedQuestion.options || ['', '', '', ''])];
                        newOptions[idx] = e.target.value;
                        const updates: Partial<PubQuizQuestion> = { options: newOptions };
                        // Если это правильный вариант, обновляем и answer
                        if (selectedQuestion.correctOptionIndex === idx) {
                          updates.answer = e.target.value;
                        }
                        updateQuestion(selectedRoundIndex, selectedQuestionIndex, updates);
                      }}
                      placeholder={`Вариант ${letter}...`}
                      style={{ ...inputStyle, padding: '8px 10px', flex: 1 }}
                    />
                    {selectedQuestion.correctOptionIndex === idx && (
                      <span style={{ color: '#10b981', fontSize: '0.7rem', fontWeight: 600, whiteSpace: 'nowrap' }}>✓</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Подсказка */}
            <div>
              <label style={{ fontSize: '0.75rem', color: colors.textMuted, display: 'block', marginBottom: 4 }}>
                Подсказка (опционально)
              </label>
              <input
                value={selectedQuestion.hint || ''}
                onChange={(e) => updateQuestion(selectedRoundIndex, selectedQuestionIndex, { hint: e.target.value })}
                placeholder="Подсказка для команд..."
                style={{ ...inputStyle, padding: '10px 12px' }}
              />
            </div>

            {/* Кнопки предпросмотра */}
            <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
              <button
                onClick={() => setPreviewType('question')}
                style={{
                  ...btnSecondary,
                  flex: 1,
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  fontSize: '0.85rem',
                  background: colors.accent,
                  color: '#fff',
                  fontWeight: 600
                }}
              >
                👁️ Вопрос
              </button>
              <button
                onClick={() => setPreviewType('answer')}
                style={{
                  ...btnSecondary,
                  flex: 1,
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  fontSize: '0.85rem',
                  background: colors.correct,
                  color: '#fff',
                  fontWeight: 600
                }}
              >
                ✅ Ответ
              </button>
            </div>
              </div>
            )}
          </div>
        )}

        {/* Кнопки действий - sticky внизу */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'flex-end', 
          gap: 10, 
          padding: '12px 0',
          borderTop: `1px solid ${colors.border}`,
          marginTop: 'auto',
          flexShrink: 0,
          background: colors.background
        }}>
          <button onClick={onCancel} style={{ ...btnSecondary, padding: '10px 16px' }}>
            Отмена
          </button>
          <button onClick={handleSave} style={{ ...btnPrimary, padding: '10px 16px' }}>
            💾 Сохранить
          </button>
        </div>
      </div>

      {/* Модальное окно предпросмотра */}
      <AnimatePresence>
        {previewType && selectedRound && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.9)',
              zIndex: 1000,
              display: 'flex',
              flexDirection: 'column',
              padding: 20,
            }}
            onClick={() => setPreviewType(null)}
          >
            {/* Шапка */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: 16,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <span style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 600 }}>
                  {previewType === 'intro' 
                    ? `🎬 Слайд правил — ${selectedRound.name}`
                    : previewType === 'question'
                      ? `👁️ Вопрос ${selectedQuestionIndex + 1} — ${selectedRound.name}`
                      : `✅ Ответ ${selectedQuestionIndex + 1} — ${selectedRound.name}`
                  }
                </span>
                {/* Переключатель для вопрос/ответ */}
                {previewType !== 'intro' && (
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); setPreviewType('question'); }}
                      style={{
                        background: previewType === 'question' ? colors.accent : 'rgba(255,255,255,0.1)',
                        border: 'none',
                        borderRadius: 6,
                        padding: '6px 12px',
                        color: '#fff',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                      }}
                    >
                      Вопрос
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setPreviewType('answer'); }}
                      style={{
                        background: previewType === 'answer' ? colors.correct : 'rgba(255,255,255,0.1)',
                        border: 'none',
                        borderRadius: 6,
                        padding: '6px 12px',
                        color: '#fff',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                      }}
                    >
                      Ответ
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={() => setPreviewType(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  borderRadius: 8,
                  padding: '8px 16px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                }}
              >
                ✕ Закрыть
              </button>
            </div>

            {/* Iframe */}
            <div 
              style={{ 
                flex: 1, 
                borderRadius: 16, 
                overflow: 'hidden',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <iframe
                srcDoc={
                  previewType === 'intro'
                    ? renderProjector({
                        phase: 'round-intro',
                        round: selectedRound,
                        roundIdx: selectedRoundIndex,
                        qIdx: 0,
                        question: selectedRound.questions[0] || null,
                        answer: selectedRound.questions[0] || null,
                        totalQ: selectedRound.questions.length,
                        totalRounds: game.rounds.length,
                        maxPts: selectedRound.defaultPoints || 1,
                        time: 0,
                        timeLimit: selectedRound.defaultTimeLimit || 60,
                        timerOn: false,
                        teams: [],
                        scores: {},
                        totals: {},
                        aIdx: 0,
                        theme: theme,
                        basePath: game.basePath,
                        game: game,
                      })
                    : renderProjector({
                        phase: previewType === 'question' ? 'questions' : 'show-answers',
                        roundIdx: selectedRoundIndex,
                        qIdx: selectedQuestionIndex,
                        aIdx: selectedQuestionIndex,
                        time: selectedRound.defaultTimeLimit,
                        timeLimit: selectedRound.defaultTimeLimit,
                        theme: theme,
                        basePath: game.basePath,
                        round: selectedRound,
                        question: selectedQuestion,
                        answer: previewType === 'answer' ? selectedQuestion : undefined,
                        totalQ: selectedRound.questions.length,
                        maxPts: selectedRound.questions.reduce((s, q) => s + q.points, 0),
                        teams: [],
                        scores: {},
                        totals: {},
                        game: game,
                      })
                }
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                }}
                title="Preview"
              />
            </div>

            <div style={{ 
              textAlign: 'center', 
              color: 'rgba(255, 255, 255, 0.5)', 
              fontSize: '0.8rem',
              marginTop: 12,
            }}>
              Кликните в любое место или нажмите ✕ чтобы закрыть
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PubQuizEditor;
