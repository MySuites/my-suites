import React from 'react';
import { useRouter } from 'expo-router';
import { RaisedCard, useUITheme, IconSymbol } from '@mysuite/ui';

export function SettingsButton() {
    const router = useRouter();
    const theme = useUITheme();

    return (
        <RaisedCard 
            onPress={() => router.push('/settings')}
            style={{ borderRadius: 9999 }}
            className="w-12 h-12 p-0 my-0 rounded-full items-center justify-center"
        >
            <IconSymbol 
                name="gearshape.fill" 
                size={24} 
                color={theme.primary} 
            />
        </RaisedCard>
    );
}
