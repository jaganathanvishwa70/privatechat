import { useEffect, useState } from 'react';
import { PinScreen, isSessionUnlocked, lockSession } from '@/components/PinScreen';
import { ChatScreen } from '@/components/ChatScreen';
import { SetupError } from '@/components/SetupError';

const THEME_KEY = 'private-chat-theme';

const missingVars = [
  !import.meta.env.VITE_SUPABASE_URL && 'VITE_SUPABASE_URL',
  !import.meta.env.VITE_SUPABASE_ANON_KEY && 'VITE_SUPABASE_ANON_KEY',
].filter(Boolean) as string[];

export default function App() {
  const [unlocked, setUnlocked] = useState(isSessionUnlocked());
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem(THEME_KEY) === 'dark');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem(THEME_KEY, darkMode ? 'dark' : 'light');
  }, [darkMode]);

  if (missingVars.length > 0) {
    return <SetupError missingVars={missingVars} />;
  }

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
