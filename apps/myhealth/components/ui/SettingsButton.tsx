import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useUITheme, IconSymbol } from '@mysuite/ui';

export function SettingsButton() {
    const router = useRouter();
    const theme = useUITheme();

    return (
        <TouchableOpacity
            onPress={() => router.push('/settings')}
            className="items-center justify-center"
            style={{ gap: 2 }}
        >
            <IconSymbol
                name="gearshape.fill"
                size={22}
                color={theme.textMuted}
            />
            <Text style={{ fontSize: 10, fontWeight: '600', color: theme.textMuted }}>
                Settings
            </Text>
        </TouchableOpacity>
    );
}
