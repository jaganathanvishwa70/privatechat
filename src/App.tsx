import { useState } from 'react';
import { PinScreen, isSessionUnlocked, lockSession } from '@/components/PinScreen';
import { ChatScreen } from '@/components/ChatScreen';

export default function App() {
  const [unlocked, setUnlocked] = useState(isSessionUnlocked());

  if (!unlocked) {
    return <PinScreen onUnlock={() => setUnlocked(true)} />;
  }

  return <ChatScreen onLock={() => { lockSession(); setUnlocked(false); }} />;
}
