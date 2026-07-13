import React from 'react';
import { View, Text } from 'react-native';
import { RaisedCard, IconSymbol } from "@mysuite/ui";
import { SavedWorkout } from '../../types';

interface SavedWorkoutItemProps {
    item: SavedWorkout;
    onEdit: () => void;
    onStart: () => void;
    onDelete: () => void;
    onDrag?: () => void;
    swipeGroupId?: string;
    activeSwipeId?: string | null;
    onSwipeStart?: (id: string) => void;
}

export const SavedWorkoutItem = ({ 
    item, 
    onEdit, 
    onStart,
    onDelete,
    onDrag,
    swipeGroupId,
    activeSwipeId,
    onSwipeStart
}: SavedWorkoutItemProps) => {
    return (
        <View className="mb-3 px-4">
            <View className="flex-row h-20">
                {/* Workout Info Card (Left) */}
                <RaisedCard 
                    onPress={onEdit}
                    onLongPress={onDrag}
                    delayLongPress={200}
                    className="flex-1 justify-center px-4 bg-primary dark:bg-primary-dark rounded-r-none border-r-1 border-r-black/10 dark:border-r-white/10"
                >
                    <Text className="font-semibold text-white dark:text-dark text-lg" numberOfLines={2}>{item.name}</Text>
                </RaisedCard>
                
                {/* Start Button Card (Right) */}
                <RaisedCard 
                    onPress={onStart}
                    className="w-[20%] bg-primary dark:bg-primary-dark items-center justify-center rounded-l-none border-l-1 border-l-black/10 dark:border-l-white/10"
                >
                    <IconSymbol name="play.fill" size={24} color="#FFF" />
                </RaisedCard>
            </View>
        </View>
    );
};
