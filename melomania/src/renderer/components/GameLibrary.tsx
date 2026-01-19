import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { JeopardyGame } from '../types/game';

interface GameLibraryProps {
  onSelectGame: (game: JeopardyGame) => void;
  onEditGame: (game: JeopardyGame) => void;
  onCreateNew: () => void;
  colors: any;
}

const STORAGE_KEY = 'melomania_games';

export const saveGame = (game: JeopardyGame) => {
  const games = loadGames();
  const index = games.findIndex(g => g.id === game.id);
  if (index >= 0) {
    games[index] = game;
  } else {
    games.push(game);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
};

export const loadGames = (): JeopardyGame[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const deleteGame = (id: string) => {
  const games = loadGames().filter(g => g.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
};

export const exportGame = (game: JeopardyGame) => {
  const blob = new Blob([JSON.stringify(game, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${game.name.replace(/[^a-zA-Zа-яА-Я0-9]/g, '_')}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

const GameLibrary: React.FC<GameLibraryProps> = ({ onSelectGame, onEditGame, onCreateNew, colors }) => {
  const [games, setGames] = useState<JeopardyGame[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    setGames(loadGames());
  }, []);

  const handleDelete = (id: string) => {
    deleteGame(id);
    setGames(loadGames());
    setDeleteConfirm(null);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const game = JSON.parse(event.target?.result as string) as JeopardyGame;
        if (game.name && game.categories) {
          game.id = crypto.randomUUID();
          game.updatedAt = new Date().toISOString();
          if (!game.mode) game.mode = 'jeopardy';
          saveGame(game);
          setGames(loadGames());
        } else {
          alert('Неверный формат файла');
        }
      } catch {
        alert('Ошибка чтения файла');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const filteredGames = games.filter(g => 
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const cardStyle: React.CSSProperties = {
    background: colors.backgroundSecondary,
    backdropFilter: 'blur(20px)',
    borderRadius: 16,
    border: `1px solid ${colors.border}`,
    padding: 20,
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  };

  const btnPrimary: React.CSSProperties = {
    padding: '12px 24px',
    borderRadius: 12,
    border: 'none',
    background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
    color: '#fff',
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: '0.9rem',
    boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)'
  };

  const btnSecondary: React.CSSProperties = {
    padding: '8px 14px',
    borderRadius: 8,
    border: `1px solid ${colors.border}`,
    background: colors.backgroundTertiary,
    color: colors.text,
    fontWeight: 500,
    cursor: 'pointer',
    fontSize: '0.8rem'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Заголовок и действия */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>Библиотека игр</h2>
          <p style={{ margin: 0, marginTop: 4, color: colors.textMuted, fontSize: '0.9rem' }}>
            {games.length} {games.length === 1 ? 'игра' : games.length < 5 ? 'игры' : 'игр'}
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: 12 }}>
          <label style={{ ...btnSecondary, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            📥 Импорт
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              style={{ display: 'none' }}
            />
          </label>
          <button onClick={onCreateNew} style={btnPrimary}>
            ✨ Создать игру
          </button>
        </div>
      </div>

      {/* Поиск */}
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="🔍 Поиск игр..."
          style={{
            width: '100%',
            padding: '14px 20px',
            paddingLeft: 20,
            borderRadius: 12,
            border: `1px solid ${colors.border}`,
            background: colors.backgroundSecondary,
            color: colors.text,
            fontSize: '0.95rem',
            outline: 'none'
          }}
        />
      </div>

      {/* Сетка игр */}
      {filteredGames.length > 0 ? (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
          gap: 20 
        }}>
          <AnimatePresence>
            {filteredGames.map((game) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                whileHover={{ y: -4, boxShadow: `0 20px 40px ${colors.shadow}` }}
                style={cardStyle}
                onClick={() => onSelectGame(game)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ 
                    width: 48, 
                    height: 48, 
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem'
                  }}>
                    🎵
                  </div>
                  
                  <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => onEditGame(game)}
                      style={{ ...btnSecondary, padding: '6px 10px' }}
                      title="Редактировать"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => exportGame(game)}
                      style={{ ...btnSecondary, padding: '6px 10px' }}
                      title="Экспорт"
                    >
                      📤
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(game.id)}
                      style={{ ...btnSecondary, padding: '6px 10px', borderColor: colors.incorrect }}
                      title="Удалить"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, marginBottom: 6 }}>
                  {game.name}
                </h3>
                
                {game.description && (
                  <p style={{ margin: 0, color: colors.textSecondary, fontSize: '0.85rem', marginBottom: 12 }}>
                    {game.description}
                  </p>
                )}

                <div style={{ display: 'flex', gap: 16, fontSize: '0.8rem', color: colors.textMuted }}>
                  <span>📁 {game.categories.length} категорий</span>
                  <span>❓ {game.categories.reduce((sum, c) => sum + c.questions.length, 0)} вопросов</span>
                </div>

                <div style={{ 
                  marginTop: 12, 
                  paddingTop: 12, 
                  borderTop: `1px solid ${colors.border}`,
                  fontSize: '0.75rem',
                  color: colors.textMuted 
                }}>
                  Обновлено: {new Date(game.updatedAt).toLocaleDateString('ru-RU')}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div style={{ 
          textAlign: 'center', 
          padding: 60, 
          background: colors.backgroundSecondary,
          borderRadius: 20,
          border: `1px dashed ${colors.border}`
        }}>
          <div style={{ fontSize: '4rem', marginBottom: 16 }}>🎵</div>
          <h3 style={{ margin: 0, marginBottom: 8, color: colors.text }}>
            {searchQuery ? 'Игры не найдены' : 'Нет сохранённых игр'}
          </h3>
          <p style={{ margin: 0, color: colors.textMuted, marginBottom: 20 }}>
            {searchQuery ? 'Попробуйте изменить запрос' : 'Создайте свою первую музыкальную викторину!'}
          </p>
          {!searchQuery && (
            <button onClick={onCreateNew} style={btnPrimary}>
              ✨ Создать игру
            </button>
          )}
        </div>
      )}

      {/* Модалка подтверждения удаления */}
      <AnimatePresence>
        {deleteConfirm && (
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
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000
            }}
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{
                background: colors.background,
                borderRadius: 20,
                padding: 32,
                maxWidth: 400,
                textAlign: 'center',
                boxShadow: `0 20px 60px ${colors.shadow}`
              }}
            >
              <div style={{ fontSize: '3rem', marginBottom: 16 }}>⚠️</div>
              <h3 style={{ margin: 0, marginBottom: 8 }}>Удалить игру?</h3>
              <p style={{ margin: 0, color: colors.textMuted, marginBottom: 24 }}>
                Это действие нельзя отменить
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button onClick={() => setDeleteConfirm(null)} style={btnSecondary}>
                  Отмена
                </button>
                <button 
                  onClick={() => handleDelete(deleteConfirm)} 
                  style={{ ...btnSecondary, background: colors.incorrect, color: '#fff', borderColor: colors.incorrect }}
                >
                  Удалить
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GameLibrary;
