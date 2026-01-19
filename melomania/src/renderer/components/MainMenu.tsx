import React from 'react';
import { motion } from 'framer-motion';
import { GameMode, ThemeId } from '../types/game';
import { getTheme } from '../themes';

interface MainMenuProps {
  theme: ThemeId;
  onSelectMode: (mode: GameMode) => void;
  onOpenSettings?: () => void;
}

const MainMenu: React.FC<MainMenuProps> = ({ theme, onSelectMode, onOpenSettings }) => {
  const colors = getTheme(theme).colors;

  const modules = [
    {
      id: 'jeopardy' as GameMode,
      title: 'Своя игра',
      subtitle: 'Музыкальная викторина',
      icon: '🎵',
      description: 'Угадай мелодию в формате "Своя игра". Категории, ставки, аукционы, кот в мешке.',
      gradient: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
      features: ['5 типов вопросов', 'До 12 команд', 'Кнопки на столах']
    },
    {
      id: 'pub-quiz' as GameMode,
      title: 'Паб-квиз',
      subtitle: 'Классический квиз',
      icon: '🍺',
      description: 'Раунды с разными типами вопросов. Бланки ответов, таймер, автопроверка через OCR.',
      gradient: 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
      features: ['Текст, музыка, картинки', 'Бланки + OCR', 'Гибкие очки']
    }
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: colors.background,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 40
    }}>
      {/* Логотип */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ textAlign: 'center', marginBottom: 60 }}
      >
        <div style={{
          width: 80,
          height: 80,
          borderRadius: 24,
          background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
          boxShadow: '0 10px 40px rgba(59, 130, 246, 0.3)'
        }}>
          <span style={{ fontSize: '2.5rem' }}>🎮</span>
        </div>
        <h1 style={{
          fontSize: '3rem',
          fontWeight: 800,
          background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          margin: 0,
          letterSpacing: '-1px'
        }}>
          МелоМания
        </h1>
        <p style={{ color: colors.textMuted, fontSize: '1.1rem', marginTop: 8 }}>
          Выберите формат игры
        </p>
      </motion.div>

      {/* Карточки модулей */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 24,
        maxWidth: 900,
        width: '100%'
      }}>
        {modules.map((module, index) => (
          <motion.button
            key={module.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 + 0.2 }}
            whileHover={{ scale: 1.02, y: -5 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelectMode(module.id)}
            style={{
              background: colors.backgroundSecondary,
              backdropFilter: 'blur(20px)',
              border: `1px solid ${colors.border}`,
              borderRadius: 24,
              padding: 32,
              textAlign: 'left',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.3s ease'
            }}
          >
            {/* Градиентная полоса сверху */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 4,
              background: module.gradient
            }} />

            {/* Иконка */}
            <div style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: module.gradient,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20,
              boxShadow: `0 8px 25px ${module.id === 'jeopardy' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
            }}>
              <span style={{ fontSize: '2rem' }}>{module.icon}</span>
            </div>

            {/* Заголовок */}
            <h2 style={{
              margin: 0,
              fontSize: '1.5rem',
              fontWeight: 700,
              color: colors.text,
              marginBottom: 4
            }}>
              {module.title}
            </h2>
            <p style={{
              margin: 0,
              fontSize: '0.9rem',
              color: colors.accent,
              fontWeight: 500,
              marginBottom: 12
            }}>
              {module.subtitle}
            </p>

            {/* Описание */}
            <p style={{
              margin: 0,
              fontSize: '0.9rem',
              color: colors.textSecondary,
              lineHeight: 1.5,
              marginBottom: 20
            }}>
              {module.description}
            </p>

            {/* Фичи */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {module.features.map((feature, i) => (
                <span
                  key={i}
                  style={{
                    padding: '6px 12px',
                    background: colors.backgroundTertiary,
                    borderRadius: 8,
                    fontSize: '0.75rem',
                    color: colors.textMuted,
                    fontWeight: 500
                  }}
                >
                  {feature}
                </span>
              ))}
            </div>

            {/* Стрелка */}
            <div style={{
              position: 'absolute',
              bottom: 24,
              right: 24,
              width: 40,
              height: 40,
              borderRadius: 12,
              background: colors.backgroundTertiary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: colors.textMuted,
              fontSize: '1.2rem'
            }}>
              →
            </div>
          </motion.button>
        ))}
      </div>

      {/* Версия и настройки */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        style={{
          marginTop: 40,
          display: 'flex',
          alignItems: 'center',
          gap: 20
        }}
      >
        <span style={{ color: colors.textMuted, fontSize: '0.85rem' }}>
          v2.5.0
        </span>
        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            style={{
              padding: '8px 16px',
              background: colors.backgroundTertiary,
              border: `1px solid ${colors.border}`,
              borderRadius: 10,
              color: colors.textSecondary,
              cursor: 'pointer',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            ⚙️ Настройки
          </button>
        )}
      </motion.div>
    </div>
  );
};

export default MainMenu;
