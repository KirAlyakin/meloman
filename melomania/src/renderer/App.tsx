import React from 'react';
import MainScreen from './screens/MainScreen';
import PublicScreen from './screens/PublicScreen';

const App: React.FC = () => {
  const params = new URLSearchParams(window.location.search);
  const mode = params.get('mode');
  
  return mode === 'public' ? <PublicScreen /> : <MainScreen />;
};

export default App;
