import React from 'react';
import { useRouter } from 'expo-router';
import { RaisedCard, useUITheme, IconSymbol } from '@mysuite/ui';

export function ProfileButton() {
    const router = useRouter();
    const theme = useUITheme();

    return (
        <RaisedCard 
            onPress={() => router.push('/profile')}
            style={{ borderRadius: 9999 }}
            className="w-12 h-12 p-0 my-0 rounded-full items-center justify-center"
        >
            <IconSymbol 
                name="person.fill" 
                size={24} 
                color={theme.primary} 
            />
        </RaisedCard>
    );
}
