import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Dimensions, Modal } from 'react-native';
import { useUITheme as useTheme, IconSymbol, RaisedCard } from '@mysuite/ui';
import { useWorkoutManager } from '../../providers/WorkoutManagerProvider';
import { getExerciseFields } from './getExerciseFields';
import { formatRestTime, formatSeconds } from '../../utils/formatting';
import { RPEPicker } from './RPEPicker';
import { RestTimerPicker } from './RestTimerPicker';
import { DurationTimerPicker } from './DurationTimerPicker';
import { AttachmentPicker, ATTACHMENT_OPTIONS } from './AttachmentPicker';
import { EquipmentPicker } from './EquipmentPicker';
import { MovementTypePicker } from './MovementTypePicker';

import { inferEquipment, inferMovementType } from '../../providers/DataRepository';

export interface WorkoutDraftExerciseItemProps {
    item: any;
    index: number;
    isExpanded: boolean;
    onToggleExpand: () => void;
    onMove: (dir: -1 | 1) => void;
    onRemove: () => void;
    onUpdateSet: (setIndex: number, field: 'reps' | 'reps_left' | 'reps_right' | 'weight' | 'duration' | 'distance' | 'rpe', value: string) => void;
    onAddSet: () => void;
    onRemoveSet: (setIndex: number) => void;
    latestBodyWeight?: number | null;
    isEditing: boolean;
    lastSaved?: number;
    onToggleLocalEdit?: (isEditing: boolean) => void;
    onUpdateRestTime?: (restTime: number) => void;
    onUpdatePrepTime?: (prepTime: number) => void;
    onPressName?: () => void;
    onDrag?: () => void;
    isReadOnly?: boolean;
    onUpdateAttachment?: (attachment: string) => void;
    onUpdateEquipment?: (equipment: string) => void;
    onUpdateMovementType?: (movementType: string) => void;
}


const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const WorkoutDraftExerciseItem = ({
    item,
    index,
    isExpanded,
    onToggleExpand,
    onMove,
    onRemove,
    onUpdateSet,
    onAddSet,
    onRemoveSet,
    latestBodyWeight,
    isEditing,
    lastSaved,
    onToggleLocalEdit,
    onUpdateRestTime,
    onUpdatePrepTime,
    onPressName,
    onDrag,
    isReadOnly,
    onUpdateAttachment,
    onUpdateEquipment,
    onUpdateMovementType
}: WorkoutDraftExerciseItemProps) => {
    const theme = useTheme();
    const [menuVisible, setMenuVisible] = useState(false);
    const ellipsisRef = useRef<View>(null);
    const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
    const [isLocalEditing, setIsLocalEditing] = useState<boolean>(item.isNewlyAdded || false);
    
    // RPE Picker state
    const [isRPEPickerVisible, setIsRPEPickerVisible] = useState(false);
    const [rpePickerValue, setRPEPickerValue] = useState<string | undefined>(undefined);
    const [rpePickerIndex, setRPEPickerIndex] = useState<number | null>(null);
    
    // Rest Timer Picker state
    const [isRestPickerVisible, setIsRestPickerVisible] = useState(false);
    
    // Duration Timer Picker state
    const [isDurationPickerVisible, setIsDurationPickerVisible] = useState(false);
    const [durationPickerIndex, setDurationPickerIndex] = useState<number | null>(null);
    const [durationPickerValue, setDurationPickerValue] = useState<number>(0);

    // Attachment Picker state
    const [isAttachmentPickerVisible, setIsAttachmentPickerVisible] = useState(false);

    // Equipment Picker state
    const [isEquipmentPickerVisible, setIsEquipmentPickerVisible] = useState(false);

    // Movement Type Picker state
    const [isMovementTypePickerVisible, setIsMovementTypePickerVisible] = useState(false);

    useEffect(() => {
        setIsLocalEditing(false);
    }, [lastSaved]);

    useEffect(() => {
        onToggleLocalEdit?.(isLocalEditing);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLocalEditing]);

    const _isEditing = isEditing || isLocalEditing;

    const { isRpeEnabled, isHapticsEnabled } = useWorkoutManager();
    const { showWeight, showReps, showDuration, showDistance, showRPE: calculatedShowRPE } = getExerciseFields(item.properties, item.id);
    const showRPE = calculatedShowRPE && isRpeEnabled;
    
    const isAttachmentSupported = item.id in ATTACHMENT_OPTIONS;
    const defaultAttachment = ATTACHMENT_OPTIONS[item.id]?.[0];
    const attachment = item.attachment || defaultAttachment;
    const equipment = item.equipment || inferEquipment(item.name);
    const movementType = item.movementType || inferMovementType(item.name, equipment);
    const isUnilateral = movementType === 'unilateral';
    
    // Ensure duration falls back to reps if needed (legacy data fix for display)
    const rawTargets = item.setTargets || Array.from({ length: item.sets || 1 }, () => ({ reps: item.reps || undefined, weight: undefined }));
    const currentTargets = rawTargets.map((t: any) => {
        let duration = t.duration;
        let distance = t.distance;
        
        // Fallback for legacy data
        if ((duration === undefined || duration === null || duration === '') && showDuration && !showReps) {
            duration = t.reps;
        }
        if ((distance === undefined || distance === null || distance === '') && showDistance && !showReps && !showDuration) {
            distance = t.reps;
        }

        return {
            ...t,
            weight: t.weight,
            reps: t.reps,
            reps_left: t.reps_left,
            reps_right: t.reps_right,
            duration,
            distance,
            rpe: t.rpe
        };
    });

    const isZeroValue = (val: any) => val === 0 || val === '0' || val === '0.0';
    const getTextColorClass = (val: any, defaultClass = "text-light dark:text-dark") => 
        (val === undefined || val === null || val === '') ? "text-light-muted dark:text-dark-muted" : defaultClass;

    const handleNumericChange = (text: string, currentVal: any, onUpdate: (v: string) => void) => {
        const currentStr = String(currentVal);
        if (isZeroValue(currentStr) && text.length > 0) {
            if (text.length > 1 && text.startsWith('0') && text[1] !== '.') {
                onUpdate(text.substring(1));
                return;
            }
        }
        onUpdate(text);
    };

    return (
        <View 
            style={{ 
                zIndex: menuVisible ? 10 : 1 
            }}
        >
            <View className="flex-row justify-between items-center">
                <TouchableOpacity 
                onPress={onPressName || onToggleExpand}
                onLongPress={onDrag}
                delayLongPress={200}
                className="p-3 pb-1 flex-1"
                style={{ zIndex: menuVisible ? 999 : 1, elevation: menuVisible ? 999 : 1 }}>
                    <Text className="text-base text-light dark:text-dark leading-6 font-semibold">
                        {item.name}
                        {equipment && equipment !== 'none' && (
                            <Text className="text-sm font-normal text-light-muted dark:text-dark-muted">
                                {' '}({equipment.charAt(0).toUpperCase() + equipment.slice(1)})
                            </Text>
                        )}
                    </Text>
                    
                    <TouchableOpacity
                        className="flex-row items-center mt-1 pb-1"
                        onPress={(e) => {
                            e.stopPropagation();
                            setIsRestPickerVisible(true);
                        }}
                    >
                        <IconSymbol name="timer" size={12} color={theme.bgDark === '#000000' ? '#999' : '#666'} />
                        <Text className="ml-1 text-[11px] font-semibold text-light-muted dark:text-dark-muted">
                            Rest Timer: {formatRestTime(item.restTime ?? 90)}
                        </Text>
                    </TouchableOpacity>
                </TouchableOpacity>
                {!isReadOnly && (
                    <View className="flex-row items-center relative z-20 pr-1">
                    <TouchableOpacity 
                        ref={ellipsisRef as any}
                        onPress={(e) => { 
                            e.stopPropagation(); 
                            ellipsisRef.current?.measure((x, y, width, height, pageX, pageY) => {
                                const MENU_ESTIMATED_HEIGHT = isAttachmentSupported ? 350 : 300; // Approx height of the menu
                                let topPos = pageY + height + 4;
                                
                                // Output upwards if it goes beyond the screen
                                if (topPos + MENU_ESTIMATED_HEIGHT > SCREEN_HEIGHT - 50) {
                                    topPos = pageY - MENU_ESTIMATED_HEIGHT - 4;
                                }
                                
                                setMenuPos({ 
                                    top: topPos, 
                                    right: SCREEN_WIDTH - pageX - width 
                                });
                                setMenuVisible(true);
                            });
                        }} 
                        className="p-2 ml-1"
                    >
                        <IconSymbol name="ellipsis" size={20} color={theme.icon || '#888'} />
                    </TouchableOpacity>

                    <Modal transparent visible={menuVisible} animationType="fade" onRequestClose={() => setMenuVisible(false)}>
                        <TouchableOpacity 
                            activeOpacity={1} 
                            onPress={() => setMenuVisible(false)}
                            className="flex-1"
                            style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
                        >
                            <RaisedCard 
                                className="absolute w-64 p-1 origin-top-right rounded-xl bg-lighter dark:bg-dark-lighter"
                                style={{ 
                                    top: menuPos.top,
                                    right: menuPos.right - 8,
                                    shadowColor: '#000', 
                                    shadowOffset: { width: 0, height: 4 }, 
                                    shadowOpacity: 0.15, 
                                    shadowRadius: 12, 
                                    elevation: 5,
                                }}
                            >
                                <TouchableOpacity onPress={(e) => { e.stopPropagation(); setMenuVisible(false); setIsLocalEditing(prev => !prev); }} className="flex-row items-center p-3 rounded-lg active:bg-black/5 dark:active:bg-white/5">
                                    <IconSymbol name={isLocalEditing ? "checkmark" : "pencil"} size={18} color={theme.text as string} style={{ marginRight: 12 }} />
                                    <Text style={{ color: theme.text as string }} className="font-medium">{isLocalEditing ? "Done" : "Edit"}</Text>
                                </TouchableOpacity>
                                <View className="h-[1px] bg-black/5 dark:bg-white/5 my-1" />
                                {isAttachmentSupported && (
                                    <>
                                        <TouchableOpacity onPress={(e) => { e.stopPropagation(); setMenuVisible(false); setIsAttachmentPickerVisible(true); }} className="flex-row items-center p-3 rounded-lg active:bg-black/5 dark:active:bg-white/5">
                                            <IconSymbol name="gearshape.fill" size={18} color={theme.text as string} style={{ marginRight: 12 }} />
                                            <Text style={{ color: theme.text as string }} className="font-medium flex-1">Attachment: {attachment}</Text>
                                        </TouchableOpacity>
                                        <View className="h-[1px] bg-black/5 dark:bg-white/5 my-1" />
                                    </>
                                )}
                                <TouchableOpacity onPress={(e) => { e.stopPropagation(); setMenuVisible(false); setIsEquipmentPickerVisible(true); }} className="flex-row items-center p-3 rounded-lg active:bg-black/5 dark:active:bg-white/5">
                                    <IconSymbol name="dumbbell.fill" size={18} color={theme.text as string} style={{ marginRight: 12 }} />
                                    <Text style={{ color: theme.text as string }} className="font-medium flex-1">Equipment: {equipment.charAt(0).toUpperCase() + equipment.slice(1)}</Text>
                                </TouchableOpacity>
                                <View className="h-[1px] bg-black/5 dark:bg-white/5 my-1" />
                                <TouchableOpacity onPress={(e) => { e.stopPropagation(); setMenuVisible(false); setIsMovementTypePickerVisible(true); }} className="flex-row items-center p-3 rounded-lg active:bg-black/5 dark:active:bg-white/5">
                                    <IconSymbol name="figure.walk" size={18} color={theme.text as string} style={{ marginRight: 12 }} />
                                    <Text style={{ color: theme.text as string }} className="font-medium flex-1">Movement: {movementType.charAt(0).toUpperCase() + movementType.slice(1)}</Text>
                                </TouchableOpacity>
                                <View className="h-[1px] bg-black/5 dark:bg-white/5 my-1" />
                                <TouchableOpacity onPress={(e) => { e.stopPropagation(); setMenuVisible(false); onRemove(); }} className="flex-row items-center p-3 rounded-lg active:bg-black/5 dark:active:bg-white/5">
                                    <IconSymbol name="trash.fill" size={18} color={theme.options?.destructiveColor || '#ff4444'} style={{ marginRight: 12 }} />
                                    <Text style={{ color: theme.options?.destructiveColor || '#ff4444' }} className="font-medium">Remove</Text>
                                </TouchableOpacity>
                            </RaisedCard>
                        </TouchableOpacity>
                    </Modal>
                </View>
                )}
            </View>
            {isExpanded && (
                <View className="px-2 pb-3 pt-1">
                    <View className="flex-row mb-2">
                        <Text className="w-12 text-xs text-gray-500 font-semibold text-center">Set</Text>
                        {showWeight && <Text className="flex-1 text-xs text-gray-500 font-semibold text-center">Lbs</Text>}
                        {showReps && <Text className="flex-1 text-xs text-gray-500 font-semibold text-center">{isUnilateral ? "L / R" : "Reps"}</Text>}
                        {showDuration && <Text className="flex-1 text-xs text-gray-500 font-semibold text-center">Time</Text>}
                        {showDistance && <Text className="flex-1 text-xs text-gray-500 font-semibold text-center">Dist</Text>}
                        {showRPE && <Text className="w-12 text-xs text-gray-500 font-semibold text-center">RPE</Text>}
                        <View className="w-8 ml-2" />
                    </View>
                    {currentTargets.map((set: any, setIdx: number) => (
                        <View key={setIdx} className="flex-row items-center mb-2">
                            <View className="w-12 items-center justify-center">
                                <Text className="text-light dark:text-dark font-medium">{setIdx + 1}</Text>
                            </View>
                            
                             {showWeight && (
                                <View className="flex-1 flex-row justify-center">
                                    {_isEditing ? (
                                        <TextInput 
                                            value={set.weight !== undefined && set.weight !== null ? String(set.weight) : ''} 
                                            keyboardType="numeric"
                                            onChangeText={(v) => handleNumericChange(v, set.weight, (newVal) => onUpdateSet(setIdx, 'weight', newVal))}
                                            className={`bg-light dark:bg-dark border border-black/10 dark:border-white/10 rounded px-2 py-1 w-16 text-center ${getTextColorClass(set.weight)}`}
                                            placeholder="-"
                                            selectTextOnFocus
                                            editable={_isEditing}
                                        />
                                    ) : (
                                        <Text className={`border border-transparent rounded px-2 py-1 w-16 text-center font-medium ${getTextColorClass(set.weight)}`}>{set.weight !== undefined && set.weight !== null ? set.weight : "-"}</Text>
                                    )}
                                </View>
                            )}

                             {showReps && (
                                <View className="flex-1 flex-row justify-center">
                                    {isUnilateral ? (
                                        _isEditing ? (
                                            <View className="flex-row items-center w-20 gap-0.5">
                                                <TextInput 
                                                    value={set.reps_left !== undefined && set.reps_left !== null ? String(set.reps_left) : ''} 
                                                    keyboardType="numeric"
                                                    onChangeText={(v) => handleNumericChange(v, set.reps_left, (newVal) => onUpdateSet(setIdx, 'reps_left', newVal))}
                                                    className={`flex-1 bg-light dark:bg-dark border border-black/10 dark:border-white/10 rounded p-1 text-center text-xs ${getTextColorClass(set.reps_left)}`}
                                                    placeholder="L"
                                                    selectTextOnFocus
                                                    editable={_isEditing}
                                                />
                                                <Text className="text-light-muted dark:text-dark-muted text-[10px] font-bold">/</Text>
                                                <TextInput 
                                                    value={set.reps_right !== undefined && set.reps_right !== null ? String(set.reps_right) : ''} 
                                                    keyboardType="numeric"
                                                    onChangeText={(v) => handleNumericChange(v, set.reps_right, (newVal) => onUpdateSet(setIdx, 'reps_right', newVal))}
                                                    className={`flex-1 bg-light dark:bg-dark border border-black/10 dark:border-white/10 rounded p-1 text-center text-xs ${getTextColorClass(set.reps_right)}`}
                                                    placeholder="R"
                                                    selectTextOnFocus
                                                    editable={_isEditing}
                                                />
                                            </View>
                                        ) : (() => {
                                            const l = set.reps_left !== undefined && set.reps_left !== null && set.reps_left !== '' ? set.reps_left : (set.reps !== undefined && set.reps !== null && set.reps !== '' ? set.reps : "-");
                                            const r = set.reps_right !== undefined && set.reps_right !== null && set.reps_right !== '' ? set.reps_right : (set.reps !== undefined && set.reps !== null && set.reps !== '' ? set.reps : "-");
                                            const hasVal = (set.reps_left !== undefined && set.reps_left !== null && set.reps_left !== '') || 
                                                           (set.reps_right !== undefined && set.reps_right !== null && set.reps_right !== '') || 
                                                           (set.reps !== undefined && set.reps !== null && set.reps !== '');
                                            const displayText = `${l}L/${r}R`;
                                            return (
                                                <Text className={`border border-transparent rounded px-2 py-1 w-20 text-center font-medium ${getTextColorClass(hasVal ? 'has-val' : '')}`}>
                                                    {displayText}
                                                </Text>
                                            );
                                        })()
                                    ) : (
                                        _isEditing ? (
                                            <TextInput 
                                                value={set.reps !== undefined && set.reps !== null ? String(set.reps) : ''} 
                                                keyboardType="numeric"
                                                onChangeText={(v) => handleNumericChange(v, set.reps, (newVal) => onUpdateSet(setIdx, 'reps', newVal))}
                                                className={`bg-light dark:bg-dark border border-black/10 dark:border-white/10 rounded px-2 py-1 w-16 text-center ${getTextColorClass(set.reps)}`}
                                                placeholder="-"
                                                selectTextOnFocus
                                                editable={_isEditing}
                                            />
                                        ) : (
                                            <Text className={`border border-transparent rounded px-2 py-1 w-16 text-center font-medium ${getTextColorClass(set.reps)}`}>{set.reps !== undefined && set.reps !== null ? set.reps : "-"}</Text>
                                        )
                                    )}
                                </View>
                            )}

                             {showDuration && (
                                <View className="flex-1 flex-row justify-center">
                                    <View className={`flex-row items-center justify-center p-1 rounded w-20 h-8 border ${
                                        _isEditing ? 'bg-light dark:bg-dark border-black/10 dark:border-white/10' : 'border-transparent'
                                    }`}>
                                        <TouchableOpacity 
                                            onPress={() => {
                                                setDurationPickerIndex(setIdx);
                                                setDurationPickerValue(parseInt(set.duration) || 0);
                                                // Note: WorkoutDraftExerciseItem doesn't use autoStart currently, 
                                                // but we provide the button for consistency.
                                                setIsDurationPickerVisible(true);
                                            }}
                                            className="p-1"
                                        >
                                            <IconSymbol name="play.fill" size={12} color={theme.primary} />
                                        </TouchableOpacity>
                                        <TouchableOpacity 
                                            onPress={() => {
                                                setDurationPickerIndex(setIdx);
                                                setDurationPickerValue(parseInt(set.duration) || 0);
                                                setIsDurationPickerVisible(true);
                                            }}
                                            className="p-1"
                                        >
                                            <Text className={`font-medium ${getTextColorClass(set.duration)}`}>
                                                {set.duration !== undefined && set.duration !== null && set.duration !== "" ? formatSeconds(parseInt(set.duration) || 0) : "-"}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}

                             {showDistance && (
                                <View className="flex-1 flex-row justify-center">
                                    {_isEditing ? (
                                        <TextInput 
                                            value={set.distance !== undefined && set.distance !== null ? String(set.distance) : ''} 
                                            keyboardType="numeric"
                                            onChangeText={(v) => handleNumericChange(v, set.distance, (newVal) => onUpdateSet(setIdx, 'distance', newVal))}
                                            className={`bg-light dark:bg-dark border border-black/10 dark:border-white/10 rounded px-2 py-1 w-16 text-center ${getTextColorClass(set.distance)}`}
                                            placeholder="-"
                                            selectTextOnFocus
                                            editable={_isEditing}
                                        />
                                    ) : (
                                        <Text className={`border border-transparent rounded px-2 py-1 w-16 text-center font-medium ${getTextColorClass(set.distance)}`}>{set.distance !== undefined && set.distance !== null ? set.distance : "-"}</Text>
                                    )}
                                </View>
                            )}

                            {showRPE && (
                                <View className="w-12 flex-row justify-center">
                                    <TouchableOpacity 
                                        onPress={() => {
                                            if (_isEditing) {
                                                setRPEPickerIndex(setIdx);
                                                setRPEPickerValue(set.rpe ? String(set.rpe) : undefined);
                                                setIsRPEPickerVisible(true);
                                            }
                                        }}
                                        className={`items-center justify-center p-1 rounded w-10 h-8 border ${
                                            _isEditing ? 'bg-light dark:bg-dark border-black/10 dark:border-white/10' : 'border-transparent'
                                        }`}
                                    >
                                        <Text className={`font-semibold ${getTextColorClass(set.rpe)}`}>
                                            {set.rpe !== undefined && set.rpe !== null ? set.rpe : "-"}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            <View className="w-8 ml-2 flex-row justify-center">
                                {_isEditing && (
                                    <TouchableOpacity 
                                        onPress={() => onRemoveSet(setIdx)}
                                        className="items-center justify-center rounded h-8"
                                    >
                                        <IconSymbol name="minus.circle.fill" size={20} color="#ff4444" />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    ))}
                    {_isEditing && !isReadOnly && (
                        <TouchableOpacity 
                            onPress={onAddSet}
                            className="flex-row items-center justify-center p-2 mt-1 rounded-lg border border-dashed border-black/10 dark:border-white/10"
                        >
                            <IconSymbol name="plus" size={14} color={theme.primary} />
                            <Text className="ml-2 text-sm text-primary dark:text-primary-dark font-medium">Add Set</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}

            <RPEPicker 
                visible={isRPEPickerVisible}
                onClose={() => setIsRPEPickerVisible(false)}
                initialValue={rpePickerValue}
                onSave={(val) => {
                    if (rpePickerIndex !== null) {
                        onUpdateSet(rpePickerIndex, 'rpe', val.toString());
                    }
                    setIsRPEPickerVisible(false);
                }}
                isHapticsEnabled={isHapticsEnabled}
            />

            <RestTimerPicker
                visible={isRestPickerVisible}
                onClose={() => setIsRestPickerVisible(false)}
                initialValue={item.restTime ?? 90}
                onSave={(val) => {
                    onUpdateRestTime?.(val);
                    setIsRestPickerVisible(false);
                }}
                isHapticsEnabled={isHapticsEnabled}
            />

            <DurationTimerPicker
                visible={isDurationPickerVisible}
                onClose={() => setIsDurationPickerVisible(false)}
                initialValue={durationPickerValue}
                onSave={(val) => {
                    if (durationPickerIndex !== null) {
                        onUpdateSet(durationPickerIndex, 'duration', val.toString());
                    }
                    setIsDurationPickerVisible(false);
                }}
                isActiveWorkout={false}
                prepTime={item.prepTime ?? 0}
                onPrepTimeChange={onUpdatePrepTime}
                isHapticsEnabled={isHapticsEnabled}
            />

            <AttachmentPicker
                visible={isAttachmentPickerVisible}
                exerciseId={item.id}
                currentAttachment={attachment}
                onClose={() => setIsAttachmentPickerVisible(false)}
                onSelect={(opt) => onUpdateAttachment?.(opt)}
            />

            <EquipmentPicker
                visible={isEquipmentPickerVisible}
                exerciseId={item.id}
                currentEquipment={equipment}
                onClose={() => setIsEquipmentPickerVisible(false)}
                onSelect={(opt) => onUpdateEquipment?.(opt)}
            />

            <MovementTypePicker
                visible={isMovementTypePickerVisible}
                currentMovementType={movementType}
                onClose={() => setIsMovementTypePickerVisible(false)}
                onSelect={(opt) => onUpdateMovementType?.(opt)}
            />
        </View>
    );
};
