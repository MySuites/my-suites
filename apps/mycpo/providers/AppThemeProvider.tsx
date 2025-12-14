import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme as rnUseColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Colors } from '../constants/theme';
import { UIThemeProvider } from '@mycsuite/ui';
import { useColorScheme as useNativeWindColorScheme } from 'nativewind';

const THEME_PREF_KEY = 'theme-preference';

export type ThemePreference = 'light' | 'dark' | 'system';

type ThemePreferenceContextValue = {
  preference: ThemePreference;
  setPreference: (p: ThemePreference) => Promise<void>;
  effectiveScheme: 'light' | 'dark';
};

export const ThemePreferenceContext = createContext<ThemePreferenceContextValue | undefined>(undefined);

export const AppThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const system = rnUseColorScheme();
  const { setColorScheme } = useNativeWindColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');

  useEffect(() => {
    (async () => {
      try {
        const stored = await SecureStore.getItemAsync(THEME_PREF_KEY);
        if (stored === 'light' || stored === 'dark' || stored === 'system') {
          setPreferenceState(stored);
        }
      } catch {
        // ignore
      }
    })();
  }, []);

  const effectiveScheme: 'light' | 'dark' = preference === 'system' ? (system === 'dark' ? 'dark' : 'light') : preference;

  // Sync with NativeWind
  useEffect(() => {
    setColorScheme(effectiveScheme);
  }, [effectiveScheme, setColorScheme]);

  const setPreference = async (p: ThemePreference) => {
    try {
      await SecureStore.setItemAsync(THEME_PREF_KEY, p);
    } catch {
      // ignore
    }
    setPreferenceState(p);
  };

  const theme = effectiveScheme === 'dark' ? Colors.dark : Colors.light;

  return (
    <ThemePreferenceContext.Provider value={{ preference, setPreference, effectiveScheme }}>
      <UIThemeProvider value={theme}>{children}</UIThemeProvider>
    </ThemePreferenceContext.Provider>
  );
};

export const useThemePreference = () => {
  const ctx = useContext(ThemePreferenceContext);
  if (!ctx) throw new Error('useThemePreference must be used within AppThemeProvider');
  return ctx;
};

export default AppThemeProvider;
