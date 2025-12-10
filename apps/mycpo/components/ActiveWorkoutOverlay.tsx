"use client"

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, BackHandler } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUITheme as useTheme } from '@mycsuite/ui';
import { useActiveWorkout } from '../providers/ActiveWorkoutProvider';
import Animated, { SlideInUp, SlideOutUp } from 'react-native-reanimated';
import { ExerciseCard } from './ui/ExerciseCard';
import { AddExerciseModal } from './AddExerciseModal';

export function ActiveWorkoutOverlay() {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    
    const {
        exercises,
        restSeconds,
        currentIndex,
        completeSet,
        updateExercise,
        isExpanded,
        setExpanded,
        toggleExpanded,
        addExercise,
    } = useActiveWorkout();

    const styles = makeStyles(theme);

    // handle back button
    useEffect(() => {
        if (!isExpanded) return;

        const onBackPress = () => {
            setExpanded(false);
            return true; // prevent default behavior
        };

        const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
        return () => subscription.remove();
    }, [isExpanded, setExpanded]);


    const [isAddModalOpen, setAddModalOpen] = React.useState(false);

    // If not expanded, return null or handle animation visibility
    if (!isExpanded) return null;

    return (
        <Animated.View 
            style={[styles.overlay, { paddingTop: insets.top + 50 }]} // Top padding for Persistent Header
            entering={SlideInUp.duration(400)} 
            exiting={SlideOutUp.duration(400)}
        >
            <View style={styles.container}>
                <ScrollView contentContainerStyle={styles.content}>
                     {(!exercises || exercises.length === 0) ? (
                        <View style={styles.emptyContainer}>
                             <Text style={styles.title}>No exercises found</Text>
                             <TouchableOpacity onPress={toggleExpanded} style={styles.closeButton}>
                                 <Text style={styles.controlText}>Close</Text>
                             </TouchableOpacity>
                        </View>
                     ) : (
                        <>
                            {exercises.map((exercise, index) => (
                                <ExerciseCard 
                                    key={index}
                                    exercise={exercise}
                                    isCurrent={index === currentIndex}
                                    restSeconds={restSeconds}
                                    theme={theme}
                                    onCompleteSet={(input) => {
                                        // ExerciseCard might return strings from TextInput, need to parse
                                        const parsedInput = {
                                            weight: input?.weight ? parseFloat(input.weight) : undefined,
                                            reps: input?.reps ? parseFloat(input.reps) : undefined,
                                            duration: input?.duration ? parseFloat(input.duration) : undefined,
                                        };
                                        completeSet(index, parsedInput);
                                    }}
                                    onAddSet={() => updateExercise(index, { sets: exercise.sets + 1 })}
                                    onDeleteSet={(setIndex) => {
                                        // Logic for deleting a set
                                        const currentLogs = exercise.logs || [];
                                        const currentTarget = exercise.sets;
                                        
                                        if (setIndex < currentLogs.length) {
                                            // Deleting a completed set (log)
                                            const newLogs = [...currentLogs];
                                            newLogs.splice(setIndex, 1);
                                            updateExercise(index, { 
                                                logs: newLogs, 
                                                completedSets: (exercise.completedSets || 1) - 1,
                                                sets: currentTarget > 0 ? currentTarget - 1 : 0
                                            });
                                        } else {
                                            // Deleting a pending set (reduce target)
                                            updateExercise(index, { sets: Math.max(0, currentTarget - 1) });
                                        }
                                    }}
                                />
                            ))}
                            <TouchableOpacity 
                                style={styles.addExerciseButton}
                                onPress={() => setAddModalOpen(true)}
                            >
                                <Text style={styles.addExerciseText}>+ Add Exercise</Text>
                            </TouchableOpacity>
                        </>
                     )}
                </ScrollView>
            </View>

            <AddExerciseModal 
                visible={isAddModalOpen}
                onClose={() => setAddModalOpen(false)}
                onAdd={(name: string, sets: string, reps: string) => {
                    addExercise(name, sets, reps);
                }}
            />
        </Animated.View>
    );
}

const makeStyles = (theme: any) =>
    StyleSheet.create({
        overlay: {
            ...StyleSheet.absoluteFillObject,
            zIndex: 999, // Just below the Header (1000)
            backgroundColor: theme.background, 
        },
        container: { flex: 1 },
        title: { fontSize: 20, color: theme.text },
        closeButton: { padding: 10 },
        controlText: { color: theme.primary },
        content: { padding: 20, paddingBottom: 150 },
        emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
        addExerciseButton: {
            marginTop: 20,
            padding: 16,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: theme.primary,
            borderStyle: 'dashed',
            alignItems: 'center',
            justifyContent: 'center',
        },
        addExerciseText: {
            color: theme.primary,
            fontSize: 16,
            fontWeight: '600',
        }
    });
