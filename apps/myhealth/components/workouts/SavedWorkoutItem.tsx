import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ActionCard, RaisedCard, IconSymbol, useUITheme } from "@mysuite/ui";
import { SavedWorkout } from '../../types';

interface SavedWorkoutItemProps {
    item: SavedWorkout;
    onEdit: () => void;
    onStart: () => void;
    onDelete: () => void;
    swipeGroupId?: string;
    activeSwipeId?: string | null;
    onSwipeStart?: (id: string) => void;
}

export const SavedWorkoutItem = ({ 
    item, 
    onEdit, 
    onStart,
    onDelete,
    swipeGroupId,
    activeSwipeId,
    onSwipeStart
}: SavedWorkoutItemProps) => {
    const theme = useUITheme();
    return (
        <ActionCard 
            activeOpacity={1}
            className="mb-3" // Add margin bottom for spacing between cards
            onPress={onEdit}
            onDelete={onDelete}
            onEdit={onEdit}
            swipeGroupId={swipeGroupId}
            activeSwipeId={activeSwipeId}
            onSwipeStart={onSwipeStart}
        >
            <RaisedCard className="p-0 overflow-hidden flex-row h-24"> 
                {/* Left Side: Workout Info - Tapping here triggers the row press (Edit) */}
                <View className="flex-1 justify-center px-4 bg-light dark:bg-dark-lighter">
                    <Text className="font-semibold text-light dark:text-dark text-lg" numberOfLines={2}>{item.name}</Text>
                </View>
                
                {/* Right Side: Start Button (~1/4 width) */}
                <TouchableOpacity 
                    onPress={onStart}
                    activeOpacity={0.8}
                    className="w-1/4 bg-primary dark:bg-primary-dark items-center justify-center h-full border-l border-black/5 dark:border-white/5"
                >
                    <IconSymbol name="play.fill" size={24} color="#FFF" />
                </TouchableOpacity>
            </RaisedCard>
        </ActionCard>
    );
};
