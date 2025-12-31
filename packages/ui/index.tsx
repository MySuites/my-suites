import { Text, Pressable } from 'react-native';
import type { PressableProps } from 'react-native';
import { cssInterop } from 'nativewind';
import { useUITheme } from './theme';

// Enable className support for React Native components
cssInterop(Pressable, { className: 'style' });
cssInterop(Text, { className: 'style' });

export { RaisedButton } from './RaisedButton';
export { HollowedButton } from './HollowedButton';
export { RaisedCard } from './RaisedCard';
export { HollowedCard } from './HollowedCard';
export { ActionCard } from './ActionCard';
export { Skeleton } from './Skeleton';



export { UIThemeProvider, useUITheme } from './theme';
export { ThemedCard } from './examples/ThemedCard';