'use client';

import { Sun, Moon, ChevronDown } from 'lucide-react';
import { useTheme } from './ThemeContext';

export function ThemeToggle({ className = '' }) {
  const { theme, setTheme, isDark } = useTheme();

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
        className="btn btn-ghost btn-square btn-sm"
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {isDark ? (
          <Sun size={20} className="shrink-0" />
        ) : (
          <Moon size={20} className="shrink-0" />
        )}
      </button>
    </div>
  );
}

// Dropdown variant with system option
export function ThemeDropdown({ className = '' }) {
  const { theme, setTheme } = useTheme();

  const options = [
    { value: 'light', label: 'Light', icon: '☀️' },
    { value: 'dark', label: 'Dark', icon: '🌙' },
    { value: 'system', label: 'System', icon: '💻' },
  ];

  return (
    <div className={`relative ${className}`}>
      <select
        value={theme}
        onChange={(e) => setTheme(e.target.value)}
        className="appearance-none px-4 py-2 pr-8 rounded-lg
                   bg-slate-100 dark:bg-slate-800
                   text-slate-700 dark:text-slate-200
                   border border-slate-200 dark:border-slate-700
                   hover:bg-slate-200 dark:hover:bg-slate-700
                   focus:outline-none focus:ring-2 focus:ring-primary
                   transition-colors duration-200
                   cursor-pointer text-sm"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.icon} {opt.label}
          </option>
        ))}
      </select>
      <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
        <ChevronDown size={16} className="text-slate-500 dark:text-slate-400 shrink-0" />
      </div>
    </div>
  );
}


