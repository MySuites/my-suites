import React from 'react';
import { View, Text, Alert, TouchableOpacity, Keyboard } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useActiveWorkout, useActiveWorkoutTimer } from '../../providers/ActiveWorkoutProvider';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { default as ExercisesScreen } from '../../app/exercises/index';
import { ExerciseCard } from '../exercises/ExerciseCard';
import { ScreenHeader } from '../ui/ScreenHeader';
import { RaisedCard, IconSymbol, useUITheme } from '@mysuite/ui';
import { formatSeconds, formatRestTime } from '../../utils/formatting';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';

export function RestTimerBar() {
    const { restSeconds, startRestTimer } = useActiveWorkoutTimer();
    const theme = useUITheme();
    const insets = useSafeAreaInsets();
    
    if (restSeconds <= 0) return null;
    
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
                    onPress={() => startRestTimer(Math.max(0, restSeconds - 15))} 
                    className="w-12 h-10 rounded-xl bg-light dark:bg-dark-lighter items-center justify-center active:opacity-70"
                >
                    <Text className="text-light dark:text-dark font-bold text-xs">-15s</Text>
                </TouchableOpacity>

                <View className="items-center px-2">
                    <Text className="text-light-muted dark:text-dark-muted text-[10px] font-bold uppercase tracking-wider">Resting</Text>
                    <Text className="text-light dark:text-dark text-xl font-black tabular-nums">{formatRestTime(restSeconds)}</Text>
                </View>

                <TouchableOpacity 
                    onPress={() => startRestTimer(restSeconds + 15)} 
                    className="w-12 h-10 rounded-xl bg-light dark:bg-dark-lighter items-center justify-center active:opacity-70"
                >
                    <Text className="text-light dark:text-dark font-bold text-xs">+15s</Text>
                </TouchableOpacity>
            </View>
            
            <RaisedCard 
                onPress={() => startRestTimer(0)}
                className="px-6 py-2.5 rounded-full bg-primary"
                style={{ borderRadius: 9999 }}
            >
                <Text className="text-white font-bold">Skip</Text>
            </RaisedCard>
        </Animated.View>
    );
}

function DetailScreenHeader({ onToggleView }: { onToggleView: () => void }) {
    const router = useRouter();
    const { isRunning, workoutSeconds } = useActiveWorkoutTimer();
    const { workoutName, pauseWorkout, resumeWorkout, setExpanded } = useActiveWorkout();
    
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
                    <View className="flex-row items-center gap-3 mt-1">
                        <View className="flex-row items-center gap-1.5">
                            {isRunning ? (
                                <View className="w-2 h-2 rounded-full bg-primary dark:bg-primary-dark" />
                            ) : (
                                <Text className="text-[9px] font-black tracking-widest text-warning uppercase">PAUSED</Text>
                            )}
                            <Text className="text-sm font-semibold tabular-nums text-light dark:text-dark">{formatSeconds(workoutSeconds)}</Text>
                        </View>
                    </View>
                </View>
            }
            leftAction={
                <RaisedCard 
                    onPress={onToggleView}
                    testID="toggle-focused-btn"
                    className="h-12 w-12 active:h-11 p-0 bg-lighter dark:bg-dark-lighter items-center justify-center"
                    style={{ borderRadius: 9999 }}
                >
                    <IconSymbol name="bolt.fill" size={22} className="text-primary dark:text-primary-dark" />
                </RaisedCard>
            }
            rightAction={
                <View className="flex-row gap-2 items-center">
                    <RaisedCard 
                        onPress={() => {
                            Keyboard.dismiss();
                            if (isRunning) {
                                pauseWorkout();
                            } else {
                                resumeWorkout();
                            }
                        }}
                        className="h-12 w-12 active:h-11 p-0 bg-lighter dark:bg-dark-lighter items-center justify-center"
                        style={{ borderRadius: 9999 }}
                    >
                        <IconSymbol 
                            name={isRunning ? 'pause.fill' : 'play.fill'} 
                            size={20} 
                            className="text-primary dark:text-primary-dark" 
                        />
                    </RaisedCard>

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
                </View>
            }
            className="z-[1001] border-b-0"
        />
    );
}

interface ActiveWorkoutDetailScreenProps {
    onToggleView: () => void;
}

export function ActiveWorkoutDetailScreen({ onToggleView }: ActiveWorkoutDetailScreenProps) {
    const router = useRouter();
    const theme = useUITheme();
    const insets = useSafeAreaInsets();
    const {
        exercises,
        currentIndex,
        setCurrentIndex,
        completeSet,
        updateExercise,
        resetWorkout,
        cancelWorkout,
        removeExercise,
        reorderExercises,
        addExercise,
        latestBodyWeight
    } = useActiveWorkout();
    
    const [isAddingExercise, setIsAddingExercise] = React.useState(false);

    const itemHeightsRef = React.useRef<{[index: number]: number}>({});

    const handleScroll = React.useCallback((event: any) => {
        const scrollY = event.nativeEvent.contentOffset.y;
        
        let activeIdx = 0;
        let currentY = 0;
        const total = exercises.length;
        for (let i = 0; i < total; i++) {
            const height = itemHeightsRef.current[i] ?? 280;
            if (scrollY < currentY + 70) {
                activeIdx = i;
                break;
            }
            currentY += height + 24; // card height + mb-6 margin (24px)
            activeIdx = Math.min(i + 1, total - 1);
        }
        
        if (activeIdx !== currentIndex) {
            setCurrentIndex(activeIdx);
        }
    }, [exercises.length, currentIndex, setCurrentIndex]);

    function handleOpenAddExercise() {
        Keyboard.dismiss();
        setIsAddingExercise(true);
    }

    function handleAddExercise(newExercises: any[]) {
        newExercises.forEach(exercise => {
            const singleEquipment = Array.isArray(exercise.equipment) ? exercise.equipment[0] : exercise.equipment;
            addExercise(exercise.name, "3", "10", exercise.properties, exercise.id, exercise.attachment, singleEquipment);
        });
        setIsAddingExercise(false);
    }



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

    const renderItem = React.useCallback(({ item: exercise, drag, isActive }: RenderItemParams<any>) => {
        const index = exercises.indexOf(exercise);
        return (
            <ScaleDecorator activeScale={1.05}>
                <View 
                    className={`mb-6 p-1.5 ${isActive ? 'bg-light dark:bg-dark rounded-2xl' : ''}`}
                    onLayout={(e) => {
                        const { height } = e.nativeEvent.layout;
                        itemHeightsRef.current[index] = height;
                    }}
                >
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
                        onUpdatePrepTime={(newPrepTime) => updateExercise(index, { prepTime: newPrepTime })}
                        onUpdateAttachment={(newAttachment) => updateExercise(index, { attachment: newAttachment })}
                        onUpdateEquipment={(newEquipment) => updateExercise(index, { equipment: newEquipment })}
                        onUpdateMovementType={(newMovementType) => updateExercise(index, { movementType: newMovementType })}
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
    }, [currentIndex, completeSet, updateExercise, removeExercise, reorderExercises, exercises, latestBodyWeight, router]);

    return (
        <View style={{ flex: 1 }}>
            <DetailScreenHeader onToggleView={onToggleView} />

            {/* Left Edge Vertical Progress Bar */}
            {exercises.length > 0 && (
                <View 
                    style={{
                        position: 'absolute',
                        left: 0,
                        top: '25%',
                        height: '50%',
                        width: 9,
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        zIndex: 100,
                    }}
                >
                    {exercises.map((ex, idx) => {
                        const isCurrentEx = idx === currentIndex;
                        const setsNum = typeof ex.sets === 'string' ? parseInt(ex.sets, 10) : (typeof ex.sets === 'number' ? ex.sets : 0);
                        const exTotalSets = isNaN(setsNum) ? 0 : setsNum;
                        const exCompletedSets = ex.completedSets || 0;
                        const exProgress = exTotalSets > 0 ? (exCompletedSets / exTotalSets) : 0;
                        
                        return (
                            <View 
                                key={idx}
                                style={{
                                    flex: 1,
                                    width: isCurrentEx ? 9 : 5,
                                    backgroundColor: 'rgba(0,0,0,0.25)',
                                    marginBottom: idx === exercises.length - 1 ? 0 : 3,
                                    borderRadius: 9999,
                                    overflow: 'hidden',
                                }}
                            >
                                <View 
                                    style={{
                                        width: '100%',
                                        height: `${exProgress * 100}%`,
                                        backgroundColor: theme.primary,
                                        borderRadius: 9999,
                                    }}
                                />
                            </View>
                        );
                    })}
                </View>
            )}
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
                initialNumToRender={4}
                maxToRenderPerBatch={4}
                windowSize={5}
                onScroll={handleScroll}
                scrollEventThrottle={16}
            />

            <RestTimerBar />

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
        </View>
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
    onUpdatePrepTime,
    onUpdateAttachment,
    onUpdateEquipment,
    onUpdateMovementType,
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
    onUpdatePrepTime?: (prepTime: number) => void;
    onUpdateAttachment?: (attachment: string) => void;
    onUpdateEquipment?: (equipment: string) => void;
    onUpdateMovementType?: (movementType: string) => void;
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
            onUpdatePrepTime={onUpdatePrepTime}
            onUpdateAttachment={onUpdateAttachment}
            onUpdateEquipment={onUpdateEquipment}
            onUpdateMovementType={onUpdateMovementType}
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
