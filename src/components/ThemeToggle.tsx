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
      className={`${compact ? 'w-9 h-9 btn-3d-secondary' : 'flex items-center gap-2 px-3 py-2 btn-3d-secondary'} rounded-xl text-slate-500 dark:text-slate-300 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 hover:from-emerald-50 hover:to-teal-50 dark:hover:from-slate-700 dark:hover:to-slate-800 ring-1 ring-slate-200/80 dark:ring-slate-700 transition`}
      title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      {!compact && <span className="text-xs font-medium">{darkMode ? 'Light mode' : 'Dark mode'}</span>}
    </button>
  );
}
