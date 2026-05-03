import React from 'react';
import { View, Text, Alert, TouchableOpacity, Keyboard } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useActiveWorkout, useActiveWorkoutTimer } from '../../providers/ActiveWorkoutProvider';
import Animated, { SlideInDown, SlideOutDown, FadeIn, FadeOut } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { default as ExercisesScreen } from '../../app/exercises/index';
import { ExerciseCard } from '../exercises/ExerciseCard';
import { ScreenHeader } from '../ui/ScreenHeader';
import { RaisedCard, IconSymbol, useUITheme } from '@mysuite/ui';
import { formatSeconds, formatRestTime } from '../../utils/formatting';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';

function RestTimerBar({ seconds, onSkip, onAdjust }: { seconds: number; onSkip: () => void; onAdjust: (amt: number) => void }) {
    const theme = useUITheme();
    const insets = useSafeAreaInsets();
    return (
        <Animated.View 
            entering={SlideInDown.duration(300)} 
            exiting={SlideOutDown.duration(300)}
            className="absolute left-4 right-4 z-[2000] p-4 rounded-2xl flex-row items-center justify-between"
            style={{ 
                bottom: insets.bottom + 12,
                backgroundColor: theme.bgLight, 
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 10,
                elevation: 10,
                borderWidth: 1,
                borderColor: theme.bgDark === '#000000' ? '#333' : '#eee'
            }}
        >
            <View className="flex-row items-center gap-3">
                <TouchableOpacity 
                    onPress={() => onAdjust(-15)} 
                    className="w-12 h-10 rounded-xl bg-light dark:bg-dark-lighter items-center justify-center active:opacity-70"
                >
                    <Text className="text-light dark:text-dark font-bold text-xs">-15s</Text>
                </TouchableOpacity>

                <View className="items-center px-2">
                    <Text className="text-light-muted dark:text-dark-muted text-[10px] font-bold uppercase tracking-wider">Resting</Text>
                    <Text className="text-light dark:text-dark text-xl font-black tabular-nums">{formatRestTime(seconds)}</Text>
                </View>

                <TouchableOpacity 
                    onPress={() => onAdjust(15)} 
                    className="w-12 h-10 rounded-xl bg-light dark:bg-dark-lighter items-center justify-center active:opacity-70"
                >
                    <Text className="text-light dark:text-dark font-bold text-xs">+15s</Text>
                </TouchableOpacity>
            </View>
            
            <RaisedCard 
                onPress={onSkip}
                className="px-6 py-2.5 rounded-full bg-primary"
                style={{ borderRadius: 9999 }}
            >
                <Text className="text-white font-bold">Skip</Text>
            </RaisedCard>
        </Animated.View>
    );
}

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
        reorderExercises,
        workoutName,
        hasActiveSession,
        pauseWorkout,
        addExercise,
        latestBodyWeight
    } = useActiveWorkout();
    
    const { isRunning, workoutSeconds, restSeconds, startRestTimer } = useActiveWorkoutTimer();
    
    const [isAddingExercise, setIsAddingExercise] = React.useState(false);

    if (!hasActiveSession) {
        return null;
    }

    function handleOpenAddExercise() {
        Keyboard.dismiss();
        setIsAddingExercise(true);
    }

    function handleAddExercise(newExercises: any[]) {
        newExercises.forEach(exercise => {
            addExercise(exercise.name, "3", "10", exercise.properties);
        });
        setIsAddingExercise(false);
    }

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
                                {workoutName || "Current Workout"}
                            </Text>
                            <View className="flex-row items-center gap-2 mt-1">
                                <View className={`w-2 h-2 rounded-full ${isRunning ? 'bg-primary dark:bg-primary-dark' : 'bg-gray-400'}`} />
                                <Text className="text-sm font-semibold tabular-nums text-light dark:text-dark">{formatSeconds(workoutSeconds)}</Text>
                            </View>
                        </View>
                    }
                    leftAction={
                        <RaisedCard 
                            onPress={() => {
                                Keyboard.dismiss();
                                setExpanded(false);
                            }}
                            className="h-12 w-12 active:h-11 p-0 bg-lighter dark:bg-dark-lighter items-center justify-center"
                            style={{ borderRadius: 9999 }}
                        >
                            <IconSymbol name="chevron.down" size={22} className="text-primary dark:text-primary-dark" />
                        </RaisedCard>
                    }
                    rightAction={
                        <RaisedCard 
                            onPress={() => {
                                Keyboard.dismiss();
                                pauseWorkout();
                                router.push('/workouts/end');
                            }}
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

        return (
            <Animated.View 
                entering={FadeIn.delay(200).duration(300)}
                exiting={FadeOut.duration(200)}
                style={{ 
                    zIndex: 40,
                    bottom: insets.bottom + 65,
                    alignSelf: 'center',
                    width: '60%',
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
                    onPress={toggleExpanded}
                    className="flex-row items-center justify-center py-3 px-6 rounded-full bg-primary dark:bg-primary-dark border-0"
                    style={{ borderRadius: 9999 }}
                >
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

    const renderFooter = () => (
        <View className="px-4 pb-20 mt-4">
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
        </View>
    );

    const renderItem = ({ item: exercise, drag, isActive, getIndex }: RenderItemParams<any>) => {
        const index = getIndex() ?? 0;
        return (
            <ScaleDecorator activeScale={1.05}>
                <View className={`mb-6 p-1.5 ${isActive ? 'bg-light dark:bg-dark rounded-2xl' : ''}`}>
                    <ActiveWorkoutExerciseItem
                        exercise={exercise}
                        index={index}
                        isCurrent={index === currentIndex}

                        completeSet={completeSet}
                        updateExercise={updateExercise}
                        onRemoveExercise={removeExercise}
                        onMoveUp={index > 0 ? () => reorderExercises(index, index - 1) : undefined}
                        onMoveDown={index < exercises.length - 1 ? () => reorderExercises(index, index + 1) : undefined}
                        onUpdateRestTime={(newRestTime) => updateExercise(index, { restTime: newRestTime })}
                        latestBodyWeight={latestBodyWeight}
                        onPressName={() => {
                            Keyboard.dismiss();
                            router.push({
                                pathname: '/exercises/details' as any,
                                params: { exercise: JSON.stringify(exercise) }
                            });
                        }}
                        onDrag={drag}
                    />
                </View>
            </ScaleDecorator>
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
                    <DraggableFlatList
                        data={exercises}
                        onDragEnd={({ from, to }) => reorderExercises(from, to)}
                        keyExtractor={(item, index) => `${item.id}-${index}`}
                        renderItem={renderItem}
                        ListFooterComponent={renderFooter}
                        ListEmptyComponent={
                            <View className="flex-1 items-center justify-center py-20">
                                <Text className="text-xl text-light dark:text-dark mb-6 text-center">No exercises found</Text>
                            </View>
                        }
                        contentContainerStyle={{ 
                            paddingTop: insets.top + 80, 
                            paddingBottom: 40,
                        }}
                        activationDistance={20}
                    />

                    {restSeconds > 0 && (
                        <RestTimerBar 
                            seconds={restSeconds} 
                            onSkip={() => startRestTimer(0)} 
                            onAdjust={(amt) => startRestTimer(Math.max(0, restSeconds + amt))}
                        />
                    )}
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
    onMoveUp,
    onMoveDown,
    onDrag,
    latestBodyWeight,
    onPressName,
    onUpdateRestTime,
}: {
    exercise: any;
    index: number;
    isCurrent: boolean;
    completeSet: (exerciseIndex: number, setIndex: number, input: any) => void;
    updateExercise: (exerciseIndex: number, updates: any) => void;
    onRemoveExercise: (index: number) => void;
    onMoveUp?: () => void;
    onMoveDown?: () => void;
    onDrag?: () => void;
    latestBodyWeight: number | null;
    onPressName?: () => void;
    onUpdateRestTime?: (restTime: number) => void;
}) {
    const theme = useUITheme();

    return (
        <ExerciseCard 
            exercise={exercise}
            isCurrent={isCurrent}
            onRemoveExercise={() => onRemoveExercise(index)}
            onMoveUp={onMoveUp}
            onMoveDown={onMoveDown}
            onDrag={onDrag}
            onPressName={onPressName}
            theme={theme}
            latestBodyWeight={latestBodyWeight}
            onCompleteSet={(setIndex) => {
                completeSet(index, setIndex, {});
            }}
            onUpdateRestTime={onUpdateRestTime}
            onUpdateSetTarget={(setIndex, key, value) => {
                const currentTargets = exercise.setTargets ? [...exercise.setTargets] : [];
                while (currentTargets.length <= setIndex) {
                    currentTargets.push({ weight: 0, reps: exercise.reps });
                }
                currentTargets[setIndex] = {
                    ...currentTargets[setIndex],
                    [key]: value
                };
                updateExercise(index, { setTargets: currentTargets });
            }}
            onAddSet={() => {
                const nextSetIndex = exercise.sets;
                const previousTarget = exercise.setTargets?.[nextSetIndex - 1];
                const newTarget = previousTarget ? { ...previousTarget } : { weight: 0, reps: exercise.reps };
                const currentTargets = exercise.setTargets ? [...exercise.setTargets] : [];
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
                const currentTarget = exercise.sets;
                const currentSetTargets = exercise.setTargets ? [...exercise.setTargets] : [];
                if (setIndex < currentSetTargets.length) {
                    currentSetTargets.splice(setIndex, 1);
                }
                
                // Also update completedIndices if the deleted set was completed
                let newCompletedIndices = [...(exercise.completedIndices || [])];
                newCompletedIndices = newCompletedIndices
                    .filter(idx => idx !== setIndex)
                    .map(idx => idx > setIndex ? idx - 1 : idx);

                updateExercise(index, { 
                    setTargets: currentSetTargets,
                    completedIndices: newCompletedIndices,
                    completedSets: newCompletedIndices.length,
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
        prevProps.latestBodyWeight === nextProps.latestBodyWeight &&
        prevProps.onMoveUp === nextProps.onMoveUp &&
        prevProps.onMoveDown === nextProps.onMoveDown &&
        prevProps.onDrag === nextProps.onDrag
    );
});
