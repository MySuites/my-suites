"use client"

import React, { useEffect } from 'react';
import { View, ScrollView, BackHandler, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useActiveWorkout } from '../../providers/ActiveWorkoutProvider';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { ActiveWorkoutExerciseItem } from './ActiveWorkoutExerciseItem';
import { HollowedButton, RaisedButton } from '@mysuite/ui';

export function ActiveWorkoutOverlay() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const {
        exercises,
        currentIndex,
        completeSet,
        updateExercise,
        isExpanded,
        setExpanded,
        resetWorkout,
        cancelWorkout,
        removeExercise

    } = useActiveWorkout();



    useEffect(() => {
        if (!isExpanded) return;

        const onBackPress = () => {
            setExpanded(false);
            return true; // prevent default behavior
        };

        const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
        return () => subscription.remove();
    }, [isExpanded, setExpanded]);





    if (!isExpanded) return null;

    return (
        <Animated.View 
            className="absolute inset-0 z-[999] bg-light dark:bg-dark"
            entering={SlideInDown.duration(400)} 
            exiting={SlideOutDown.duration(400)}
        >
            <View className="flex-1">
                <ScrollView contentContainerStyle={{ padding: 12, paddingTop: insets.top + 80, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
                     {(!exercises || exercises.length === 0) ? (
                        <View className="flex-1 items-center justify-center py-20">
                            <Text className="text-xl text-light dark:text-dark mb-6 text-center">No exercises found</Text>
                        </View>
                     ) : (
                        <>
                             {exercises.map((exercise, index) => (
                                <View key={index} className="mb-6">
                                    <ActiveWorkoutExerciseItem
                                        exercise={exercise}
                                        index={index}
                                        isCurrent={index === currentIndex}

                                        completeSet={completeSet}
                                        updateExercise={updateExercise}
                                        onRemoveExercise={removeExercise}
                                    />
                                </View>
                            ))}
                        </>
                     )}

                    <HollowedButton
                        title="+ Add Exercise"
                        onPress={() => router.push({ pathname: '/exercises', params: { mode: 'add' } })}
                        className="mt-5"
                        textClassName="text-base font-semibold text-primary dark:text-primary-dark"
                    />

                    <View className="mt-4 flex-row gap-4">
                        <RaisedButton
                            onPress={resetWorkout}
                            className="flex-1 h-12 bg-light dark:bg-dark-lighter"
                        >
                            <View>
                                <Text className="text-warning font-bold text-center text-lg">Reset</Text>
                            </View>
                        </RaisedButton>

                        <RaisedButton
                            onPress={() => {
                                cancelWorkout();
                            }}
                            className="flex-1 h-12 bg-light dark:bg-dark-lighter"
                        >
                            <View>
                                <Text className="text-danger font-bold text-center text-lg">Discard</Text>
                            </View>
                        </RaisedButton>
                    </View>
                </ScrollView>
            </View>

        </Animated.View>
    );
}

