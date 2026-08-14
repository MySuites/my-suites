import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Keyboard, FlatList, useWindowDimensions, TouchableOpacity, Modal, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useActiveWorkout, useActiveWorkoutTimer } from '../../providers/ActiveWorkoutProvider';
import { useWorkoutManager } from '../../providers/WorkoutManagerProvider';
import { useRouter } from 'expo-router';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { ExerciseCard } from '../exercises/ExerciseCard';
import { ScreenHeader } from '../ui/ScreenHeader';
import { RaisedCard, IconSymbol, useUITheme } from '@mysuite/ui';
import { formatSeconds } from '../../utils/formatting';
import { RestTimerBar } from './ActiveWorkoutDetailScreen';
import { default as ExercisesScreen } from '../../app/(tabs)/exercises';
import { isOutdoorGpsExercise } from '../../utils/workout-logic';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

function ActiveScreenHeader({ onToggleView, activeSetIndex, onAddExercise }: { onToggleView: () => void; activeSetIndex: number; onAddExercise: () => void }) {
    const theme = useUITheme();
    const { isRunning, workoutSeconds } = useActiveWorkoutTimer();
    const { exercises, currentIndex, updateExercise, removeExercise, reorderExercises } = useActiveWorkout();

    const currentExercise = exercises[currentIndex];
    const exerciseName = currentExercise?.name || "Current Exercise";

    const [isMenuVisible, setIsMenuVisible] = useState(false);
    const [menuPosition, setMenuPosition] = useState<{ top: number; right: number } | null>(null);
    const menuButtonRef = useRef<View>(null);
    const [isReorderVisible, setIsReorderVisible] = useState(false);

    const renderReorderItem = ({ item, drag, isActive }: RenderItemParams<typeof exercises[number]>) => (
        <ScaleDecorator>
            <TouchableOpacity
                onPressIn={drag}
                disabled={isActive}
                className={`flex-row items-center justify-between px-4 py-3.5 mb-2 rounded-xl ${isActive ? 'bg-light dark:bg-dark' : 'bg-lighter dark:bg-dark-lighter'}`}
            >
                <Text className="text-base font-medium text-light dark:text-dark flex-1" numberOfLines={1}>
                    {item.name}
                </Text>
                <IconSymbol name="line.3.horizontal" size={18} color={theme.textMuted || '#888'} />
            </TouchableOpacity>
        </ScaleDecorator>
    );

    const handleOpenMenu = () => {
        menuButtonRef.current?.measure((_x: number, _y: number, _width: number, height: number, _pageX: number, pageY: number) => {
            setMenuPosition({ top: pageY + height + 5, right: 16 });
            setIsMenuVisible(true);
        });
    };

    const handleAddSet = () => {
        if (!currentExercise) return;
        const nextSetIndex = currentExercise.sets;
        const previousTarget = currentExercise.setTargets?.[nextSetIndex - 1];
        const newTarget = previousTarget ? { ...previousTarget } : { weight: 0, reps: currentExercise.reps };
        const currentTargets = currentExercise.setTargets ? [...currentExercise.setTargets] : [];
        while (currentTargets.length < nextSetIndex) {
            currentTargets.push({ weight: 0, reps: currentExercise.reps });
        }
        currentTargets[nextSetIndex] = newTarget;
        updateExercise(currentIndex, {
            sets: currentExercise.sets + 1,
            setTargets: currentTargets
        });
    };

    const handleDeleteSet = () => {
        if (!currentExercise) return;
        const setIndex = activeSetIndex;
        const currentTarget = currentExercise.sets;
        const currentSetTargets = currentExercise.setTargets ? [...currentExercise.setTargets] : [];
        if (setIndex < currentSetTargets.length) {
            currentSetTargets.splice(setIndex, 1);
        }

        let newCompletedIndices = [...(currentExercise.completedIndices || [])];
        newCompletedIndices = newCompletedIndices
            .filter(idx => idx !== setIndex)
            .map(idx => idx > setIndex ? idx - 1 : idx);

        updateExercise(currentIndex, {
            setTargets: currentSetTargets,
            completedIndices: newCompletedIndices,
            completedSets: newCompletedIndices.length,
            sets: Math.max(0, currentTarget - 1)
        });
    };

    return (
        <>
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
                <View ref={menuButtonRef}>
                    <RaisedCard
                        onPress={handleOpenMenu}
                        testID="active-workout-menu-btn"
                        className="h-12 w-12 active:h-11 p-0 bg-lighter dark:bg-dark-lighter items-center justify-center"
                        style={{ borderRadius: 9999 }}
                    >
                        <IconSymbol name="ellipsis" size={22} className="text-primary dark:text-primary-dark" />
                    </RaisedCard>
                </View>
            }
            className="z-[1001] border-b-0"
        />

        <Modal
            visible={isMenuVisible}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setIsMenuVisible(false)}
        >
            <Pressable className="flex-1" onPress={() => setIsMenuVisible(false)}>
                <View className="flex-1 bg-black/25" />

                <RaisedCard
                    className="absolute w-44 p-1.5 bg-light dark:bg-dark-lighter rounded-xl"
                    style={{
                        top: menuPosition?.top || 100,
                        right: menuPosition?.right || 16,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 6 },
                        shadowOpacity: 0.15,
                        shadowRadius: 10,
                        elevation: 8
                    }}
                >
                    <TouchableOpacity
                        onPress={() => {
                            setIsMenuVisible(false);
                            onAddExercise();
                        }}
                        className="flex-row items-center p-2.5 rounded-lg active:bg-black/5 dark:active:bg-white/5"
                    >
                        <IconSymbol name="plus.circle" size={16} color={theme.primary} style={{ marginRight: 10 }} />
                        <Text className="text-primary dark:text-primary-dark font-semibold text-sm">Add Exercise</Text>
                    </TouchableOpacity>

                    <View className="h-[1px] bg-black/5 dark:bg-white/5 my-0.5" />

                    <TouchableOpacity
                        onPress={() => {
                            setIsMenuVisible(false);
                            handleAddSet();
                        }}
                        className="flex-row items-center p-2.5 rounded-lg active:bg-black/5 dark:active:bg-white/5"
                    >
                        <IconSymbol name="plus" size={16} color={theme.primary} style={{ marginRight: 10 }} />
                        <Text className="text-primary dark:text-primary-dark font-semibold text-sm">Add Set</Text>
                    </TouchableOpacity>

                    <View className="h-[1px] bg-black/5 dark:bg-white/5 my-0.5" />

                    <TouchableOpacity
                        onPress={() => {
                            setIsMenuVisible(false);
                            Alert.alert(
                                'Delete Set',
                                `Delete set ${activeSetIndex + 1}? This can't be undone.`,
                                [
                                    { text: 'Cancel', style: 'cancel' },
                                    { text: 'Delete', style: 'destructive', onPress: handleDeleteSet },
                                ]
                            );
                        }}
                        className="flex-row items-center p-2.5 rounded-lg active:bg-danger/10"
                    >
                        <IconSymbol name="trash.fill" size={16} color={theme.danger} style={{ marginRight: 10 }} />
                        <Text className="text-danger font-semibold text-sm">Delete Set</Text>
                    </TouchableOpacity>

                    <View className="h-[1px] bg-black/5 dark:bg-white/5 my-0.5" />

                    <TouchableOpacity
                        onPress={() => {
                            setIsMenuVisible(false);
                            Alert.alert(
                                'Remove Exercise',
                                `Remove "${exerciseName}" from this workout? This can't be undone.`,
                                [
                                    { text: 'Cancel', style: 'cancel' },
                                    { text: 'Remove', style: 'destructive', onPress: () => removeExercise(currentIndex) },
                                ]
                            );
                        }}
                        className="flex-row items-center p-2.5 rounded-lg active:bg-danger/10"
                    >
                        <IconSymbol name="trash.fill" size={16} color={theme.danger} style={{ marginRight: 10 }} />
                        <Text className="text-danger font-semibold text-sm">Remove Exercise</Text>
                    </TouchableOpacity>

                    <View className="h-[1px] bg-black/5 dark:bg-white/5 my-0.5" />

                    <TouchableOpacity
                        onPress={() => {
                            setIsMenuVisible(false);
                            setIsReorderVisible(true);
                        }}
                        className="flex-row items-center p-2.5 rounded-lg active:bg-black/5 dark:active:bg-white/5"
                    >
                        <IconSymbol name="line.3.horizontal" size={16} color={theme.primary} style={{ marginRight: 10 }} />
                        <Text className="text-primary dark:text-primary-dark font-semibold text-sm">Reorder Exercises</Text>
                    </TouchableOpacity>

                    <View className="h-[1px] bg-black/5 dark:bg-white/5 my-0.5" />

                    <TouchableOpacity
                        onPress={() => setIsMenuVisible(false)}
                        className="flex-row items-center p-2.5 rounded-lg active:bg-black/5 dark:active:bg-white/5"
                    >
                        <IconSymbol name="xmark" size={16} color={theme.textMuted || '#888'} style={{ marginRight: 10 }} />
                        <Text className="text-light-muted dark:text-dark-muted font-semibold text-sm">Cancel</Text>
                    </TouchableOpacity>
                </RaisedCard>
            </Pressable>
        </Modal>

        <Modal
            visible={isReorderVisible}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setIsReorderVisible(false)}
        >
            <GestureHandlerRootView style={{ flex: 1 }}>
                <View className="flex-1 justify-end bg-black/50">
                    <View className="bg-light dark:bg-dark-lighter rounded-t-3xl p-6 pb-10" style={{ maxHeight: '75%' }}>
                        <View className="flex-row items-center justify-between mb-4">
                            <Text className="text-xl font-bold text-light dark:text-dark">Reorder Exercises</Text>
                            <TouchableOpacity onPress={() => setIsReorderVisible(false)} className="p-2">
                                <IconSymbol name="xmark" size={24} color={theme.textMuted || '#888'} />
                            </TouchableOpacity>
                        </View>
                        <Text className="text-sm text-light-muted dark:text-dark-muted mb-4">
                            Drag a row to reorder.
                        </Text>
                        <DraggableFlatList
                            data={exercises}
                            keyExtractor={(item, index) => `${item.id}-${index}`}
                            renderItem={renderReorderItem}
                            onDragEnd={({ from, to }) => reorderExercises(from, to)}
                            containerStyle={{ flexGrow: 0 }}
                        />
                    </View>
                </View>
            </GestureHandlerRootView>
        </Modal>
        </>
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
        addExercise,
        isGpsTrackingActive,
    } = useActiveWorkout();
    const { isRpeEnabled, isHapticsEnabled, isProgressiveOverloadEnabled, progressiveOverloadRepCeiling } = useWorkoutManager();

    const [isAddingExercise, setIsAddingExercise] = useState(false);

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

    const flatListRef = useRef<FlatList>(null);
    const [containerHeight, setContainerHeight] = useState(0);
    const [activeSetIndices, setActiveSetIndices] = useState<Record<number, number>>({});
    const lastSelectedIndexRef = useRef(currentIndex);
    // True only while the user is physically dragging/momentum-scrolling the
    // pager. Live index detection is gated on this so programmatic scrolls
    // (auto-advance to next exercise) don't momentarily revert currentIndex.
    const isUserScrollingRef = useRef(false);
    // True while a scrollToIndex we issued ourselves is animating. Its
    // onMomentumScrollEnd still fires handleScroll, which independently
    // recomputes the index from contentOffset/containerHeight — with only two
    // pages, a one-pixel containerHeight jitter (e.g. the outdoor exercise's
    // MapView mounting/unmounting mid-scroll) is enough to round that back to
    // the *other* page, fighting the index we just set and flickering the bar
    // between the two exercises. Skip that recompute for our own scrolls.
    const isProgrammaticScrollRef = useRef(false);

    // Scroll to the active exercise index when it changes. Deliberately only
    // depends on currentIndex — containerHeight can jitter by a pixel or two
    // when a page's content changes what it mounts (e.g. the outdoor
    // exercise's native MapView mounting/unmounting causes the wrapper to
    // re-measure), and re-running this on every such jitter reissues
    // scrollToIndex against an already-correct position, producing a small
    // extra "snap" right after the page has already landed correctly.
    useEffect(() => {
        if (flatListRef.current && containerHeight > 0 && exercises.length > 0) {
            if (lastSelectedIndexRef.current !== currentIndex) {
                lastSelectedIndexRef.current = currentIndex;
                isProgrammaticScrollRef.current = true;
                flatListRef.current.scrollToIndex({
                    index: currentIndex,
                    animated: true,
                });
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentIndex]);

    // Live page detection during scroll — updates currentIndex the moment the
    // scroll crosses the halfway point, instead of waiting for momentum to
    // settle (onMomentumScrollEnd), so the name/progress/active styling switch
    // to the new exercise without the ~1s lag. Setting lastSelectedIndexRef
    // first prevents the scroll-to-active effect from fighting the user.
    const handleScrollLive = (e: any) => {
        if (containerHeight <= 0 || !isUserScrollingRef.current) return;
        const index = Math.round(e.nativeEvent.contentOffset.y / containerHeight);
        if (index >= 0 && index < exercises.length && index !== lastSelectedIndexRef.current) {
            lastSelectedIndexRef.current = index;
            setCurrentIndex(index);
        }
    };

    const handleScrollBeginDrag = () => {
        isUserScrollingRef.current = true;
        isProgrammaticScrollRef.current = false;
    };

    const handleScroll = (e: any) => {
        isUserScrollingRef.current = false;
        if (isProgrammaticScrollRef.current) {
            isProgrammaticScrollRef.current = false;
            return;
        }
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

    // Drives FlatList row re-render on exercise swipe or set change.
    // Reference changes only when currentIndex or activeSetIndices change,
    // so the active-set styling updates immediately instead of lagging.
    const listExtraData = React.useMemo(
        () => ({ currentIndex, activeSetIndices }),
        [currentIndex, activeSetIndices]
    );

    const renderExerciseItem = React.useCallback(({ item: exercise, index }: { item: any; index: number }) => {
        if (containerHeight <= 0) return null;
        return (
            <View
                style={{
                    height: containerHeight,
                    paddingBottom: 0,
                    overflow: 'hidden',
                }}
            >
                <ExerciseCard
                    exercise={exercise}
                    isCurrent={index === currentIndexRef.current}
                    preloadWheels={Math.abs(index - currentIndexRef.current) <= 1}
                    // Preloaded neighbors (±1) mount their heavy wheels/SVG clock off
                    // the swipe's critical path, but if both neighbors used the same
                    // flat delay they'd still land in the same commit as each other —
                    // exactly the "2 SVG clocks + a reps wheel all mount at once"
                    // pile-up that trips VirtualizedList's slow-update warning.
                    // Stagger prev/current/next onto distinct frames instead.
                    wheelsReadyDelayMs={
                        index === currentIndexRef.current
                            ? 60
                            : index < currentIndexRef.current
                                ? 260
                                : 460
                    }
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
                    isRpeEnabled={isRpeEnabled}
                    isHapticsEnabled={isHapticsEnabled}
                    isProgressiveOverloadEnabled={isProgressiveOverloadEnabled}
                    progressiveOverloadRepCeiling={progressiveOverloadRepCeiling}
                    isGpsTrackingActive={isGpsTrackingActive}
                />
            </View>
        );
    }, [containerHeight, theme, latestBodyWeight, completeSet, updateExercise, router]);

    return (
        <View style={{ flex: 1 }}>
            <ActiveScreenHeader onToggleView={onToggleView} activeSetIndex={activeSetIndices[currentIndex] || 0} onAddExercise={handleOpenAddExercise} />
            
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
                        const exTotalSets = isOutdoorGpsExercise(ex) ? 1 : (isNaN(setsNum) ? 0 : setsNum);
                        const exCompletedSets = ex.completedSets || 0;
                        const exProgress = exTotalSets > 0 ? (exCompletedSets / exTotalSets) : 0;
                        
                        return (
                            <View 
                                key={idx}
                                style={{
                                    flex: 1,
                                    width: isCurrentEx ? 9 : 5,
                                    backgroundColor: theme.dark ? '#4a4a4a' : theme.textMuted,
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
                            onPress={handleOpenAddExercise}
                            className="px-6 py-3 bg-primary"
                        >
                            <Text className="text-white font-bold text-center">
                                + Add Exercise
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
                                    style={{ flex: 1 }}
                                    data={exercises}
                                    renderItem={renderExerciseItem}
                                    extraData={listExtraData}
                                    keyExtractor={(item, index) => `${item.id}-${index}`}
                                    // Authoritative page positions, independent of each page's
                                    // actual rendered/measured content height — without this,
                                    // FlatList falls back to runtime-measured cell layout for
                                    // its internal scroll bookkeeping, and a page whose content
                                    // differs a lot from the rest (e.g. the outdoor exercise's
                                    // map layout) can throw off where neighboring pages land,
                                    // producing a directional, straddled-between-two-pages scroll.
                                    getItemLayout={(_, index) => ({
                                        length: containerHeight,
                                        offset: containerHeight * index,
                                        index,
                                    })}
                                    // Deliberately NOT pagingEnabled: that snaps to the
                                    // scrollview's own frame height, while snapToInterval snaps
                                    // to containerHeight. When those two differ even slightly
                                    // (e.g. the outdoor page's native MapView re-measuring the
                                    // frame), the two snapping mechanisms fight — the list
                                    // settles via one, then gets yanked a few px by the other,
                                    // which is the "lands correct, then snaps up" glitch. Use a
                                    // single snapping mechanism (snapToInterval) instead.
                                    showsVerticalScrollIndicator={false}
                                    onScrollBeginDrag={handleScrollBeginDrag}
                                    onScroll={handleScrollLive}
                                    onMomentumScrollEnd={handleScroll}
                                    scrollEventThrottle={16}
                                    onScrollToIndexFailed={handleScrollToIndexFailed}
                                    decelerationRate="fast"
                                    snapToInterval={containerHeight}
                                    snapToAlignment="start"
                                    disableIntervalMomentum={true}
                                    initialNumToRender={1}
                                    windowSize={3}
                                    maxToRenderPerBatch={1}
                                    // False: this list's items each contain their own nested
                                    // horizontal ScrollView (the sets pager) — with clipping
                                    // enabled, iOS sometimes fails to clip the previous/next
                                    // page correctly, letting its header bleed into view at
                                    // the current page's edge during/after a swipe.
                                    removeClippedSubviews={false}
                                />
                            )}
                        </View>

                        {/* Vertical Switcher Footer */}
                        <View style={{
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            paddingTop: 4,
                            paddingBottom: 16,
                            paddingHorizontal: 20,
                            width: '100%'
                        }}>
                            {/* Set Completion Button */}
                             {(() => {
                                  const currentExercise = exercises[currentIndex];
                                  if (!currentExercise) return null;
                                  
                                  const totalSets = isOutdoorGpsExercise(currentExercise)
                                      ? 1
                                      : Math.max(currentExercise.sets, currentExercise.logs?.length || 0);
                                  if (totalSets === 0) return null;
                                  
                                  const activeSetIndex = activeSetIndices[currentIndex] || 0;
                                  const isCompleted = currentExercise.completedIndices?.includes(activeSetIndex) || false;
                                  
                                  return (
                                      <>
                                          {/* Pagination Dots (Set Indicator) — always rendered (space reserved via
                                              opacity, not conditional mounting) so the footer's height never
                                              changes based on which exercise is current. The outdoor exercise is
                                              the only one with totalSets clamped to 1 (no dots to show); if this
                                              row were unmounted instead of just hidden, swiping to/from it would
                                              change the footer's height, which changes containerHeight (they share
                                              the same flex parent), which desyncs the already-settled scroll
                                              position from the newly relaid-out page heights — the exact
                                              "lands right, then snaps" glitch reported around the outdoor exercise. */}
                                          <View style={{ flexDirection: 'row', gap: 6, justifyContent: 'center', marginBottom: 16, height: 6, opacity: totalSets > 1 ? 1 : 0 }}>
                                              {totalSets > 1 && Array.from({ length: totalSets }).map((_, i) => {
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
                                                  {isCompleted ? `Set Completed` : `Complete Set`}
                                              </Text>
                                          </RaisedCard>
                                      </>
                                  );
                              })()}
                         </View>
                    </View>
                )}
            </View>

            <RestTimerBar raised={isAddingExercise} />

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
