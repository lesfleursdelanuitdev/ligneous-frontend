'use client';

import { createContext, useContext, useEffect, useState, useMemo, useCallback, useSyncExternalStore } from 'react';

const ThemeContext = createContext(undefined);

const THEME_KEY = 'ligneous-theme';

// Get system preference
const getSystemTheme = () => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

// Get stored theme from localStorage
const getStoredTheme = () => {
  if (typeof window === 'undefined') return 'system';
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored && ['light', 'dark', 'system'].includes(stored)) {
      return stored;
    }
  } catch {
    // localStorage might not be available
  }
  return 'system';
};

// Subscribe to storage changes
const subscribeToStorage = (callback) => {
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
};

// Server snapshot
const getServerSnapshot = () => 'system';

export function ThemeProvider({ children }) {
  // Use useSyncExternalStore for hydration-safe localStorage reading
  const storedTheme = useSyncExternalStore(
    subscribeToStorage,
    getStoredTheme,
    getServerSnapshot
  );

  const [theme, setThemeState] = useState(storedTheme);
  const [systemTheme, setSystemTheme] = useState('light');

  // Compute resolved theme
  const resolvedTheme = useMemo(() => {
    return theme === 'system' ? systemTheme : theme;
  }, [theme, systemTheme]);

  // Sync storedTheme to state on client
  useEffect(() => {
    setThemeState(storedTheme);
  }, [storedTheme]);

  // Get initial system theme on mount
  useEffect(() => {
    setSystemTheme(getSystemTheme());
  }, []);

  // Apply theme to document (Tailwind class + DaisyUI data-theme)
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(resolvedTheme);
    root.setAttribute('data-theme', resolvedTheme === 'dark' ? 'dark' : 'light');

    // Update meta theme-color for mobile browsers
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', resolvedTheme === 'dark' ? '#0f172a' : '#ffffff');
    }
  }, [resolvedTheme]);

  // Listen for system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Save theme preference
  const setTheme = useCallback((newTheme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(THEME_KEY, newTheme);
    } catch {
      // localStorage might not be available
    }
  }, []);

  // Toggle between light and dark
  const toggleTheme = useCallback(() => {
    const newTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  }, [resolvedTheme, setTheme]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        resolvedTheme,
        setTheme,
        toggleTheme,
        isDark: resolvedTheme === 'dark',
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
