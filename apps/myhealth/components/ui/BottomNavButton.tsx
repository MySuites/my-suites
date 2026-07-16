import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { IconSymbol, useUITheme } from '@mysuite/ui';

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
