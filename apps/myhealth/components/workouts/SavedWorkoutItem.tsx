import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { RaisedCard } from '../../../../packages/ui/RaisedCard';
import { SavedWorkout } from '../../types';

interface SavedWorkoutItemProps {
    item: SavedWorkout;
    isExpanded: boolean;
    onPress: () => void;
    onEdit: () => void;
    onStart: () => void;
    onDelete: () => void;
}

export const SavedWorkoutItem = ({ 
    item, 
    isExpanded, 
    onPress, 
    onEdit, 
    onStart,
    onDelete 
}: SavedWorkoutItemProps) => {
    return (
        <RaisedCard 
            onPress={onPress}
            activeOpacity={0.9}
            className="p-0 mb-0 border border-light dark:border-dark"
            onDelete={onDelete}
            onEdit={onEdit}
        >
            <View className={`flex-row justify-between items-center ${isExpanded ? 'border-b border-light dark:border-dark' : ''}`}>
                <View className="flex-row items-center flex-1 mr-2">
                        <Text className="font-semibold text-light dark:text-dark text-lg mb-0.5" numberOfLines={1}>{item.name}</Text>
                </View>
                
                <View className="flex-row items-center">
                    <TouchableOpacity 
                        onPress={onStart}
                        className="bg-primary dark:bg-primary-dark px-3 py-1.5 rounded-lg"
                    >
                        <Text className="text-white font-semibold">Start</Text>
                    </TouchableOpacity>
                </View>
            </View>
            
            {isExpanded && (
                <View className="bg-light/50 dark:bg-dark/50 px-4 py-2 rounded-b-xl">
                    {item.exercises && item.exercises.length > 0 ? (
                        item.exercises.map((ex: any, idx: number) => (
                            <View key={idx} className="py-2 flex-row justify-between border-b border-light dark:border-dark last:border-0">
                                <Text className="text-light dark:text-dark font-medium">{ex.name}</Text>
                                <Text className="text-gray-500 dark:text-gray-400 text-sm">{ex.sets} x {ex.reps}</Text>
                            </View>
                        ))
                    ) : (
                        <Text className="text-gray-500 dark:text-gray-400 py-2 italic text-center">No exercises</Text>
                    )}
                </View>
            )}
        </RaisedCard>
    );
};
