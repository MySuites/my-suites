import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { IconSymbol, useUITheme } from '@mysuite/ui';
import { findCurrentTab, isOnOwnDashboard } from '../../utils/navTabs';

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
