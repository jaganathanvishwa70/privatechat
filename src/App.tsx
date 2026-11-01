import { useEffect, useState } from 'react';
import { PinScreen, isSessionUnlocked, lockSession } from '@/components/PinScreen';
import { ChatScreen } from '@/components/ChatScreen';

const THEME_KEY = 'private-chat-theme';

export default function App() {
  const [unlocked, setUnlocked] = useState(isSessionUnlocked());
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem(THEME_KEY) === 'dark');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem(THEME_KEY, darkMode ? 'dark' : 'light');
  }, [darkMode]);

  if (!unlocked) {
    return (
      <PinScreen
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode((current) => !current)}
        onUnlock={() => setUnlocked(true)}
      />
    );
  }

  return (
    <ChatScreen
      darkMode={darkMode}
      onToggleDarkMode={() => setDarkMode((current) => !current)}
      onLock={() => { lockSession(); setUnlocked(false); }}
    />
  );
}
