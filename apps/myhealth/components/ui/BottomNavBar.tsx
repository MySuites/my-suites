import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Height of the bar's own content row, not counting the device's bottom
// safe-area inset (added separately as padding).
export const BOTTOM_ACTION_BAR_HEIGHT = 40;

interface BottomActionBarProps {
  children: React.ReactNode;
}

// Per-screen contextual actions (settings, history, etc.) that used to live
// in the top header now render here — the top banner is reserved for
// switching between the 5 main screens.
export function BottomActionBar({ children }: BottomActionBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="absolute bottom-0 left-0 right-0 rounded-t-3xl overflow-hidden bg-light dark:bg-dark border-t border-black/10 dark:border-white/10"
      style={{ paddingBottom: Math.min(insets.bottom, 24), zIndex: 100 }}
    >
      <View
        className="flex-row justify-around items-center px-2"
        style={{ minHeight: BOTTOM_ACTION_BAR_HEIGHT, paddingTop: 14, paddingBottom: 4 }}
      >
        {children}
      </View>
    </View>
  );
}
