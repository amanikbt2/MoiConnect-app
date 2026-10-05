import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { KenyanUniversity } from '../data/kenyanUniversities';

const UNIVERSITY_KEY = 'moiconnect_selected_university_v1';

type UniversityContextValue = {
  selectedUniversity: KenyanUniversity | null;
  ready: boolean;
  selectUniversity: (university: KenyanUniversity) => Promise<void>;
};

const UniversityContext = createContext<UniversityContextValue | undefined>(undefined);

const readLocal = async (): Promise<string | null> => {
  if (Platform.OS === 'web') return typeof localStorage === 'undefined' ? null : localStorage.getItem(UNIVERSITY_KEY);
  return SecureStore.getItemAsync(UNIVERSITY_KEY);
};

const writeLocal = async (value: string): Promise<void> => {
  if (Platform.OS === 'web') {
    localStorage.setItem(UNIVERSITY_KEY, value);
    return;
  }
  await SecureStore.setItemAsync(UNIVERSITY_KEY, value);
};

export function UniversityProvider({ children }: { children: React.ReactNode }) {
  const [selectedUniversity, setSelectedUniversity] = useState<KenyanUniversity | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    readLocal().then((raw) => {
      if (raw) {
        try { setSelectedUniversity(JSON.parse(raw)); } catch { /* fresh setup */ }
      }
      setReady(true);
    }).catch(() => setReady(true));
  }, []);

  const value = useMemo(() => ({
    selectedUniversity,
    ready,
    selectUniversity: async (university: KenyanUniversity) => {
      await writeLocal(JSON.stringify(university));
      setSelectedUniversity(university);
    }
  }), [selectedUniversity, ready]);

  return <UniversityContext.Provider value={value}>{children}</UniversityContext.Provider>;
}

export const useUniversity = (): UniversityContextValue => {
  const context = useContext(UniversityContext);
  if (!context) throw new Error('useUniversity must be used inside UniversityProvider');
  return context;
};
