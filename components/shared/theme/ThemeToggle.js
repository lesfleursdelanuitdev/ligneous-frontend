'use client';

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
          // Sun icon
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        ) : (
          // Moon icon
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
            />
          </svg>
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
        <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}


