import React, { useEffect } from 'react';
import { View, ScrollView, BackHandler, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useActiveWorkout } from '../../providers/ActiveWorkoutProvider';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { ExerciseCard } from '../exercises/ExerciseCard';
import { HollowedCard, RaisedCard, IconSymbol, useUITheme } from '@mysuite/ui';
import { formatSeconds } from '../../utils/formatting';

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
        toggleExpanded,
        resetWorkout,
        cancelWorkout,
        removeExercise,
        isRunning,
        workoutSeconds,
        workoutName,
        hasActiveSession,
        pauseWorkout
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

    if (!hasActiveSession) {
        return null;
    }

    const title = workoutName || "Current Workout";

    const handlePress = () => {
         toggleExpanded();
    };

    const handleEnd = (e: any) => {
        // Stop propagation to prevent toggling expansion
        e?.stopPropagation();
        
        // Pause and navigate to end screen
        pauseWorkout();
        router.push('/workouts/end');
    };

    const renderHeader = () => {
        if (isExpanded) {
            return (
                <View 
                    style={{ 
                        zIndex: 1001,
                        top: 0,
                        left: 0,
                        right: 0,
                        paddingTop: insets.top,
                        paddingBottom: 16,
                    }}
                    className="absolute bg-light/80 dark:bg-dark/80 rounded-b-3xl"
                >
                    {/* Content Container (Expanded) */}
                    <View 
                        className="flex-row justify-center items-center relative z-10 min-h-[44px]"
                        pointerEvents="box-none"
                    >
                        {/* Left: Timer + Status */}
                        <View className="absolute left-5 z-10 flex-row items-center gap-2" pointerEvents="none">
                            <View className={`w-2 h-2 rounded-full ${isRunning ? 'bg-primary dark:bg-primary-dark' : 'bg-gray-400'}`} />
                            <Text className="text-sm font-semibold tabular-nums text-light dark:text-dark">{formatSeconds(workoutSeconds)}</Text>
                        </View>
                        
                        {/* Center: Title */}
                        <Text 
                            className="text-xl font-bold text-light dark:text-dark text-center flex-1 mx-20" 
                            numberOfLines={1}
                            pointerEvents="none"
                        >
                            {title}
                        </Text>
                        
                        {/* Right: Actions */}
                        <View className="absolute right-5 z-10 flex-row gap-2">
                            <RaisedCard 
                                onPress={handleEnd}
                                className="h-8 px-3 py-0 bg-light dark:bg-dark-lighter items-center justify-center"
                                style={{ borderRadius: 9999 }}
                            >
                                <Text className="text-danger text-xs font-bold">End</Text>
                            </RaisedCard>
                            <RaisedCard 
                                onPress={handlePress}
                                className="h-8 w-8 p-0 bg-light dark:bg-dark-lighter items-center justify-center"
                                style={{ borderRadius: 9999 }}
                            >
                                <IconSymbol name="arrow.down.right.and.arrow.up.left" size={18} className="text-primary dark:text-primary-dark" />
                            </RaisedCard>
                        </View>
                    </View>
                </View>
            );
        }

        // Minimized Pill State
        return (
            <Animated.View 
                style={{ 
                    zIndex: 1001,
                    bottom: insets.bottom + 60, // Adjust for tab bar height roughly or ensure it sits above
                    left: 16,
                    right: 16,
                    paddingTop: 10,
                    paddingBottom: 10,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.15,
                    shadowRadius: 10,
                    elevation: 5,
                }}
                className="absolute bg-light/80 dark:bg-dark/80 rounded-full"
            >
                {/* Content Container (Minimized) */}
                <View 
                    className="flex-row justify-center items-center relative z-10 min-h-[40px]"
                    pointerEvents="box-none"
                >
                     {/* Left: Timer + Status */}
                     <View className="absolute left-4 z-10 flex-row items-center gap-2" pointerEvents="none">
                         <View className={`w-2 h-2 rounded-full ${isRunning ? 'bg-primary dark:bg-primary-dark' : 'bg-gray-400'}`} />
                         <Text className="text-xs font-semibold tabular-nums text-light dark:text-dark">{formatSeconds(workoutSeconds)}</Text>
                     </View>
                     
                     {/* Center: Title */}
                     <Text 
                        className="text-lg font-bold text-light dark:text-dark text-center flex-1 mx-20" 
                        numberOfLines={1}
                        pointerEvents="none"
                     >
                        {title}
                     </Text>
                     
                     {/* Right: Actions */}
                     <View className="absolute right-4 z-10 flex-row gap-2">
                         <RaisedCard 
                            onPress={handleEnd}
                            className="h-8 px-3 py-0 bg-light dark:bg-dark-lighter items-center justify-center"
                            style={{ borderRadius: 9999 }}
                         >
                             <Text className="text-danger text-xs font-bold">End</Text>
                         </RaisedCard>
                         <RaisedCard 
                            onPress={handlePress}
                            className="h-8 w-8 p-0 bg-light dark:bg-dark-lighter items-center justify-center"
                            style={{ borderRadius: 9999 }}
                         >
                             <IconSymbol name="arrow.up.left.and.arrow.down.right" size={18} className="text-primary dark:text-primary-dark" />
                         </RaisedCard>
                     </View>
                </View>
            </Animated.View>
        );
    };

    if (!isExpanded) {
        // Render only the minimized pill
        return renderHeader();
    }

    return (
        <Animated.View 
            className="absolute inset-0 z-[999] bg-light dark:bg-dark"
            entering={SlideInDown.duration(400)} 
            exiting={SlideOutDown.duration(400)}
        >
            {renderHeader()}
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

                    <HollowedCard
                        onPress={() => router.push({ pathname: '/exercises', params: { mode: 'add' } })}
                        className="mt-5 items-center justify-center p-4"
                    >
                        <Text className="text-base font-semibold text-primary dark:text-primary-dark text-center">
                            + Add Exercise
                        </Text>
                    </HollowedCard>

                    <View className="mt-4 flex-row gap-4">
                        <RaisedCard
                            onPress={resetWorkout}
                            className="flex-1 h-12 bg-light dark:bg-dark-lighter items-center justify-center"
                        >
                            <View>
                                <Text className="text-warning font-bold text-center text-lg">Reset</Text>
                            </View>
                        </RaisedCard>

                        <RaisedCard
                            onPress={() => {
                                cancelWorkout();
                            }}
                            className="flex-1 h-12 bg-light dark:bg-dark-lighter items-center justify-center"
                        >
                            <View>
                                <Text className="text-danger font-bold text-center text-lg">Discard</Text>
                            </View>
                        </RaisedCard>
                    </View>
                </ScrollView>
            </View>

        </Animated.View>
    );
}

function ActiveWorkoutExerciseItem({
    exercise,
    index,
    isCurrent,
    completeSet,
    updateExercise,
    onRemoveExercise,
}: {
    exercise: any;
    index: number;
    isCurrent: boolean;
    completeSet: (exerciseIndex: number, setIndex: number, input: any) => void;
    updateExercise: (exerciseIndex: number, updates: any) => void;
    onRemoveExercise: (index: number) => void;
}) {
    const theme = useUITheme();
    const { latestBodyWeight } = useActiveWorkout();

    return (
        <ExerciseCard 
            exercise={exercise}
            isCurrent={isCurrent}
            onRemoveExercise={() => onRemoveExercise(index)}

            theme={theme}
            latestBodyWeight={latestBodyWeight}
            onCompleteSet={(setIndex, input) => {
                const parsedInput = {
                    weight: input?.weight ? parseFloat(input.weight.toString()) : undefined,
                    bodyweight: input?.bodyweight ? parseFloat(input.bodyweight.toString()) : undefined,
                    reps: input?.reps ? parseFloat(input.reps) : undefined,
                    duration: input?.duration ? parseFloat(input.duration) : undefined,
                    distance: input?.distance ? parseFloat(input.distance) : undefined,
                };
                completeSet(index, setIndex, parsedInput);
            }}
            onUncompleteSet={(setIndex) => {
                const currentLogs = exercise.logs || [];
                // Allow clearing any index, even if it's beyond current length (though unlikely via UI)
                const newLogs = [...currentLogs];
                // Set to undefined/null to preserve indices of other sets
                newLogs[setIndex] = undefined; // or null
                
                // Recalculate completed sets
                const completedCount = newLogs.filter(l => l !== undefined && l !== null).length;

                updateExercise(index, { 
                    logs: newLogs, 
                    completedSets: completedCount,
                });
            }}
            onUpdateSetTarget={(setIndex, key, value) => {
                const numValue = value === '' ? 0 : parseFloat(value);
                const currentTargets = exercise.setTargets ? [...exercise.setTargets] : [];
                
                // Ensure targets exist up to setIndex
                while (currentTargets.length <= setIndex) {
                    currentTargets.push({ weight: 0, reps: exercise.reps });
                }

                currentTargets[setIndex] = {
                    ...currentTargets[setIndex],
                    [key]: isNaN(numValue) ? 0 : numValue
                };

                updateExercise(index, { setTargets: currentTargets });
            }}
            
            onUpdateLog={(setIndex, key, value) => {
                const newLogs = [...(exercise.logs || [])];
                if (newLogs[setIndex]) {
                    // Cast to any to allow string intermediate state for better input UX, 
                    // or assumes SetLog handles string/number.
                    // If strict typing requires number, we might need a local state approach.
                    // For now, mirroring flexible behavior.
                    (newLogs[setIndex] as any)[key] = value;
                    updateExercise(index, { logs: newLogs });
                }
            }}
            onAddSet={() => {
                const nextSetIndex = exercise.sets;
                const previousTarget = exercise.setTargets?.[nextSetIndex - 1];
                
                // Default fallback or use previous values
                const newTarget = previousTarget 
                    ? { ...previousTarget }
                    : { weight: 0, reps: exercise.reps };
                    
                const currentTargets = exercise.setTargets ? [...exercise.setTargets] : [];
                
                // Ensure array continuity
                while (currentTargets.length < nextSetIndex) {
                    currentTargets.push({ weight: 0, reps: exercise.reps });
                }
                
                currentTargets[nextSetIndex] = newTarget;

                updateExercise(index, { 
                    sets: exercise.sets + 1,
                    setTargets: currentTargets
                });
            }}
            onDeleteSet={(setIndex) => {
                const currentLogs = exercise.logs || [];
                const currentTarget = exercise.sets;
                const currentSetTargets = exercise.setTargets ? [...exercise.setTargets] : [];

                // Remove the target definition for this index if it exists
                if (setIndex < currentSetTargets.length) {
                    currentSetTargets.splice(setIndex, 1);
                }
                
                // Handle logs (sparse array safe splice)
                const newLogs = [...currentLogs];
                // Only splice if within bounds, but with sparse array we just splice anyway if we want to shift
                // If setIndex >= newLogs.length, nothing happens, which is fine for "future" sets that have no log entry yet
                if (setIndex < newLogs.length) {
                    newLogs.splice(setIndex, 1);
                }

                // Recalculate completed sets count
                const completedCount = newLogs.filter(l => l !== undefined && l !== null).length;

                updateExercise(index, { 
                    logs: newLogs, 
                    setTargets: currentSetTargets,
                    completedSets: completedCount,
                    sets: Math.max(0, currentTarget - 1)
                });
            }}
        />
    );
}

