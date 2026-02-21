import { Text, Pressable } from 'react-native';
import type { PressableProps } from 'react-native';
import { cssInterop } from 'nativewind';
import { createContext, useContext } from 'react';

// Enable className support for React Native components
cssInterop(Pressable, { className: 'style' });
cssInterop(Text, { className: 'style' });

export * from './RaisedCard';

export { RaisedCard } from './RaisedCard';
export { HollowedCard } from './HollowedCard';
export { ActionCard } from './ActionCard';
export { Skeleton } from './Skeleton';
export { ToastProvider, useToast } from './Toast';



export type AppTheme = {
  primary: string;
  primaryMuted?: string;
  accent: string;
  bgLight: string;
  bg?: string;
  bgDark?: string;
  text: string;
  textMuted?: string;
  icon?: string;
  tabIconDefault?: string;
  tabIconSelected?: string;
  error?: string;
  placeholder?: string;
  highlight?: string;
  [k: string]: any;
};

// @ts-ignore
const { baseColors, appThemes } = require('./colors');

export const getAppTheme = (appId: keyof typeof appThemes, scheme: 'light' | 'dark' = 'light'): AppTheme => {
  const base = baseColors[scheme];
  const brand = appThemes[appId][scheme];
  
  return {
    ...base,
    primary: brand.primary,
    primaryMuted: brand.primaryMuted,
    accent: brand.accent,
    tabIconSelected: brand.primary,
    highlight: base.highlight,
    dark: scheme === 'dark',
  };
};

const ThemeContext = createContext<AppTheme | null>(null);

export const UIThemeProvider = ({ value, children }: { value: AppTheme; children: React.ReactNode }) => {
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useUITheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return getAppTheme('myhealth', 'light');
  }
  return ctx;
};
export { ThemedCard } from './examples/ThemedCard';
export { ThemeToggle } from './ThemeToggle';
export { IconSymbol } from './IconSymbol';
export { hslToHex } from './utils';