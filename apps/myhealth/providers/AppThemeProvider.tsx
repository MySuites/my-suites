import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { useColorScheme as rnUseColorScheme, Animated, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UIThemeProvider, getAppTheme } from '@mysuite/ui';
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
  const { colorScheme: nwColorScheme, setColorScheme: setNWColorScheme } = useNativeWindColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');

  // Load preference on mount
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(THEME_PREF_KEY);
        if (stored === 'light' || stored === 'dark' || stored === 'system') {
          setPreferenceState(stored as ThemePreference);
          // Sync NativeWind to stored preference on load
          if (stored !== 'system') {
            setNWColorScheme(stored as 'light' | 'dark');
          }
        }
      } catch {
        // ignore
      }
    })();
  }, [setNWColorScheme]);

  // Use NativeWind's state as the source of truth for the rest of the app's context
  // This ensures that IF NativeWind takes a frame to update, the context matches that frame
  // No more staggered "flicker" between context-based and tailwind-based components.
  const effectiveScheme: 'light' | 'dark' = useMemo(() => {
    if (nwColorScheme) return nwColorScheme as 'light' | 'dark';
    return system === 'dark' ? 'dark' : 'light';
  }, [nwColorScheme, system]);

  const setPreference = async (p: ThemePreference) => {
    setPreferenceState(p);
    try {
      await AsyncStorage.setItem(THEME_PREF_KEY, p);
    } catch {
      // ignore
    }
    
    if (p === 'system') {
      setNWColorScheme('system');
    } else {
      setNWColorScheme(p);
    }
  };

  /* Animation Logic */
  const [transitioning, setTransitioning] = useState(false);
  const [prevScheme, setPrevScheme] = useState<'light' | 'dark'>(effectiveScheme);
  // Use useRef for Animated.Value to persist across renders without re-creation
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let isMounted = true;
    
    if (effectiveScheme !== prevScheme) {
      // 1. Theme changed. 
      // We are now rendering with NEW theme. 
      // Show overlay with PREV theme color immediately, then fade it out.
      setTransitioning(true);
      fadeAnim.setValue(1); // Opaque (showing prev theme)

      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300, // 0.2s
        useNativeDriver: true,
      }).start(() => {
        if (isMounted) {
            setTransitioning(false);
            setPrevScheme(effectiveScheme);
        }
      });
    } else {
        // Initial mount or no change, ensure sync
        if (isMounted) {
            setPrevScheme(effectiveScheme);
        }
    }
    
    return () => {
        isMounted = false;
    };
  }, [effectiveScheme, fadeAnim, prevScheme]);

  const theme = getAppTheme('myhealth', effectiveScheme);
  // Determine color of previous theme for overlay
  const prevThemeColor = getAppTheme('myhealth', prevScheme).bg;

  return (
    <ThemePreferenceContext.Provider value={{ preference, setPreference, effectiveScheme }}>
      <UIThemeProvider value={theme}>
        {children}
        {transitioning && (
          <Animated.View 
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill, 
              { 
                backgroundColor: prevThemeColor, 
                opacity: fadeAnim,
                zIndex: 9999 
              }
            ]} 
          />
        )}
      </UIThemeProvider>
    </ThemePreferenceContext.Provider>
  );
};

export const useThemePreference = () => {
  const ctx = useContext(ThemePreferenceContext);
  if (!ctx) throw new Error('useThemePreference must be used within AppThemeProvider');
  return ctx;
};

export default AppThemeProvider;
