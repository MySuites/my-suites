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



export type { AppTheme } from './ThemeContext';
export { getAppTheme, UIThemeProvider, useUITheme } from './ThemeContext';
export { ThemedCard } from './examples/ThemedCard';
export { ThemeToggle } from './ThemeToggle';
export { IconSymbol } from './IconSymbol';
export { hslToHex } from './utils';