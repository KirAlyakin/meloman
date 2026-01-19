import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import { JeopardyGame, JeopardyCategory, JeopardyQuestion, JeopardyQuestionType } from '../types/game';

interface GameEditorProps {
  game?: JeopardyGame | null;
  onSave: (game: JeopardyGame) => void;
  onCancel: () => void;
  colors: any;
}

const questionTypes: { type: JeopardyQuestionType; label: string; icon: string }[] = [
  { type: 'normal', label: 'Обычный', icon: '🎵' },
  { type: 'bet', label: 'Ставка', icon: '💰' },
  { type: 'auction', label: 'Аукцион', icon: '🔨' },
  { type: 'cat', label: 'Кот в мешке', icon: '🐱' },
  { type: 'sing', label: 'Спой!', icon: '🎤' }
];

const GameEditor: React.FC<GameEditorProps> = ({ game, onSave, onCancel, colors }) => {
  const [name, setName] = useState(game?.name || '');
  const [description, setDescription] = useState(game?.description || '');
  const [categories, setCategories] = useState<JeopardyCategory[]>(
    game?.categories || [createEmptyCategory()]
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    categories[0]?.id || null
  );
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function createEmptyCategory(): JeopardyCategory {
    return {
      id: uuidv4(),
      name: 'Новая категория',
      questions: []
    };
  }

  function createEmptyQuestion(): JeopardyQuestion {
    return {
      id: uuidv4(),
      audioPath: '',
      answer: '',
      startTime: 0,
      endTime: 30,
      type: 'normal',
      played: false
    };
  }

  const selectedCategory = categories.find(c => c.id === selectedCategoryId);
  const selectedQuestion = selectedCategory?.questions.find(q => q.id === selectedQuestionId);

  const addCategory = () => {
    const newCategory = createEmptyCategory();
    setCategories([...categories, newCategory]);
    setSelectedCategoryId(newCategory.id);
    setSelectedQuestionId(null);
  };

  const deleteCategory = (id: string) => {
    if (categories.length <= 1) return;
    const newCategories = categories.filter(c => c.id !== id);
    setCategories(newCategories);
    if (selectedCategoryId === id) {
      setSelectedCategoryId(newCategories[0]?.id || null);
      setSelectedQuestionId(null);
    }
  };

  const updateCategoryName = (id: string, name: string) => {
    setCategories(categories.map(c => c.id === id ? { ...c, name } : c));
  };

  const addQuestion = () => {
    if (!selectedCategoryId) return;
    const newQuestion = createEmptyQuestion();
    setCategories(categories.map(c => {
      if (c.id === selectedCategoryId) {
        return { ...c, questions: [...c.questions, newQuestion] };
      }
      return c;
    }));
    setSelectedQuestionId(newQuestion.id);
  };

  const deleteQuestion = (questionId: string) => {
    setCategories(categories.map(c => {
      if (c.id === selectedCategoryId) {
        return { ...c, questions: c.questions.filter(q => q.id !== questionId) };
      }
      return c;
    }));
    if (selectedQuestionId === questionId) {
      setSelectedQuestionId(null);
    }
  };

  const updateQuestion = (questionId: string, updates: Partial<JeopardyQuestion>) => {
    setCategories(categories.map(c => {
      if (c.id === selectedCategoryId) {
        return {
          ...c,
          questions: c.questions.map(q => q.id === questionId ? { ...q, ...updates } : q)
        };
      }
      return c;
    }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedQuestionId) {
      const path = URL.createObjectURL(file);
      updateQuestion(selectedQuestionId, { audioPath: path });
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      alert('Введите название игры');
      return;
    }
    if (categories.some(c => c.questions.length === 0)) {
      alert('Каждая категория должна содержать хотя бы один вопрос');
      return;
    }

    const gameData: JeopardyGame = {
      id: game?.id || uuidv4(),
      mode: 'jeopardy',
      name: name.trim(),
      description: description.trim(),
      categories,
      createdAt: game?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    onSave(gameData);
  };

  // Стили
  const cardStyle: React.CSSProperties = {
    background: colors.backgroundSecondary,
    backdropFilter: 'blur(20px)',
    borderRadius: 16,
    border: `1px solid ${colors.border}`,
    padding: 20
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: 12,
    border: `1px solid ${colors.border}`,
    background: colors.backgroundTertiary,
    color: colors.text,
    fontSize: '0.95rem',
    outline: 'none'
  };

  const btnPrimary: React.CSSProperties = {
    padding: '12px 24px',
    borderRadius: 12,
    border: 'none',
    background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
    color: '#fff',
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: '0.9rem'
  };

  const btnSecondary: React.CSSProperties = {
    padding: '10px 18px',
    borderRadius: 10,
    border: `1px solid ${colors.border}`,
    background: colors.backgroundTertiary,
    color: colors.text,
    fontWeight: 500,
    cursor: 'pointer',
    fontSize: '0.85rem'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 20 }}>
      {/* Заголовок */}
      <div style={{ ...cardStyle }}>
        <h2 style={{ margin: 0, marginBottom: 20, fontSize: '1.3rem', fontWeight: 700 }}>
          {game ? 'Редактирование игры' : 'Создание новой игры'}
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: '0.8rem', color: colors.textMuted, fontWeight: 600 }}>
              НАЗВАНИЕ ИГРЫ *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например: Хиты 90-х"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: '0.8rem', color: colors.textMuted, fontWeight: 600 }}>
              ОПИСАНИЕ
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Краткое описание..."
              style={inputStyle}
            />
          </div>
        </div>
      </div>

      {/* Основная область */}
      <div style={{ display: 'flex', gap: 20, flex: 1, minHeight: 0 }}>
        {/* Категории */}
        <div style={{ ...cardStyle, width: 280, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: colors.textSecondary }}>
              КАТЕГОРИИ ({categories.length})
            </h3>
            <button onClick={addCategory} style={{ ...btnSecondary, padding: '6px 12px' }}>
              + Добавить
            </button>
          </div>

          <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {categories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => {
                  setSelectedCategoryId(category.id);
                  setSelectedQuestionId(null);
                }}
                style={{
                  padding: '14px 16px',
                  borderRadius: 12,
                  background: selectedCategoryId === category.id ? colors.accentMuted : 'transparent',
                  border: `1px solid ${selectedCategoryId === category.id ? colors.accent : colors.border}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={category.name}
                    onChange={(e) => updateCategoryName(category.id, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: colors.text,
                      fontWeight: 600,
                      fontSize: '0.95rem',
                      width: '100%',
                      outline: 'none'
                    }}
                  />
                  {categories.length > 1 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteCategory(category.id); }}
                      style={{ background: 'none', border: 'none', color: colors.incorrect, cursor: 'pointer', fontSize: '1rem' }}
                    >
                      ×
                    </button>
                  )}
                </div>
                <div style={{ fontSize: '0.75rem', color: colors.textMuted, marginTop: 4 }}>
                  {category.questions.length} вопросов
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Вопросы категории */}
        <div style={{ ...cardStyle, width: 320, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: colors.textSecondary }}>
              ВОПРОСЫ
            </h3>
            <button 
              onClick={addQuestion} 
              disabled={!selectedCategoryId}
              style={{ ...btnSecondary, padding: '6px 12px', opacity: selectedCategoryId ? 1 : 0.5 }}
            >
              + Добавить
            </button>
          </div>

          <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {selectedCategory?.questions.map((question, index) => (
              <motion.div
                key={question.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => setSelectedQuestionId(question.id)}
                style={{
                  padding: '12px 14px',
                  borderRadius: 10,
                  background: selectedQuestionId === question.id ? colors.accentMuted : colors.backgroundTertiary,
                  border: `1px solid ${selectedQuestionId === question.id ? colors.accent : 'transparent'}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ 
                      width: 28, 
                      height: 28, 
                      borderRadius: 8,
                      background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '0.85rem'
                    }}>
                      {index + 1}
                    </span>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 500, color: colors.text }}>
                        {question.answer || 'Без ответа'}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: colors.textMuted, display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                        <span>{questionTypes.find(t => t.type === question.type)?.icon}</span>
                        <span>{questionTypes.find(t => t.type === question.type)?.label}</span>
                        {question.audioPath && <span style={{ color: colors.correct }}>● Аудио</span>}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteQuestion(question.id); }}
                    style={{ background: 'none', border: 'none', color: colors.incorrect, cursor: 'pointer', fontSize: '1rem' }}
                  >
                    ×
                  </button>
                </div>
              </motion.div>
            ))}

            {selectedCategory && selectedCategory.questions.length === 0 && (
              <div style={{ textAlign: 'center', padding: 30, color: colors.textMuted }}>
                <div style={{ fontSize: '2rem', marginBottom: 10 }}>📝</div>
                <div>Нет вопросов</div>
                <div style={{ fontSize: '0.8rem', marginTop: 4 }}>Нажмите "Добавить"</div>
              </div>
            )}
          </div>
        </div>

        {/* Редактор вопроса */}
        <div style={{ ...cardStyle, flex: 1, display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ margin: 0, marginBottom: 20, fontSize: '0.9rem', fontWeight: 600, color: colors.textSecondary }}>
            РЕДАКТОР ВОПРОСА
          </h3>

          {selectedQuestion ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Тип вопроса */}
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontSize: '0.8rem', color: colors.textMuted, fontWeight: 600 }}>
                  ТИП ВОПРОСА
                </label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {questionTypes.map(qt => (
                    <button
                      key={qt.type}
                      onClick={() => updateQuestion(selectedQuestionId!, { type: qt.type })}
                      style={{
                        padding: '10px 16px',
                        borderRadius: 10,
                        border: `1px solid ${selectedQuestion.type === qt.type ? colors.accent : colors.border}`,
                        background: selectedQuestion.type === qt.type ? colors.accentMuted : 'transparent',
                        color: selectedQuestion.type === qt.type ? colors.accent : colors.text,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontWeight: 500,
                        fontSize: '0.85rem'
                      }}
                    >
                      <span>{qt.icon}</span>
                      {qt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ответ */}
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontSize: '0.8rem', color: colors.textMuted, fontWeight: 600 }}>
                  ПРАВИЛЬНЫЙ ОТВЕТ *
                </label>
                <input
                  type="text"
                  value={selectedQuestion.answer}
                  onChange={(e) => updateQuestion(selectedQuestionId!, { answer: e.target.value })}
                  placeholder="Исполнитель — Название песни"
                  style={inputStyle}
                />
              </div>

              {/* Аудио файл */}
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontSize: '0.8rem', color: colors.textMuted, fontWeight: 600 }}>
                  АУДИО ФАЙЛ
                </label>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    style={btnSecondary}
                  >
                    📁 Выбрать файл
                  </button>
                  {selectedQuestion.audioPath ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: colors.correct }}>
                      <span>✓ Файл загружен</span>
                      <button
                        onClick={() => updateQuestion(selectedQuestionId!, { audioPath: '' })}
                        style={{ background: 'none', border: 'none', color: colors.incorrect, cursor: 'pointer' }}
                      >
                        Удалить
                      </button>
                    </div>
                  ) : (
                    <span style={{ color: colors.textMuted, fontSize: '0.85rem' }}>Файл не выбран</span>
                  )}
                </div>
              </div>

              {/* Временной диапазон */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: '0.8rem', color: colors.textMuted, fontWeight: 600 }}>
                    НАЧАЛО (сек)
                  </label>
                  <input
                    type="number"
                    value={selectedQuestion.startTime}
                    onChange={(e) => updateQuestion(selectedQuestionId!, { startTime: Number(e.target.value) })}
                    min={0}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: '0.8rem', color: colors.textMuted, fontWeight: 600 }}>
                    КОНЕЦ (сек)
                  </label>
                  <input
                    type="number"
                    value={selectedQuestion.endTime}
                    onChange={(e) => updateQuestion(selectedQuestionId!, { endTime: Number(e.target.value) })}
                    min={0}
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Превью аудио */}
              {selectedQuestion.audioPath && (
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: '0.8rem', color: colors.textMuted, fontWeight: 600 }}>
                    ПРЕВЬЮ
                  </label>
                  <audio
                    src={selectedQuestion.audioPath}
                    controls
                    style={{ width: '100%', borderRadius: 8 }}
                  />
                </div>
              )}
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.textMuted }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: 16 }}>🎵</div>
                <div>Выберите вопрос для редактирования</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Кнопки действий */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
        <button onClick={onCancel} style={btnSecondary}>
          Отмена
        </button>
        <button onClick={handleSave} style={btnPrimary}>
          💾 Сохранить игру
        </button>
      </div>
    </div>
  );
};

export default GameEditor;
