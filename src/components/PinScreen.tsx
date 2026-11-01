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
    <div className="relative min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-slate-100 via-white to-emerald-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950/40 transition-colors">
      <div className="absolute top-4 right-4">
        <ThemeToggle darkMode={darkMode} onToggle={onToggleDarkMode} />
      </div>
      <div className="w-full max-w-xs flex flex-col items-center">
        <div className="scene-3d mb-4">
          <div className="logo-3d w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
            <MessageSquare className="w-8 h-8 text-white" strokeWidth={2.2} />
          </div>
        </div>
        <h1 className="text-xl font-semibold text-slate-800 dark:text-white tracking-tight">Private Chat</h1>
        <p className="text-sm text-slate-400 mt-1 mb-7 flex items-center gap-1.5">
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
              className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
                error
                  ? 'border-rose-400 bg-rose-400'
                  : i < pin.length
                    ? 'border-emerald-500 bg-emerald-500 scale-110'
                    : 'border-slate-300 bg-transparent'
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="text-xs text-rose-500 mb-4 font-medium">Incorrect PIN. Try again.</p>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
            <button
              key={d}
              onClick={() => press(d)}
              disabled={error}
              className="w-16 h-16 text-xl font-medium text-slate-700 dark:text-slate-100 bg-white dark:bg-slate-800 rounded-2xl shadow-sm ring-1 ring-slate-200 dark:ring-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95 transition disabled:opacity-50"
            >
              {d}
            </button>
          ))}
          <div className="w-16 h-16" />
          <button
            onClick={() => press('0')}
            disabled={error}
            className="w-16 h-16 text-xl font-medium text-slate-700 dark:text-slate-100 bg-white dark:bg-slate-800 rounded-2xl shadow-sm ring-1 ring-slate-200 dark:ring-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95 transition disabled:opacity-50"
          >
            0
          </button>
          <button
            onClick={backspace}
            disabled={error || pin.length === 0}
            className="w-16 h-16 text-slate-500 dark:text-slate-300 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition flex items-center justify-center disabled:opacity-40"
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
