import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { RaisedCard, useUITheme, IconSymbol } from '@mysuite/ui';

interface BurgerMenuProps {
    visible: boolean;
    onClose: () => void;
}

export function BurgerMenu({ visible, onClose }: BurgerMenuProps) {
    const router = useRouter();
    const theme = useUITheme();

    if (!visible) return null;

    return (
        <>
            <TouchableOpacity 
                activeOpacity={1} 
                onPress={onClose}
                className="absolute top-0 bottom-0 left-0 right-0 z-50 bg-black/20"
                testID="burger-menu-backdrop"
            />
            <RaisedCard
                className="absolute bottom-24 right-4 z-[60] w-52 p-2 bg-light dark:bg-dark-lighter origin-bottom-right rounded-xl"
                style={{ 
                    shadowColor: '#000', 
                    shadowOffset: { width: 0, height: 4 }, 
                    shadowOpacity: 0.15, 
                    shadowRadius: 12, 
                    elevation: 5 
                }}
                testID="burger-menu-content"
            >
                <TouchableOpacity
                    onPress={() => { onClose(); router.push('/progress-pictures' as any); }}
                    className="flex-row items-center p-3 rounded-lg active:bg-black/5 dark:active:bg-white/5"
                >
                    <IconSymbol name="camera.fill" size={20} color={theme.text} style={{ marginRight: 12 }} />
                    <Text className="text-light dark:text-dark font-medium">Progress Pictures</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => { onClose(); router.push('/settings' as any); }}
                    className="flex-row items-center p-3 rounded-lg active:bg-black/5 dark:active:bg-white/5"
                >
                    <IconSymbol name="gearshape.fill" size={20} color={theme.text} style={{ marginRight: 12 }} />
                    <Text className="text-light dark:text-dark font-medium">Settings</Text>
                </TouchableOpacity>
            </RaisedCard>
        </>
    );
}
export default BurgerMenu;
