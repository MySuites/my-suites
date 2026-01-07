import React from 'react';
import { View, Text, Modal, FlatList } from 'react-native';
import { useUITheme as useTheme, RaisedCard, IconSymbol } from '@mysuite/ui';

interface WorkoutPreviewModalProps {
    visible: boolean;
    onClose: () => void;
    workout: any | null;
}

export function WorkoutPreviewModal({ visible, onClose, workout }: WorkoutPreviewModalProps) {
    const theme = useTheme();
    if (!workout) return null;

    return (
        <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
            <View className="flex-1 justify-center bg-black/60 px-6">
                <View className="bg-light dark:bg-dark rounded-3xl overflow-hidden p-6">
                    <View className="flex-row justify-between items-center mb-4">
                        <Text className="text-xl font-bold text-light dark:text-dark flex-1 mr-4" numberOfLines={1}>
                            {workout.name}
                        </Text>
                        <RaisedCard 
                            onPress={onClose} 
                            className="w-12 h-12 p-0 rounded-full items-center justify-center" 
                            style={{ borderRadius: 9999 }}
                        >
                            <IconSymbol name="xmark" size={24} color={theme.primary} />
                        </RaisedCard>
                    </View>

                    <FlatList
                        data={workout.exercises || []}
                        keyExtractor={(_, i) => i.toString()}
                        className="max-h-[60vh]"
                        showsVerticalScrollIndicator={false}
                        renderItem={({ item }) => (
                            <View className="mb-2 bg-light-lighter dark:bg-white/5 p-4 rounded-2xl">
                                <Text className="font-semibold text-light dark:text-dark">{item.name}</Text>
                                <Text className="text-sm text-light-muted dark:text-dark-muted">
                                    {item.sets} × {item.reps} {item.properties?.length > 0 && `• ${item.properties.join(', ')}`}
                                </Text>
                            </View>
                        )}
                    />
                </View>
            </View>
        </Modal>
    );
}
