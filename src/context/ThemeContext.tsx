import React, { createContext, useContext, useEffect, useState } from 'react';
import { getStoredToken, setStoredToken } from '../services/api';

const DARK_THEME_KEY = 'moi_dark_theme_enabled';

interface ThemeContextValue {
  isDark: boolean;
  setDarkTheme: (enabled: boolean) => Promise<void>;
  toggleDarkTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue>({
  isDark: false,
  setDarkTheme: async () => undefined,
  toggleDarkTheme: async () => undefined
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    getStoredToken(DARK_THEME_KEY).then((value) => setIsDark(value === 'true'));
  }, []);

  const setDarkTheme = async (enabled: boolean) => {
    setIsDark(enabled);
    await setStoredToken(DARK_THEME_KEY, String(enabled));
  };

  const toggleDarkTheme = async () => setDarkTheme(!isDark);

  return <ThemeContext.Provider value={{ isDark, setDarkTheme, toggleDarkTheme }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
