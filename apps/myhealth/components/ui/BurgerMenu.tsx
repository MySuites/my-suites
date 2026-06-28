import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { RaisedCard, useUITheme, IconSymbol } from '@mysuite/ui';

interface BurgerMenuProps {
    visible: boolean;
    onClose: () => void;
    onStartEmpty?: () => void;
}

export function BurgerMenu({ visible, onClose, onStartEmpty }: BurgerMenuProps) {
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
                className="absolute top-28 right-4 z-[60] w-52 p-2 bg-light dark:bg-dark-lighter origin-top-right rounded-xl"
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
                    onPress={() => { onClose(); router.push('/exercises' as any); }}
                    className="flex-row items-center p-3 rounded-lg active:bg-black/5 dark:active:bg-white/5"
                >
                    <IconSymbol name="dumbbell.fill" size={20} color={theme.text} style={{ marginRight: 12 }} />
                    <Text className="text-light dark:text-dark font-medium">Exercises</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                    onPress={() => { onClose(); router.push('/workouts/history' as any); }}
                    className="flex-row items-center p-3 rounded-lg active:bg-black/5 dark:active:bg-white/5"
                >
                    <IconSymbol name="clock.fill" size={20} color={theme.text} style={{ marginRight: 12 }} />
                    <Text className="text-light dark:text-dark font-medium">History</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    onPress={() => { onClose(); router.push('/progress-pictures' as any); }}
                    className="flex-row items-center p-3 rounded-lg active:bg-black/5 dark:active:bg-white/5"
                >
                    <IconSymbol name="camera.fill" size={20} color={theme.text} style={{ marginRight: 12 }} />
                    <Text className="text-light dark:text-dark font-medium">Progress Pictures</Text>
                </TouchableOpacity>

                {onStartEmpty && (
                    <>
                        <View className="h-[1px] bg-black/5 dark:bg-white/5 my-1" />
                        
                        <TouchableOpacity 
                            onPress={() => { onClose(); onStartEmpty(); }}
                            className="flex-row items-center p-3 rounded-lg active:bg-black/5 dark:active:bg-white/5"
                        >
                            <IconSymbol name="plus" size={20} color={theme.primary} style={{ marginRight: 12 }} />
                            <Text className="text-primary font-medium">Start Empty</Text>
                        </TouchableOpacity>
                    </>
                )}
            </RaisedCard>
        </>
    );
}
export default BurgerMenu;
