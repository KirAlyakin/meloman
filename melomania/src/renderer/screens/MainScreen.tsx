import React, { useState, useCallback } from 'react';
import { GameMode, ThemeId } from '../types/game';
import { getTheme } from '../themes';
import MainMenu from '../components/MainMenu';
import HostScreen from './HostScreen';
import { PubQuizModule } from '../components/pubquiz';

const MainScreen: React.FC = () => {
  const [currentMode, setCurrentMode] = useState<GameMode | null>(null);
  const [theme, setTheme] = useState<ThemeId>('winter');

  const handleSelectMode = (mode: GameMode) => {
    setCurrentMode(mode);
  };

  const handleBack = () => {
    setCurrentMode(null);
  };

  const handleSyncToPublic = useCallback((state: any) => {
    if (window.electronAPI) {
      window.electronAPI.syncState(state);
    }
  }, []);

  // Главное меню
  if (!currentMode) {
    return <MainMenu theme={theme} onSelectMode={handleSelectMode} />;
  }

  // Модуль "Своя игра"
  if (currentMode === 'jeopardy') {
    return <HostScreen />;
  }

  // Модуль "Паб-квиз"
  if (currentMode === 'pub-quiz') {
    return (
      <PubQuizModule 
        theme={theme} 
        onSetTheme={setTheme}
        onBack={handleBack} 
        onSyncToPublic={handleSyncToPublic}
      />
    );
  }

  return null;
};

export default MainScreen;
