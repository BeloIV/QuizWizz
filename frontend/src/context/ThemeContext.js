import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const THEME_KEY = 'quizwizz:theme';

const ThemeContext = createContext({
  theme: 'dark',
  toggleTheme: () => {},
});

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') {
      return 'dark';
    }
    try {
      return localStorage.getItem(THEME_KEY) || 'dark';
    } catch (error) {
      console.warn('Failed to load theme preference', error);
      return 'dark';
    }
  });

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.classList.toggle('light', theme === 'light');
    }
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (error) {
      console.warn('Failed to persist theme preference', error);
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
