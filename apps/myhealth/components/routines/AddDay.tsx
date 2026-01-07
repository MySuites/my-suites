import React, { useState } from 'react';
import { View, Text, Modal, ScrollView } from 'react-native';
import { useUITheme, RaisedCard, IconSymbol } from '@mysuite/ui';
import { ScreenHeader } from '../ui/ScreenHeader';
import { BackButton } from '../ui/BackButton';
import { WorkoutPreviewModal } from '../workouts/WorkoutPreviewModal';


interface AddDayProps {
    visible: boolean;
    onClose: () => void;
    onAddRestDay: () => void;
    onAddWorkout: (workout: any) => void;
    savedWorkouts: any[];
}

export const AddDay = ({
    visible,
    onClose,
    onAddRestDay,
    onAddWorkout,
    savedWorkouts
}: AddDayProps) => {
    const theme = useUITheme();
    
    const [previewWorkout, setPreviewWorkout] = useState<any | null>(null);
    const [previewVisible, setPreviewVisible] = useState(false);

    const handleOpenPreview = (workout: any) => {
        setPreviewWorkout(workout);
        setPreviewVisible(true);
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="fullScreen"
            onRequestClose={onClose}
        >
            <View className="flex-1 bg-light dark:bg-dark">
                <ScreenHeader 
                    title="Add Day"
                    leftAction={<BackButton onPress={onClose} />}
                />
                
                <ScrollView className="flex-1 mt-28 p-4">
                    <RaisedCard
                        onPress={onAddRestDay}
                        className="p-4 mb-6"
                    >
                        <View className="flex-row items-center">
                            <IconSymbol name="moon.zzz.fill" size={24} color={theme.primary} />
                            <Text className="ml-3 font-semibold text-lg text-light dark:text-dark">Rest Day</Text>
                        </View>
                    </RaisedCard>

                    <Text className="text-base leading-6 font-semibold mb-3">Saved Workouts</Text>
                    {savedWorkouts.length === 0 ? (
                            <Text className="text-gray-500 dark:text-gray-400 italic">No saved workouts found.</Text>
                    ) : (
                        savedWorkouts.map((workout) => (
                            <RaisedCard
                                key={workout.id}
                                onPress={() => handleOpenPreview(workout)}
                                className="p-4 mb-3"
                            >
                                <View className="flex-row items-center justify-between">
                                    <View>
                                        <Text className="font-semibold text-lg text-light dark:text-dark">{workout.name}</Text>
                                        <Text className="text-light-muted dark:text-dark-muted text-sm">{workout.exercises?.length || 0} Exercises</Text>
                                    </View>
                                    <RaisedCard
                                        onPress={(e) => {
                                            e.stopPropagation();
                                            onAddWorkout(workout);
                                        }}
                                        className="w-10 h-10 p-0 rounded-full items-center justify-center"
                                        style={{ borderRadius: 9999 }}
                                    >
                                        <IconSymbol name="plus" size={20} color={theme.primary} />
                                    </RaisedCard>
                                </View>
                            </RaisedCard>
                        ))
                    )}
                    <View className="h-20" /> 
                </ScrollView>
            </View>

            <WorkoutPreviewModal 
                visible={previewVisible}
                onClose={() => setPreviewVisible(false)}
                workout={previewWorkout}
            />
        </Modal>
    );
};
