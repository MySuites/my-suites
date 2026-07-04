import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Keyboard, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useActiveWorkout, useActiveWorkoutTimer } from '../../providers/ActiveWorkoutProvider';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { ExerciseCard } from '../exercises/ExerciseCard';
import { ScreenHeader } from '../ui/ScreenHeader';
import { RaisedCard, IconSymbol, useUITheme } from '@mysuite/ui';
import { formatSeconds, formatRestTime } from '../../utils/formatting';

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

interface FocusedWorkoutScreenProps {
    onToggleView: () => void;
}

export function FocusedWorkoutScreen({ onToggleView }: FocusedWorkoutScreenProps) {
    const router = useRouter();
    const theme = useUITheme();
    const insets = useSafeAreaInsets();
    const {
        exercises,
        currentIndex,
        setCurrentIndex,
        completeSet,
        updateExercise,
        setExpanded,
        latestBodyWeight,
    } = useActiveWorkout();
    
    const { isRunning, workoutSeconds, restSeconds, startRestTimer } = useActiveWorkoutTimer();

    const flatListRef = useRef<FlatList>(null);
    const [containerHeight, setContainerHeight] = useState(0);
    const [activeSetIndices, setActiveSetIndices] = useState<Record<number, number>>({});

    // Scroll to the active exercise index when it changes
    useEffect(() => {
        if (flatListRef.current && containerHeight > 0 && exercises.length > 0) {
            flatListRef.current.scrollToIndex({
                index: currentIndex,
                animated: true,
            });
        }
    }, [currentIndex, containerHeight, exercises.length]);

    const handleScrollEnd = (e: any) => {
        if (containerHeight <= 0) return;
        const yOffset = e.nativeEvent.contentOffset.y;
        const index = Math.round(yOffset / containerHeight);
        if (index >= 0 && index < exercises.length && index !== currentIndex) {
            setCurrentIndex(index);
        }
    };

    const handleScrollToIndexFailed = (info: any) => {
        setTimeout(() => {
            flatListRef.current?.scrollToIndex({
                index: info.index,
                animated: false,
            });
        }, 100);
    };

    const totalSets = exercises.reduce((acc, ex) => {
        const setsNum = typeof ex.sets === 'string' ? parseInt(ex.sets, 10) : (typeof ex.sets === 'number' ? ex.sets : 0);
        return acc + (isNaN(setsNum) ? 0 : setsNum);
    }, 0);
    const completedSets = exercises.reduce((acc, ex) => acc + (ex.completedSets || 0), 0);
    const progressPercent = totalSets > 0 ? (completedSets / totalSets) * 100 : 0;

    const renderHeader = () => {
        const currentExercise = exercises[currentIndex];
        const exerciseName = currentExercise?.name || "Current Exercise";

        return (
            <ScreenHeader
                title={
                    <View className="flex-col items-center pt-2">
                        <Text 
                            className="text-lg font-bold text-light dark:text-dark text-center" 
                            numberOfLines={1}
                            pointerEvents="none"
                        >
                            {exerciseName}
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
                        {totalSets > 0 && (
                            <View className="w-32 h-1.5 bg-black/10 dark:bg-white/10 rounded-full mt-2 overflow-hidden">
                                <View 
                                    className="h-full bg-primary" 
                                    style={{ width: `${progressPercent}%` }} 
                                />
                            </View>
                        )}
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
                        onPress={onToggleView}
                        testID="toggle-detail-btn"
                        className="h-12 w-12 active:h-11 p-0 bg-lighter dark:bg-dark-lighter items-center justify-center"
                        style={{ borderRadius: 9999 }}
                    >
                        <IconSymbol name="list.bullet" size={22} className="text-primary dark:text-primary-dark" />
                    </RaisedCard>
                }
                className="z-[1001] border-b-0"
            />
        );
    };

    const renderExerciseItem = ({ item: exercise, index }: { item: any; index: number }) => {
        if (containerHeight <= 0) return null;
        return (
            <View 
                style={{ 
                    height: containerHeight, 
                    paddingBottom: 24,
                }}
            >
                <ExerciseCard 
                    exercise={exercise}
                    isCurrent={true}
                    horizontalSets={true}
                    showName={false}
                    activeSetIndex={activeSetIndices[index] || 0}
                    onActiveSetChange={(setIdx) => {
                        setActiveSetIndices(prev => ({
                            ...prev,
                            [index]: setIdx
                        }));
                    }}
                    onRemoveExercise={undefined}
                    onMoveUp={undefined}
                    onMoveDown={undefined}
                    onDrag={undefined}
                    onPressName={() => {
                        Keyboard.dismiss();
                        router.push({
                            pathname: '/exercises/details' as any,
                            params: { exercise: JSON.stringify(exercise) }
                        });
                    }}
                    theme={theme}
                    latestBodyWeight={latestBodyWeight}
                    onCompleteSet={(setIndex) => {
                        completeSet(index, setIndex, {});
                    }}
                    onUpdateRestTime={(newRestTime) => updateExercise(index, { restTime: newRestTime })}
                    onUpdatePrepTime={(newPrepTime) => updateExercise(index, { prepTime: newPrepTime })}
                    onUpdateAttachment={(newAttachment) => updateExercise(index, { attachment: newAttachment })}
                    onUpdateEquipment={(newEquipment) => updateExercise(index, { equipment: newEquipment })}
                    onUpdateMovementType={(newMovementType) => updateExercise(index, { movementType: newMovementType })}
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
                    onAddSet={undefined}
                    onDeleteSet={undefined}
                />
            </View>
        );
    };

    return (
        <View style={{ flex: 1 }}>
            {renderHeader()}
            
            <View 
                style={{ 
                    flex: 1, 
                    paddingTop: insets.top + 80, 
                    paddingHorizontal: 16,
                }}
            >
                {exercises.length === 0 ? (
                    <View className="flex-1 items-center justify-center py-20">
                        <Text className="text-xl text-light dark:text-dark mb-6 text-center">
                            No exercises found
                        </Text>
                        <RaisedCard
                            onPress={onToggleView}
                            className="px-6 py-3 bg-primary"
                        >
                            <Text className="text-white font-bold text-center">
                                Go to Detail view to Add Exercises
                            </Text>
                        </RaisedCard>
                    </View>
                ) : (
                    <View style={{ flex: 1 }}>
                        {/* Exercises List Pager Wrapper */}
                        <View 
                            style={{ flex: 1 }}
                            onLayout={(e) => {
                                const height = e.nativeEvent.layout.height;
                                setContainerHeight(height);
                            }}
                        >
                            {containerHeight > 0 && (
                                <FlatList
                                    ref={flatListRef}
                                    data={exercises}
                                    renderItem={renderExerciseItem}
                                    keyExtractor={(item, index) => `${item.id}-${index}`}
                                    pagingEnabled={true}
                                    showsVerticalScrollIndicator={false}
                                    onMomentumScrollEnd={handleScrollEnd}
                                    onScrollToIndexFailed={handleScrollToIndexFailed}
                                    decelerationRate="fast"
                                    snapToInterval={containerHeight}
                                    snapToAlignment="start"
                                />
                            )}
                        </View>

                        {/* Vertical Switcher Footer */}
                        <View style={{ 
                            flexDirection: 'column', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            marginTop: 12,
                            paddingBottom: Math.max(16, insets.bottom) + 16,
                            paddingHorizontal: 20,
                            width: '100%'
                        }}>
                            {/* Set Completion Button */}
                            {(() => {
                                const currentExercise = exercises[currentIndex];
                                if (!currentExercise) return null;
                                
                                const totalSets = Math.max(currentExercise.sets, currentExercise.logs?.length || 0);
                                if (totalSets === 0) return null;
                                
                                const activeSetIndex = activeSetIndices[currentIndex] || 0;
                                const isCompleted = currentExercise.completedIndices?.includes(activeSetIndex) || false;
                                
                                return (
                                    <RaisedCard
                                        onPress={() => {
                                            const wasCompleted = isCompleted;
                                            if (!wasCompleted) {
                                                completeSet(currentIndex, activeSetIndex, {});
                                            }
                                            
                                            if (activeSetIndex < totalSets - 1) {
                                                setTimeout(() => {
                                                    setActiveSetIndices(prev => ({
                                                        ...prev,
                                                        [currentIndex]: activeSetIndex + 1
                                                    }));
                                                }, 300);
                                            } else if (currentIndex < exercises.length - 1) {
                                                setTimeout(() => {
                                                    setActiveSetIndices(prev => ({
                                                        ...prev,
                                                        [currentIndex + 1]: prev[currentIndex + 1] || 0
                                                    }));
                                                    setCurrentIndex(currentIndex + 1);
                                                }, 300);
                                            }
                                        }}
                                        activeOpacity={0.8}
                                        className="border-0 w-full py-4 px-8 rounded-full flex-row items-center justify-center bg-primary mb-4"
                                    >
                                        <Text style={{
                                            fontSize: 16,
                                            fontWeight: '700',
                                            color: "#ffffff"
                                        }}>
                                            {isCompleted ? `Set ${activeSetIndex + 1} Completed` : `Complete Set ${activeSetIndex + 1}`}
                                        </Text>
                                    </RaisedCard>
                                );
                            })()}

                            <Text style={{ fontSize: 15, fontWeight: '700', color: theme.textMuted }}>
                                Exercise {currentIndex + 1} of {exercises.length}
                            </Text>
                        </View>
                    </View>
                )}
            </View>

            {restSeconds > 0 && (
                <RestTimerBar 
                    seconds={restSeconds} 
                    onSkip={() => startRestTimer(0)} 
                    onAdjust={(amt) => startRestTimer(Math.max(0, restSeconds + amt))}
                />
            )}
        </View>
    );
}
