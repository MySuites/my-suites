import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, usePathname } from 'expo-router';
import { IconSymbol, useUITheme } from '@mysuite/ui';
import { findCurrentTab, isOnOwnDashboard } from '../../utils/navTabs';

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

interface BottomNavButtonProps {
    icon: string;
    label: string;
    onPress: () => void;
    // Highlights the icon/label in the primary color instead of the muted color.
    active?: boolean;
    // Tab buttons (Exercises/History) render their label bold when active; the
    // Menu toggle keeps it semibold. Defaults to the tab behavior.
    boldWhenActive?: boolean;
}

// A single action in the BottomActionBar — the muted/primary icon-over-label
// button repeated across every dashboard screen. Mirrors DashboardButton.
export function BottomNavButton({
    icon,
    label,
    onPress,
    active = false,
    boldWhenActive = true,
}: BottomNavButtonProps) {
    const theme = useUITheme();
    const color = active ? theme.primary : theme.textMuted;

    return (
        <TouchableOpacity
            onPress={onPress}
            className="items-center justify-center"
            style={{ gap: 2 }}
        >
            <IconSymbol name={icon as any} size={22} color={color} />
            <Text style={{ fontSize: 10, fontWeight: active && boldWhenActive ? '700' : '600', color }}>
                {label}
            </Text>
        </TouchableOpacity>
    );
}

interface DashboardButtonProps {
    // Suppress the active highlight when some other bottom-bar icon (e.g. the
    // burger menu) is the one currently "selected".
    dimmed?: boolean;
}

// Each screen's own "dashboard" — points at itself (Workout's button stays on
// Workout, Sleep's stays on Sleep, etc.), not a shared Profile destination.
// Only highlighted while actually on that dashboard screen, not a sub-route
// of it (e.g. Workout History).
export function DashboardButton({ dimmed }: DashboardButtonProps) {
    const router = useRouter();
    const pathname = usePathname();
    const theme = useUITheme();

    const currentTab = findCurrentTab(pathname);
    const isActive = isOnOwnDashboard(pathname);
    const color = dimmed || !isActive ? theme.textMuted : theme.primary;

    return (
        <TouchableOpacity
            onPress={() => router.navigate(currentTab.href as any)}
            className="items-center justify-center"
            style={{ gap: 2 }}
        >
            <IconSymbol name="house.fill" size={20} color={color} />
            <Text style={{ fontSize: 10, fontWeight: '700', color }}>
                Dashboard
            </Text>
        </TouchableOpacity>
    );
}
