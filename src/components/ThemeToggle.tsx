import { Moon, Sun } from 'lucide-react';

interface ThemeToggleProps {
  darkMode: boolean;
  onToggle: () => void;
  compact?: boolean;
}

export function ThemeToggle({ darkMode, onToggle, compact = false }: ThemeToggleProps) {
  return (
    <button
      onClick={onToggle}
      className={`${compact ? 'w-9 h-9' : 'flex items-center gap-2 px-3 py-2'} rounded-xl text-slate-500 dark:text-slate-300 bg-white/70 dark:bg-slate-900/70 hover:bg-white dark:hover:bg-slate-800 ring-1 ring-slate-200/80 dark:ring-slate-700 transition shadow-sm`}
      title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      {!compact && <span className="text-xs font-medium">{darkMode ? 'Light mode' : 'Dark mode'}</span>}
    </button>
  );
}
