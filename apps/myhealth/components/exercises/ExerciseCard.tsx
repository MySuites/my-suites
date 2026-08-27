import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable, ScrollView, useWindowDimensions, Alert } from 'react-native';
import { AttachmentPicker, ATTACHMENT_OPTIONS } from '../workouts/AttachmentPicker';
import { EquipmentPicker } from '../workouts/EquipmentPicker';
import { MovementTypePicker } from '../workouts/MovementTypePicker';
import { RestTimerPicker } from '../workouts/RestTimerPicker';
import { Exercise } from '../../providers/WorkoutManagerProvider';
import { RaisedCard, IconSymbol } from '@mysuite/ui';
import { SetRow, getExerciseFields } from '../workouts/SetRow';
import { formatRestTime } from '../../utils/formatting';
import { RPEPicker } from '../workouts/RPEPicker';

import { inferEquipment, inferMovementType } from '../../providers/DataRepository';
import { isOutdoorGpsExercise as computeIsOutdoorGpsExercise } from '../../utils/workout-logic';
import { useSetPager } from '../../hooks/workouts/useSetPager';
import { ExercisePropertyPillRow } from '../ui/ExercisePropertyPill';
import { SetPagerScrollLockProvider } from './SetPagerScrollLock';

interface ExerciseCardProps {
    exercise: Exercise;
    isCurrent: boolean;
    onCompleteSet: (setIndex: number) => void;
    onUpdateSetTarget?: (index: number, key: 'weight' | 'reps' | 'reps_left' | 'reps_right' | 'duration' | 'distance' | 'rpe', value: string) => void;
    onAddSet?: () => void;
    onDeleteSet?: (index: number) => void;
    onRemoveExercise?: () => void;
    onMoveUp?: () => void;
    onMoveDown?: () => void;
    onPressName?: () => void;
    onUpdateRestTime?: (restTime: number) => void;
    onUpdatePrepTime?: (prepTime: number) => void;
    onUpdateAttachment?: (attachment: string) => void;
    onUpdateEquipment?: (equipment: string) => void;
    onUpdateMovementType?: (movementType: string) => void;
    onDrag?: () => void;

    theme: any;
    latestBodyWeight?: number | null;
    horizontalSets?: boolean;
    activeSetIndex?: number;
    onActiveSetChange?: (index: number) => void;
    showName?: boolean;
    // When true, mount the active set's input wheels even if this card isn't
    // the current one. Used to preload adjacent (prev/next) exercises off-screen
    // so swiping to them shows the real wheel with no placeholder swap.
    preloadWheels?: boolean;
    // How long to wait before mounting the heavy wheel/SVG clock, in ms.
    // Staggered per-card by the caller (current vs. preloaded prev/next) so
    // simultaneously-preloaded neighbors don't all mount in the same commit.
    wheelsReadyDelayMs?: number;
    // Sourced from context once at the screen level and threaded down as
    // plain props, instead of every card/set/wheel subscribing to
    // WorkoutManagerProvider/ActiveWorkoutContext directly - a context
    // value changing (e.g. background sync, any set edit) would otherwise
    // re-render every mounted card regardless of whether these actually
    // changed, since useContext bypasses React.memo entirely.
    isRpeEnabled?: boolean;
    isHapticsEnabled?: boolean;
    isProgressiveOverloadEnabled?: boolean;
    progressiveOverloadRepCeiling?: number;
    isGpsTrackingActive?: boolean;
    activateGpsTrackingIfNeeded?: () => Promise<void>;
}

function ExerciseCardInner({ exercise, isCurrent, onCompleteSet, onUpdateSetTarget, onAddSet, onDeleteSet, onRemoveExercise, onMoveUp, onMoveDown, onDrag, onPressName, onUpdateRestTime, onUpdatePrepTime, onUpdateAttachment, onUpdateEquipment, onUpdateMovementType, theme, latestBodyWeight, horizontalSets, activeSetIndex: propActiveSetIndex, onActiveSetChange, showName, preloadWheels, wheelsReadyDelayMs, isRpeEnabled = false, isHapticsEnabled = true, isProgressiveOverloadEnabled = false, progressiveOverloadRepCeiling, isGpsTrackingActive = false, activateGpsTrackingIfNeeded }: ExerciseCardProps) {
    const [isPickerVisible, setIsPickerVisible] = useState(false);
    const [isMenuVisible, setIsMenuVisible] = useState(false);
    const [menuPosition, setMenuPosition] = useState<{ top: number, right: number } | null>(null);
    const menuButtonRef = useRef<View>(null);
    
    // Attachment Picker state
    const [isAttachmentPickerVisible, setIsAttachmentPickerVisible] = useState(false);

    // Equipment Picker state
    const [isEquipmentPickerVisible, setIsEquipmentPickerVisible] = useState(false);

    // Movement Type Picker state
    const [isMovementTypePickerVisible, setIsMovementTypePickerVisible] = useState(false);

    // RPE Picker state
    const [isRPEPickerVisible, setIsRPEPickerVisible] = useState(false);
    const [rpePickerValue, setRPEPickerValue] = useState<string | undefined>(undefined);
    const [rpePickerIndex, setRPEPickerIndex] = useState<number | null>(null);
    
    // Derived state
    const completedSets = exercise.completedSets || 0;
    const isFinished = completedSets >= exercise.sets;

    const { showWeight, showReps, showDuration, showDistance, showRPE: calculatedShowRPE } = getExerciseFields(exercise.properties, exercise.id);
    const showRPE = calculatedShowRPE && isRpeEnabled;
    
    const isOutdoorGpsExercise = computeIsOutdoorGpsExercise(exercise);
    const isAttachmentSupported = exercise.id in ATTACHMENT_OPTIONS;
    const defaultAttachment = ATTACHMENT_OPTIONS[exercise.id]?.[0];
    const attachment = exercise.attachment || defaultAttachment;
    const equipment = exercise.equipment || inferEquipment(exercise.name);
    const movementType = exercise.movementType || inferMovementType(exercise.name, equipment);
    const isUnilateral = movementType === 'unilateral';

    // Horizontal Sets Paging
    const dimensions = useWindowDimensions();
    const {
        scrollViewRef,
        cardWidth,
        setCardWidth,
        activeSetIndex,
        totalSets,
        isSetPagerScrollEnabled,
        setIsSetPagerScrollEnabled,
        handleDeleteActiveSet,
        handleCompleteSetAndAutoPage,
        handleMomentumScrollEnd,
        handleScrollEndDrag,
    } = useSetPager({
        horizontalSets,
        exerciseSets: exercise.sets,
        logsLength: exercise.logs?.length || 0,
        isOutdoorGpsExercise,
        completedIndices: exercise.completedIndices,
        onCompleteSet,
        onDeleteSet,
        propActiveSetIndex,
        onActiveSetChange,
        initialCardWidth: dimensions.width - 64,
    });

    const handleOpenMenu = () => {
        menuButtonRef.current?.measure((_x: number, _y: number, _width: number, height: number, _pageX: number, pageY: number) => {
            // Position the menu below the button, slightly offset
            setMenuPosition({
                top: pageY + height + 5,
                right: 16 // Standard container padding
            });
            setIsMenuVisible(true);
        });
    };

    return (
        <>
            <View 
                style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingHorizontal: 16,
                    paddingTop: horizontalSets ? 0 : 6,
                    paddingBottom: horizontalSets ? 4 : 4,
                }}
            >
                <View className="flex-1 flex-row items-center">
                    <TouchableOpacity 
                        className="flex-1" 
                        onPress={onPressName} 
                        onLongPress={onDrag}
                        delayLongPress={200}
                        disabled={!onPressName && !onDrag}
                    >
                        {showName !== false && (
                            <Text className="text-lg font-bold text-light dark:text-dark">
                                {exercise.name}
                                {equipment && equipment !== 'none' && (
                                    <Text className="text-sm font-normal text-light-muted dark:text-dark-muted">
                                        {' '}({equipment.charAt(0).toUpperCase() + equipment.slice(1)})
                                    </Text>
                                )}
                            </Text>
                        )}

                        <View style={{ display: isOutdoorGpsExercise ? 'none' : 'flex' }}>
                            <ExercisePropertyPillRow
                                isAttachmentSupported={isAttachmentSupported}
                                attachment={attachment}
                                onPressAttachment={() => setIsAttachmentPickerVisible(true)}
                                equipment={equipment}
                                onPressEquipment={() => setIsEquipmentPickerVisible(true)}
                                movementType={movementType}
                                onPressMovementType={() => setIsMovementTypePickerVisible(true)}
                                showMovementType={false}
                                showAttachment={false}
                                showEquipment={false}
                            />
                        </View>

                    </TouchableOpacity>
                </View>
                <View className="flex-row items-center gap-3">
                    {isFinished && <IconSymbol name="checkmark.circle.fill" size={24} color={theme.primary} />}
                    {onRemoveExercise && (
                        <View ref={menuButtonRef}>
                            <TouchableOpacity 
                                onPress={handleOpenMenu}
                                className="w-11 h-11 items-center justify-center rounded-full active:bg-black/5 dark:active:bg-white/5"
                            >
                                <IconSymbol name="ellipsis" size={22} color={theme.text} />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>

            {/* Exercise Menu Modal */}
            <Modal
                visible={isMenuVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setIsMenuVisible(false)}
            >
                <Pressable 
                    className="flex-1"
                    onPress={() => setIsMenuVisible(false)}
                >
                    {/* Dim background for shadow overlay effect */}
                    <View className="flex-1 bg-black/25" />
                    
                    <RaisedCard 
                        className="absolute w-56 p-1.5 bg-light dark:bg-dark-lighter rounded-xl"
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



                        {onAddSet && (
                            <>
                                <TouchableOpacity
                                    onPress={() => {
                                        setIsMenuVisible(false);
                                        onAddSet();
                                    }}
                                    className="flex-row items-center p-2.5 rounded-lg active:bg-black/5 dark:active:bg-white/5"
                                >
                                    <IconSymbol name="plus" size={16} color={theme.primary} style={{ marginRight: 10 }} />
                                    <Text className="text-primary dark:text-primary-dark font-semibold text-sm">Add Set</Text>
                                </TouchableOpacity>

                                <View className="h-[1px] bg-black/5 dark:bg-white/5 my-0.5" />
                            </>
                        )}

                        {!horizontalSets && (
                            <>
                                <TouchableOpacity
                                    onPress={() => {
                                        setIsMenuVisible(false);
                                        setIsPickerVisible(true);
                                    }}
                                    className="flex-row items-center p-2.5 rounded-lg active:bg-black/5 dark:active:bg-white/5"
                                >
                                    <IconSymbol name="timer" size={16} color={theme.textMuted} style={{ marginRight: 10 }} />
                                    <Text className="text-light dark:text-dark font-semibold text-sm flex-1" style={{ flexShrink: 1 }}>
                                        Rest Timer: {formatRestTime(exercise.restTime ?? 90)}
                                    </Text>
                                </TouchableOpacity>

                                <View className="h-[1px] bg-black/5 dark:bg-white/5 my-0.5" />
                            </>
                        )}

                        {equipment && (
                            <>
                                <TouchableOpacity
                                    onPress={() => {
                                        setIsMenuVisible(false);
                                        setIsEquipmentPickerVisible(true);
                                    }}
                                    className="flex-row items-center p-2.5 rounded-lg active:bg-black/5 dark:active:bg-white/5"
                                >
                                    <IconSymbol name="dumbbell.fill" size={16} color={theme.textMuted} style={{ marginRight: 10 }} />
                                    <Text className="text-light dark:text-dark font-semibold text-sm flex-1" style={{ flexShrink: 1 }}>
                                        Equipment: {equipment.charAt(0).toUpperCase() + equipment.slice(1)}
                                    </Text>
                                </TouchableOpacity>

                                <View className="h-[1px] bg-black/5 dark:bg-white/5 my-0.5" />
                            </>
                        )}

                        {isAttachmentSupported && (
                            <>
                                <TouchableOpacity
                                    onPress={() => {
                                        setIsMenuVisible(false);
                                        setIsAttachmentPickerVisible(true);
                                    }}
                                    className="flex-row items-center p-2.5 rounded-lg active:bg-black/5 dark:active:bg-white/5"
                                >
                                    <IconSymbol name="gearshape.fill" size={16} color={theme.textMuted} style={{ marginRight: 10 }} />
                                    <Text className="text-light dark:text-dark font-semibold text-sm flex-1" style={{ flexShrink: 1 }}>
                                        Attachment: {attachment}
                                    </Text>
                                </TouchableOpacity>

                                <View className="h-[1px] bg-black/5 dark:bg-white/5 my-0.5" />
                            </>
                        )}

                        <TouchableOpacity
                            onPress={() => {
                                setIsMenuVisible(false);
                                setIsMovementTypePickerVisible(true);
                            }}
                            className="flex-row items-center p-2.5 rounded-lg active:bg-black/5 dark:active:bg-white/5"
                        >
                            <IconSymbol name="figure.walk" size={16} color={theme.textMuted} style={{ marginRight: 10 }} />
                            <Text className="text-light dark:text-dark font-semibold text-sm flex-1" style={{ flexShrink: 1 }}>
                                Movement Type: {movementType.charAt(0).toUpperCase() + movementType.slice(1)}
                            </Text>
                        </TouchableOpacity>

                        <View className="h-[1px] bg-black/5 dark:bg-white/5 my-0.5" />

                        <TouchableOpacity
                            onPress={() => {
                                setIsMenuVisible(false);
                                onRemoveExercise?.();
                            }}
                            className="flex-row items-center p-2.5 rounded-lg active:bg-danger/10"
                        >
                            <IconSymbol name="trash.fill" size={16} color={theme.danger} style={{ marginRight: 10 }} />
                            <Text className="text-danger font-semibold text-sm">Remove</Text>
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

             <View
                className={horizontalSets ? (isOutdoorGpsExercise ? "pb-4 flex-1" : "pt-0 pb-4 flex-1") : "pt-0 px-4 pb-0"}
                style={horizontalSets ? { flex: 1 } : undefined}
                onLayout={(e) => {
                    // No horizontal padding here in horizontalSets mode (see className
                    // above) — the swiping ScrollView should span the full available
                    // width so pages don't leave a static, non-scrolling gutter on
                    // each edge during the swipe.
                    const newWidth = horizontalSets ? e.nativeEvent.layout.width : e.nativeEvent.layout.width - 32;
                    setCardWidth(newWidth);
                }}
             >
                {/* Headers */}
                {!horizontalSets && (
                    <View className="flex-row mb-2 px-1">
                        {!horizontalSets && (
                            <Text className="text-[10px] items-center justify-center font-bold uppercase text-center w-[30px] text-light-muted dark:text-dark-muted">SET</Text>
                        )}
                        <Text className="text-[10px] font-bold uppercase text-center text-light-muted dark:text-dark-muted flex-1">PREVIOUS</Text>

                        {showWeight && <Text className="text-[10px] font-bold uppercase text-center text-light-muted dark:text-dark-muted w-[52px] mx-0.5">LBS</Text>}
                        {showReps && <Text className={`text-[10px] font-bold uppercase text-center text-light-muted dark:text-dark-muted mx-0.5 ${isUnilateral ? 'w-[54px]' : 'w-[52px]'}`}>{isUnilateral ? 'L / R' : 'REPS'}</Text>}
                        {showDuration && <Text className="text-[10px] font-bold uppercase text-center text-light-muted dark:text-dark-muted w-[52px] mx-0.5">TIME</Text>}
                        {showDistance && <Text className="text-[10px] font-bold uppercase text-center text-light-muted dark:text-dark-muted w-[52px] mx-0.5">DIST</Text>}
                        {showRPE && <Text className="text-[10px] items-center justify-center font-bold uppercase text-center w-[40px] ml-2 mr-0.5 text-light-muted dark:text-dark-muted">RPE</Text>}
                        {/* Matches the checkbox (w-7 ml-1) + list-mode delete
                            icon (w-6 ml-1) trailing each row - see SetRow. */}
                        <View className="w-7 ml-1" />
                        <View className="w-6 ml-1" />
                    </View>
                )}



                {/* Render Rows */}
                {horizontalSets ? (
                    cardWidth > 0 ? (
                        <ScrollView
                            ref={scrollViewRef}
                            horizontal
                            pagingEnabled
                            scrollEnabled={isSetPagerScrollEnabled}
                            showsHorizontalScrollIndicator={false}
                            style={{ flex: 1 }}
                            onLayout={(e) => {
                                // Authoritative width source: the ScrollView's own
                                // rendered width, not a padding-math estimate from an
                                // ancestor. Keeps each page's width (and paging math)
                                // exactly in sync with what's actually on screen.
                                setCardWidth(e.nativeEvent.layout.width);
                            }}
                            onMomentumScrollEnd={handleMomentumScrollEnd}
                            onScrollEndDrag={handleScrollEndDrag}
                        >
                            <SetPagerScrollLockProvider setScrollEnabled={setIsSetPagerScrollEnabled}>
                                {Array.from({ length: totalSets }).map((_, i) => (
                                    <View key={`set-${i}`} style={{ width: cardWidth, flex: 1 }}>
                                        <SetRow
                                            index={i}
                                            exercise={exercise}
                                            onCompleteSet={() => handleCompleteSetAndAutoPage(i)}
                                            onUpdateSetTarget={onUpdateSetTarget}
                                            onDeleteSet={onDeleteSet || (() => {})}
                                            onPressRPE={(setIdx, val) => {
                                                setRPEPickerIndex(setIdx);
                                                setRPEPickerValue(val);
                                                setIsRPEPickerVisible(true);
                                            }}
                                            theme={theme}
                                            latestBodyWeight={latestBodyWeight}
                                            exercisePrepTime={exercise.prepTime}
                                            onUpdatePrepTime={onUpdatePrepTime}
                                            showCheckbox={false}
                                            showSetNumber={false}
                                            isActiveSet={i === activeSetIndex && ((isCurrent ?? false) || (preloadWheels ?? false))}
                                            isCurrentPage={isCurrent ?? false}
                                            wheelsReadyDelayMs={wheelsReadyDelayMs}
                                            isRpeEnabled={isRpeEnabled}
                                            isHapticsEnabled={isHapticsEnabled}
                                            isProgressiveOverloadEnabled={isProgressiveOverloadEnabled}
                                            progressiveOverloadRepCeiling={progressiveOverloadRepCeiling}
                                            isGpsTrackingActive={isGpsTrackingActive}
                                            activateGpsTrackingIfNeeded={activateGpsTrackingIfNeeded}
                                        />
                                    </View>
                                ))}
                            </SetPagerScrollLockProvider>
                        </ScrollView>
                    ) : null
                ) : (
                    Array.from({ length: totalSets }).map((_, i) => (
                        <SetRow 
                            key={i} 
                            index={i}
                            exercise={exercise}
                            onCompleteSet={() => onCompleteSet(i)}
                            onUpdateSetTarget={onUpdateSetTarget}
                            onDeleteSet={onDeleteSet || (() => {})}
                            onPressRPE={(setIdx, val) => {
                                setRPEPickerIndex(setIdx);
                                setRPEPickerValue(val);
                                setIsRPEPickerVisible(true);
                            }}
                            theme={theme}
                            latestBodyWeight={latestBodyWeight}
                            exercisePrepTime={exercise.prepTime}
                            onUpdatePrepTime={onUpdatePrepTime}
                            showSetNumber={!horizontalSets}
                            isRpeEnabled={isRpeEnabled}
                            isHapticsEnabled={isHapticsEnabled}
                            isProgressiveOverloadEnabled={isProgressiveOverloadEnabled}
                            progressiveOverloadRepCeiling={progressiveOverloadRepCeiling}
                            isGpsTrackingActive={isGpsTrackingActive}
                            activateGpsTrackingIfNeeded={activateGpsTrackingIfNeeded}
                        />
                    ))
                )}

                {/* Add/Delete Set Buttons (not shown for Running/Biking — one continuous activity, not repeatable sets) */}
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 4, display: isOutdoorGpsExercise ? 'none' : 'flex' }}>
                    {/* List mode moves this into the "..." menu instead - see
                        the Exercise Menu Modal above. */}
                    {onAddSet && horizontalSets && (
                        <TouchableOpacity
                            onPress={onAddSet}
                            style={{ flex: 1 }}
                            className="flex-row items-center justify-center p-2 rounded-lg border border-dashed border-black/10 dark:border-white/10 active:opacity-70"
                        >
                            <IconSymbol name="plus" size={14} color={theme.primary} />
                            <Text className="ml-2 text-sm text-primary dark:text-primary-dark font-medium">Add Set</Text>
                        </TouchableOpacity>
                    )}

                    {onDeleteSet && horizontalSets && totalSets > 0 && (
                        <TouchableOpacity
                            onPress={() => {
                                Alert.alert(
                                    'Delete Set',
                                    `Delete set ${activeSetIndex + 1}? This can't be undone.`,
                                    [
                                        { text: 'Cancel', style: 'cancel' },
                                        { text: 'Delete', style: 'destructive', onPress: handleDeleteActiveSet },
                                    ]
                                );
                            }}
                            style={{ flex: onAddSet ? undefined : 1 }}
                            className="flex-row items-center justify-center p-2 px-3 rounded-lg border border-danger/30 bg-danger/5 active:bg-danger/10"
                        >
                            <IconSymbol name="trash.fill" size={14} color={theme.danger} />
                            <Text className="ml-2 text-sm text-danger font-medium">Delete Set</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <RestTimerPicker
                visible={isPickerVisible}
                onClose={() => setIsPickerVisible(false)}
                initialValue={exercise.restTime ?? 90}
                onSave={(val) => {
                    onUpdateRestTime?.(val);
                    setIsPickerVisible(false);
                }}
                isHapticsEnabled={isHapticsEnabled}
            />

            <RPEPicker
                visible={isRPEPickerVisible}
                onClose={() => setIsRPEPickerVisible(false)}
                initialValue={rpePickerValue}
                onSave={(val) => {
                    if (rpePickerIndex !== null) {
                        onUpdateSetTarget?.(rpePickerIndex, 'rpe', val.toString());
                    }
                    setIsRPEPickerVisible(false);
                }}
                isHapticsEnabled={isHapticsEnabled}
            />

            <AttachmentPicker
                visible={isAttachmentPickerVisible}
                exerciseId={exercise.id}
                currentAttachment={attachment}
                onClose={() => setIsAttachmentPickerVisible(false)}
                onSelect={(newAttachment) => {
                    onUpdateAttachment?.(newAttachment);
                }}
            />

            <EquipmentPicker
                visible={isEquipmentPickerVisible}
                exerciseId={exercise.id}
                currentEquipment={equipment}
                onClose={() => setIsEquipmentPickerVisible(false)}
                onSelect={(newEquipment) => {
                    onUpdateEquipment?.(newEquipment);
                }}
            />

            <MovementTypePicker
                visible={isMovementTypePickerVisible}
                currentMovementType={movementType}
                onClose={() => setIsMovementTypePickerVisible(false)}
                onSelect={(newMovementType) => {
                    onUpdateMovementType?.(newMovementType);
                }}
            />
        </>
    );
}

// Callback props are recreated every render by the FlatList's renderItem
// (they close over each exercise's index), so identity always changes —
// comparing them would defeat memoization entirely. Bail out on the actual
// data/display props instead; callbacks always call through to stable
// functions from the provider, so ignoring their identity is safe as long
// as the exercise's index doesn't change without `exercise` itself changing
// (this list doesn't support live reordering — no onMoveUp/onDrag wired in
// the active workout screen — and FlatList's keyExtractor includes index,
// so an index change always remounts rather than reusing this instance).
export const ExerciseCard = React.memo(ExerciseCardInner, (prev, next) => {
    return (
        prev.exercise === next.exercise &&
        prev.isCurrent === next.isCurrent &&
        prev.activeSetIndex === next.activeSetIndex &&
        prev.theme === next.theme &&
        prev.latestBodyWeight === next.latestBodyWeight &&
        prev.horizontalSets === next.horizontalSets &&
        prev.showName === next.showName &&
        prev.preloadWheels === next.preloadWheels &&
        prev.wheelsReadyDelayMs === next.wheelsReadyDelayMs &&
        prev.isRpeEnabled === next.isRpeEnabled &&
        prev.isHapticsEnabled === next.isHapticsEnabled &&
        prev.isProgressiveOverloadEnabled === next.isProgressiveOverloadEnabled &&
        prev.progressiveOverloadRepCeiling === next.progressiveOverloadRepCeiling &&
        prev.isGpsTrackingActive === next.isGpsTrackingActive &&
        prev.activateGpsTrackingIfNeeded === next.activateGpsTrackingIfNeeded
    );
});
