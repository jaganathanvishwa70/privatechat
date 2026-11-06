import { useEffect, useRef, useState } from 'react';
import { MessageSquare, Delete, Lock } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

const CORRECT_PIN = '2727';
const STORAGE_KEY = 'pin_unlocked_session';

interface PinScreenProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onUnlock: () => void;
}

export function PinScreen({ darkMode, onToggleDarkMode, onUnlock }: PinScreenProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function check(value: string) {
    if (value.length === 4) {
      if (value === CORRECT_PIN) {
        sessionStorage.setItem(STORAGE_KEY, '1');
        onUnlock();
      } else {
        setError(true);
        setTimeout(() => {
          setPin('');
          setError(false);
          inputRef.current?.focus();
        }, 600);
      }
    }
  }

  function press(digit: string) {
    if (error || pin.length >= 4) return;
    const next = pin + digit;
    setPin(next);
    check(next);
  }

  function backspace() {
    if (error) return;
    setPin((p) => p.slice(0, -1));
  }

  function onKey(e: React.KeyboardEvent) {
    e.preventDefault();
    if (/^[0-9]$/.test(e.key)) press(e.key);
    else if (e.key === 'Backspace') backspace();
    else if (e.key === 'Enter' && pin.length === 4) check(pin);
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden bg-gradient-to-br from-slate-100 via-teal-50 to-cyan-50 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950/50 transition-colors">
      {/* Decorative gradient orbs */}
      <div className="absolute top-10 left-10 w-48 h-48 rounded-full bg-gradient-to-br from-emerald-300/30 to-teal-300/20 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-56 h-56 rounded-full bg-gradient-to-br from-cyan-300/25 to-blue-300/15 blur-3xl pointer-events-none" />

      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle darkMode={darkMode} onToggle={onToggleDarkMode} />
      </div>
      <div className="w-full max-w-xs flex flex-col items-center relative z-[1]">
        <div className="scene-3d mb-5">
          <div className="logo-3d animated-gradient w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <MessageSquare className="w-10 h-10 text-white" strokeWidth={2.2} />
          </div>
        </div>
        <h1 className="text-2xl font-bold gradient-text tracking-tight">Private Chat</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 mb-7 flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5" /> Enter your 4-digit PIN
        </p>

        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          value={pin}
          onChange={() => {}}
          onKeyDown={onKey}
          className="opacity-0 absolute -z-10 w-px h-px"
          autoComplete="off"
        />

        {/* Dots */}
        <div
          className={`flex gap-3.5 mb-8 ${error ? 'animate-shake' : ''}`}
        >
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                error
                  ? 'border-rose-400 bg-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.5)]'
                  : i < pin.length
                    ? 'border-emerald-500 bg-emerald-500 scale-110 shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                    : 'border-slate-300 dark:border-slate-600 bg-transparent'
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="text-xs text-rose-500 mb-4 font-medium">Incorrect PIN. Try again.</p>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3.5">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
            <button
              key={d}
              onClick={() => press(d)}
              disabled={error}
              className="keypad-3d w-16 h-16 text-xl font-semibold text-slate-700 dark:text-slate-100 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 rounded-2xl ring-1 ring-slate-200 dark:ring-slate-700 hover:from-emerald-50 hover:to-teal-50 dark:hover:from-slate-700 dark:hover:to-slate-800 active:scale-95 transition disabled:opacity-50"
            >
              {d}
            </button>
          ))}
          <div className="w-16 h-16" />
          <button
            onClick={() => press('0')}
            disabled={error}
            className="keypad-3d w-16 h-16 text-xl font-semibold text-slate-700 dark:text-slate-100 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 rounded-2xl ring-1 ring-slate-200 dark:ring-slate-700 hover:from-emerald-50 hover:to-teal-50 dark:hover:from-slate-700 dark:hover:to-slate-800 active:scale-95 transition disabled:opacity-50"
          >
            0
          </button>
          <button
            onClick={backspace}
            disabled={error || pin.length === 0}
            className="keypad-3d w-16 h-16 text-slate-500 dark:text-slate-300 rounded-2xl hover:bg-rose-50 dark:hover:bg-slate-800 active:scale-95 transition flex items-center justify-center disabled:opacity-40"
          >
            <Delete className="w-6 h-6" />
          </button>
        </div>

        <p className="text-[11px] text-slate-300 mt-8">Enter PIN to access your messages</p>
      </div>
    </div>
  );
}

export function isSessionUnlocked(): boolean {
  return sessionStorage.getItem(STORAGE_KEY) === '1';
}

export function lockSession(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}
