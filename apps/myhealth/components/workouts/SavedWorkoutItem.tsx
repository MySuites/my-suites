import React from 'react';
import { View, Text } from 'react-native';
import { RaisedCard, IconSymbol } from "@mysuite/ui";
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
    return (
        <View className="mb-3 px-4">
            <View className="flex-row gap-1 h-20">
                {/* Workout Info Card */}
                <RaisedCard 
                    onPress={onEdit}
                    className="flex-1 justify-center px-4 bg-primary dark:bg-dark-lighter"
                >
                    <Text className="font-semibold text-white dark:text-dark text-lg" numberOfLines={2}>{item.name}</Text>
                </RaisedCard>
                
                {/* Start Button Card */}
                <RaisedCard 
                    onPress={onStart}
                    className="w-[24%] bg-primary dark:bg-primary-dark items-center justify-center"
                >
                    <IconSymbol name="play.fill" size={24} color="#FFF" />
                </RaisedCard>
            </View>
        </View>
    );
};
