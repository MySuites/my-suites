import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Keyboard, FlatList, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useActiveWorkout, useActiveWorkoutTimer } from '../../providers/ActiveWorkoutProvider';
import { useRouter } from 'expo-router';
import { ExerciseCard } from '../exercises/ExerciseCard';
import { ScreenHeader } from '../ui/ScreenHeader';
import { RaisedCard, IconSymbol, useUITheme } from '@mysuite/ui';
import { formatSeconds } from '../../utils/formatting';
import { RestTimerBar } from './ActiveWorkoutDetailScreen';

function ActiveScreenHeader({ onToggleView }: { onToggleView: () => void }) {
    const router = useRouter();
    const { isRunning, workoutSeconds } = useActiveWorkoutTimer();
    const { exercises, currentIndex, pauseWorkout, resumeWorkout } = useActiveWorkout();
    
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
                </View>
            }
            leftAction={
                <RaisedCard 
                    onPress={onToggleView}
                    testID="toggle-detail-btn"
                    className="h-12 w-12 active:h-11 p-0 bg-lighter dark:bg-dark-lighter items-center justify-center"
                    style={{ borderRadius: 9999 }}
                >
                    <IconSymbol name="list.bullet" size={22} className="text-primary dark:text-primary-dark" />
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
                        <IconSymbol name={isRunning ? 'pause.fill' : 'play.fill'} size={20} className="text-primary dark:text-primary-dark" />
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

interface ActiveWorkoutScreenProps {
    onToggleView: () => void;
}

export function ActiveWorkoutScreen({ onToggleView }: ActiveWorkoutScreenProps) {
    const router = useRouter();
    const theme = useUITheme();
    const { height: windowHeight } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const {
        exercises,
        currentIndex,
        setCurrentIndex,
        completeSet,
        updateExercise,
        latestBodyWeight,
    } = useActiveWorkout();

    const flatListRef = useRef<FlatList>(null);
    const [containerHeight, setContainerHeight] = useState(0);
    const [activeSetIndices, setActiveSetIndices] = useState<Record<number, number>>({});
    const lastSelectedIndexRef = useRef(currentIndex);

    // Scroll to the active exercise index when it changes
    useEffect(() => {
        if (flatListRef.current && containerHeight > 0 && exercises.length > 0) {
            if (lastSelectedIndexRef.current !== currentIndex) {
                lastSelectedIndexRef.current = currentIndex;
                flatListRef.current.scrollToIndex({
                    index: currentIndex,
                    animated: true,
                });
            }
        }
    }, [currentIndex, containerHeight, exercises.length]);

    const handleScroll = (e: any) => {
        if (containerHeight <= 0) return;
        const yOffset = e.nativeEvent.contentOffset.y;
        const index = Math.round(yOffset / containerHeight);
        if (index >= 0 && index < exercises.length && index !== currentIndex) {
            lastSelectedIndexRef.current = index;
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

    const currentIndexRef = useRef(currentIndex);
    currentIndexRef.current = currentIndex;
    const activeSetIndicesRef = useRef(activeSetIndices);
    activeSetIndicesRef.current = activeSetIndices;

    const renderExerciseItem = React.useCallback(({ item: exercise, index }: { item: any; index: number }) => {
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
                    isCurrent={index === currentIndexRef.current}
                    horizontalSets={true}
                    showName={false}
                    activeSetIndex={activeSetIndicesRef.current[index] || 0}
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
    }, [containerHeight, theme, latestBodyWeight, completeSet, updateExercise, router]);

    return (
        <View style={{ flex: 1 }}>
            <ActiveScreenHeader onToggleView={onToggleView} />
            
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
            
            <View 
                style={{ 
                    flex: 1, 
                    paddingTop: insets.top + (windowHeight < 900 ? 75 : 95), 
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
                                    extraData={activeSetIndices}
                                    keyExtractor={(item, index) => `${item.id}-${index}`}
                                    pagingEnabled={true}
                                    showsVerticalScrollIndicator={false}
                                    onMomentumScrollEnd={handleScroll}
                                    scrollEventThrottle={16}
                                    onScrollToIndexFailed={handleScrollToIndexFailed}
                                    decelerationRate="fast"
                                    snapToInterval={containerHeight}
                                    snapToAlignment="start"
                                    initialNumToRender={1}
                                    windowSize={2}
                                    maxToRenderPerBatch={1}
                                    removeClippedSubviews={true}
                                />
                            )}
                        </View>

                        {/* Vertical Switcher Footer */}
                        <View style={{ 
                            flexDirection: 'column', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
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
                                      <>
                                          {/* Pagination Dots (Set Indicator) */}
                                          {totalSets > 1 && (
                                              <View style={{ flexDirection: 'row', gap: 6, justifyContent: 'center', marginBottom: 16 }}>
                                                  {Array.from({ length: totalSets }).map((_, i) => {
                                                      const isActive = i === activeSetIndex;
                                                      const isCompletedSet = currentExercise.completedIndices?.includes(i);
                                                      return (
                                                          <View 
                                                              key={i}
                                                              style={{
                                                                  width: isActive ? 16 : 6,
                                                                  height: 6,
                                                                  borderRadius: 3,
                                                                  backgroundColor: isActive 
                                                                      ? (isCompletedSet ? theme.primary : theme.text)
                                                                      : (isCompletedSet ? `${theme.primary}50` : `${theme.textMuted}30`),
                                                              }}
                                                          />
                                                      );
                                                  })}
                                              </View>
                                          )}

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
                                      </>
                                  );
                              })()}
                         </View>
                    </View>
                )}
            </View>

            <RestTimerBar />
        </View>
    );
}
