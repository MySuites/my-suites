import { createContext, useContext } from 'react';

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
  highlight?: string;
  [k: string]: any;
};

// @ts-ignore
const { baseColors, appThemes } = require('./colors');

// getAppTheme combines shared base colors with app-specific brand colors
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
  };
};

const ThemeContext = createContext<AppTheme | null>(null);

export const UIThemeProvider = ({ value, children }: { value: AppTheme; children: React.ReactNode }) => {
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useUITheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    // Return a default fallback if not wrapped, but usually apps provide their own
    return getAppTheme('myhealth', 'light');
  }
  return ctx;
};

export default ThemeContext;
