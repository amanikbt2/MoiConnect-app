import React, { createContext, useContext, useEffect, useState } from 'react';
import { getStoredToken, setStoredToken } from '../services/api';

const DARK_THEME_KEY = 'moi_dark_theme_enabled';

export interface AppThemeColors {
  background: string;
  header: string;
  surface: string;
  surfaceElevated: string;
  surfaceSubtle: string;
  text: string;
  mutedText: string;
  border: string;
  input: string;
}

const LIGHT_COLORS: AppThemeColors = {
  background: '#f8fafc',
  header: '#15803d',
  surface: '#ffffff',
  surfaceElevated: '#ffffff',
  surfaceSubtle: '#f8fafc',
  text: '#0f172a',
  mutedText: '#64748b',
  border: '#e2e8f0',
  input: '#ffffff'
};

const DARK_COLORS: AppThemeColors = {
  background: '#111821',
  header: '#192536',
  surface: '#202c3a',
  surfaceElevated: '#2a3849',
  surfaceSubtle: '#182331',
  text: '#f1f5f9',
  mutedText: '#a7b4c7',
  border: '#344456',
  input: '#182433'
};

interface ThemeContextValue {
  isDark: boolean;
  colors: AppThemeColors;
  setDarkTheme: (enabled: boolean) => Promise<void>;
  toggleDarkTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue>({
  isDark: false,
  colors: LIGHT_COLORS,
  setDarkTheme: async () => undefined,
  toggleDarkTheme: async () => undefined
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    getStoredToken(DARK_THEME_KEY)
      .then((value) => setIsDark(value === 'true'))
      .catch(() => setIsDark(false));
  }, []);

  const setDarkTheme = async (enabled: boolean) => {
    setIsDark(enabled);
    try {
      await setStoredToken(DARK_THEME_KEY, String(enabled));
    } catch (error) {
      console.warn('[Theme] Could not persist appearance preference:', error);
    }
  };

  const toggleDarkTheme = async () => setDarkTheme(!isDark);

  return <ThemeContext.Provider value={{ isDark, colors: isDark ? DARK_COLORS : LIGHT_COLORS, setDarkTheme, toggleDarkTheme }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
