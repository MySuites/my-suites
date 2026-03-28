import React, { useEffect } from 'react';
import { View, ScrollView, BackHandler, Text, Alert, Pressable, Keyboard } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useActiveWorkout, useActiveWorkoutTimer } from '../../providers/ActiveWorkoutProvider';
import Animated, { SlideInDown, SlideOutDown, FadeIn, FadeOut } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { default as ExercisesScreen } from '../../app/exercises/index';
import { ExerciseCard } from '../exercises/ExerciseCard';
import { ScreenHeader } from '../ui/ScreenHeader';
import { RaisedCard, IconSymbol, useUITheme } from '@mysuite/ui';
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
        workoutName,
        hasActiveSession,
        pauseWorkout,
        addExercise,
        latestBodyWeight
    } = useActiveWorkout();
    
    const { isRunning, workoutSeconds } = useActiveWorkoutTimer();
    
    const [isAddingExercise, setIsAddingExercise] = React.useState(false);

    function handleOpenAddExercise() {
        setIsAddingExercise(true);
    }

    function handleAddExercise(newExercises: any[]) {
        newExercises.forEach(exercise => {
            // Default to 3 sets of 10 reps if not specified
            addExercise(exercise.name, "3", "10", exercise.properties);
        });
        setIsAddingExercise(false);
    }

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
                <ScreenHeader
                    title={
                        <View className="flex-col items-center pt-2">
                            <Text 
                                className="text-lg font-bold text-light dark:text-dark text-center" 
                                numberOfLines={1}
                                pointerEvents="none"
                            >
                                {title}
                            </Text>
                            <View className="flex-row items-center gap-2 mt-1">
                                <View className={`w-2 h-2 rounded-full ${isRunning ? 'bg-primary dark:bg-primary-dark' : 'bg-gray-400'}`} />
                                <Text className="text-sm font-semibold tabular-nums text-light dark:text-dark">{formatSeconds(workoutSeconds)}</Text>
                            </View>
                        </View>
                    }
                    leftAction={
                        <RaisedCard 
                            onPress={handlePress}
                            className="h-12 w-12 active:h-11 p-0 bg-lighter dark:bg-dark-lighter items-center justify-center"
                            style={{ borderRadius: 9999 }}
                        >
                            <IconSymbol name="chevron.down" size={22} className="text-primary dark:text-primary-dark" />
                        </RaisedCard>
                    }
                    rightAction={
                        <RaisedCard 
                            onPress={handleEnd}
                            className="h-12 w-12 active:h-11 p-0 bg-lighter dark:bg-dark-lighter items-center justify-center"
                            style={{ borderRadius: 9999 }}
                        >
                            <IconSymbol name="stop.fill" size={24} className="text-primary dark:text-primary-dark" />
                        </RaisedCard>
                    }
                    className="z-[1001] border-b-0"
                />
            );
        }

        // Minimized Pill State
        return (
            <Animated.View 
                entering={FadeIn.delay(200).duration(300)}
                exiting={FadeOut.duration(200)}
                style={{ 
                    zIndex: 40,
                    bottom: insets.bottom + 65, // Floating above tabs
                    alignSelf: 'center',
                    width: '60%', // Pill width
                    maxWidth: 300,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.25,
                    shadowRadius: 8,
                    elevation: 8,
                }}
                className="absolute"
            >
                <RaisedCard
                    onPress={handlePress} // Tapping anywhere expands
                    className="flex-row items-center justify-center py-3 px-6 rounded-full bg-primary dark:bg-primary-dark border-0"
                    style={{ borderRadius: 9999 }}
                >
                     {/* Timer + Status */}
                     <View className="flex-row items-center gap-2">
                         <View className={`w-2.5 h-2.5 rounded-full ${isRunning ? 'bg-white animate-pulse' : 'bg-white/50'}`} />
                         <Text className="text-lg font-bold tabular-nums text-white">
                            {formatSeconds(workoutSeconds)}
                         </Text>
                     </View>
                </RaisedCard>
            </Animated.View>
        );
    };

    return (
        <>
        {!isExpanded && renderHeader()}
        {isExpanded && (
            <Animated.View 
                className="absolute inset-0 z-[999] bg-light dark:bg-dark"
                entering={SlideInDown.duration(400)} 
                exiting={SlideOutDown.duration(400)}
            >
                {renderHeader()}
                <View className="flex-1">
                <Pressable 
                    className="flex-1" 
                    onPress={() => Keyboard.dismiss()} 
                    accessible={false}
                >
                    <ScrollView 
                        contentContainerStyle={{ padding: 4, paddingTop: insets.top + 80, paddingBottom: 120 }} 
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
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
                                            latestBodyWeight={latestBodyWeight}
                                            onPressName={() => {
                                                setExpanded(false);
                                                router.push({
                                                    pathname: '/exercises/details' as any,
                                                    params: { exercise: JSON.stringify(exercise) }
                                                });
                                            }}
                                        />
                                    </View>
                                ))}
                            </>
                         )}
    
                        <RaisedCard
                            onPress={handleOpenAddExercise}
                            className="items-center justify-center p-3 bg-primary"
                        >
                            <Text className="text-lg font-semibold text-white dark:text-white text-center">
                                + Add Exercise
                            </Text>
                        </RaisedCard>
    
                        <View className="mt-4 flex-row gap-4">
                            <RaisedCard
                                onPress={resetWorkout}
                                className="flex-1 h-12 bg-lighter dark:bg-dark-lighter items-center justify-center"
                            >
                                <View>
                                    <Text className="text-warning font-bold text-center text-lg">Reset</Text>
                                </View>
                            </RaisedCard>
    
                            <RaisedCard
                                onPress={() => {
                                    Alert.alert(
                                        "Discard Workout?",
                                        "Are you sure you want to discard this workout? All progress will be lost.",
                                        [
                                            { text: "Cancel", style: "cancel" },
                                            { 
                                                text: "Discard", 
                                                style: "destructive", 
                                                onPress: () => cancelWorkout() 
                                            }
                                        ]
                                    );
                                }}
                                className="flex-1 h-12 bg-lighter dark:bg-dark-lighter items-center justify-center"
                            >
                                <View>
                                    <Text className="text-danger font-bold text-center text-lg">Discard</Text>
                                </View>
                            </RaisedCard>
                        </View>
                    </ScrollView>
                </Pressable>
            </View>

            </Animated.View>
        )}
            {isAddingExercise && (
                <Animated.View 
                    className="absolute inset-0 z-[1000] bg-light dark:bg-dark"
                    entering={SlideInDown.duration(300)}
                    exiting={SlideOutDown.duration(300)}
                >
                    <ExercisesScreen
                        mode="select"
                        onSelect={handleAddExercise}
                        onClose={() => setIsAddingExercise(false)}
                    />
                </Animated.View>
            )}
        </>
    );
}

const ActiveWorkoutExerciseItem = React.memo(function ActiveWorkoutExerciseItem({
    exercise,
    index,
    isCurrent,
    completeSet,
    updateExercise,
    onRemoveExercise,
    latestBodyWeight,
    onPressName,
}: {
    exercise: any;
    index: number;
    isCurrent: boolean;
    completeSet: (exerciseIndex: number, setIndex: number, input: any) => void;
    updateExercise: (exerciseIndex: number, updates: any) => void;
    onRemoveExercise: (index: number) => void;
    latestBodyWeight: number | null;
    onPressName?: () => void;
}) {
    const theme = useUITheme();

    return (
        <ExerciseCard 
            exercise={exercise}
            isCurrent={isCurrent}
            onRemoveExercise={() => onRemoveExercise(index)}
            onPressName={onPressName}

            theme={theme}
            latestBodyWeight={latestBodyWeight}
            onCompleteSet={(setIndex, input) => {
                const parsedValue = (val: any) => (val !== undefined && val !== null && val !== '') ? parseFloat(val.toString()) : undefined;
                const parsedInput = {
                    weight: parsedValue(input?.weight),
                    bodyweight: parsedValue(input?.bodyweight),
                    reps: parsedValue(input?.reps),
                    duration: parsedValue(input?.duration),
                    distance: parsedValue(input?.distance),
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
                const numValue = value === '' ? undefined : parseFloat(value);
                const currentTargets = exercise.setTargets ? [...exercise.setTargets] : [];
                
                // Ensure targets exist up to setIndex
                while (currentTargets.length <= setIndex) {
                    currentTargets.push({ weight: 0, reps: exercise.reps });
                }

                currentTargets[setIndex] = {
                    ...currentTargets[setIndex],
                    [key]: (value === '' || isNaN(numValue as any)) ? undefined : numValue
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
}, (prevProps, nextProps) => {
    return (
        prevProps.exercise === nextProps.exercise &&
        prevProps.index === nextProps.index &&
        prevProps.isCurrent === nextProps.isCurrent &&
        prevProps.latestBodyWeight === nextProps.latestBodyWeight
    );
});

