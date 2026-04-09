import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Dimensions, Modal } from 'react-native';
import { useUITheme as useTheme, IconSymbol, RaisedCard } from '@mysuite/ui';
import { getExerciseDefaultProperties } from '../../providers/WorkoutManagerProvider';
import { formatRestTime } from '../../utils/formatting';
import { RPEPicker } from './RPEPicker';
import { RestTimerPicker } from './RestTimerPicker';

export interface WorkoutDraftExerciseItemProps {
    item: any;
    index: number;
    isExpanded: boolean;
    onToggleExpand: () => void;
    onMove: (dir: -1 | 1) => void;
    onRemove: () => void;
    onUpdateSet: (setIndex: number, field: 'reps' | 'weight' | 'duration' | 'distance' | 'rpe', value: string) => void;
    onAddSet: () => void;
    onRemoveSet: (setIndex: number) => void;
    latestBodyWeight?: number | null;
    isEditing: boolean;
    lastSaved?: number;
    onToggleLocalEdit?: (isEditing: boolean) => void;
    onUpdateRestTime?: (restTime: number) => void;
    onPressName?: () => void;
    onDrag?: () => void;
    isReadOnly?: boolean;
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
    onPressName,
    onDrag,
    isReadOnly
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

    useEffect(() => {
        setIsLocalEditing(false);
    }, [lastSaved]);

    useEffect(() => {
        onToggleLocalEdit?.(isLocalEditing);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLocalEditing]);

    const _isEditing = isEditing || isLocalEditing;

    // Helper to determine which columns to show
    const getExerciseFields = (properties?: string[], exerciseId?: string) => {
        let props = properties || [];
        
        // Fallback to default properties if available (handles stale data)
        if (exerciseId) {
            const defaults = getExerciseDefaultProperties(exerciseId);
            // Merge unique properties
            const unique = new Set([...props, ...defaults]);
            props = Array.from(unique);
        }

        const lowerProps = props.map(p => p.toLowerCase());
        return { 
            showBodyweight: lowerProps.includes('bodyweight'),
            showWeight: lowerProps.includes('weighted'),
            showReps: lowerProps.includes('reps'),
            showDuration: lowerProps.includes('duration'),
            showDistance: lowerProps.includes('distance'),
            showRPE: lowerProps.includes('weighted') || lowerProps.includes('reps') || lowerProps.includes('rpe')
        };
    };

    const { showBodyweight, showWeight, showReps, showDuration, showDistance, showRPE } = getExerciseFields(item.properties, item.id);
    
    // Ensure duration falls back to reps if needed (legacy data fix for display)
    const rawTargets = item.setTargets || Array.from({ length: item.sets || 1 }, () => ({ reps: item.reps || 0, weight: 0 }));
    const currentTargets = rawTargets.map((t: any) => ({
        ...t,
        weight: t.weight,
        reps: t.reps,
        duration: t.duration,
        distance: t.distance,
        rpe: t.rpe
    }));

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
                    <Text className="text-base text-light dark:text-dark leading-6 font-semibold">{item.name}</Text>
                    
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
                                const MENU_ESTIMATED_HEIGHT = 210; // Approx height of the menu
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
                                className="absolute w-48 p-1 origin-top-right rounded-xl bg-lighter dark:bg-dark-lighter"
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
                        {showBodyweight && <Text className="flex-1 text-xs text-gray-500 font-semibold text-center">{latestBodyWeight ? 'Lbs' : 'BW'}</Text>}
                        {showWeight && <Text className="flex-1 text-xs text-gray-500 font-semibold text-center">Lbs</Text>}
                        {showReps && <Text className="flex-1 text-xs text-gray-500 font-semibold text-center">Reps</Text>}
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
                            
                            {showBodyweight && (
                                <View className="flex-1 items-center justify-center">
                                    <Text className="text-sm font-bold text-black/50 dark:text-white/50">
                                        {latestBodyWeight ? `${latestBodyWeight}` : 'BW'}
                                    </Text>
                                </View>
                            )}

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
                                        <Text className={`font-medium ${getTextColorClass(set.weight)}`}>{set.weight !== undefined && set.weight !== null ? set.weight : "-"}</Text>
                                    )}
                                </View>
                            )}

                             {showReps && (
                                <View className="flex-1 flex-row justify-center">
                                    {_isEditing ? (
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
                                        <Text className={`font-medium ${getTextColorClass(set.reps)}`}>{set.reps !== undefined && set.reps !== null ? set.reps : "-"}</Text>
                                    )}
                                </View>
                            )}

                             {showDuration && (
                                <View className="flex-1 flex-row justify-center">
                                    {_isEditing ? (
                                        <TextInput 
                                            value={set.duration !== undefined && set.duration !== null ? String(set.duration) : ''} 
                                            keyboardType="numeric"
                                            onChangeText={(v) => handleNumericChange(v, set.duration, (newVal) => onUpdateSet(setIdx, 'duration', newVal))}
                                            className={`bg-light dark:bg-dark border border-black/10 dark:border-white/10 rounded px-2 py-1 w-16 text-center ${getTextColorClass(set.duration)}`}
                                            placeholder="-"
                                            selectTextOnFocus
                                            editable={_isEditing}
                                        />
                                    ) : (
                                        <Text className={`font-medium ${getTextColorClass(set.duration)}`}>{set.duration !== undefined && set.duration !== null ? set.duration : "-"}</Text>
                                    )}
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
                                        <Text className={`font-medium ${getTextColorClass(set.distance)}`}>{set.distance !== undefined && set.distance !== null ? set.distance : "-"}</Text>
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
                                        className={`items-center justify-center p-1 ${
                                            _isEditing ? 'bg-light dark:bg-dark border border-black/10 dark:border-white/10 rounded w-10 h-8' : ''
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
            />

            <RestTimerPicker
                visible={isRestPickerVisible}
                onClose={() => setIsRestPickerVisible(false)}
                initialValue={item.restTime ?? 90}
                onSave={(val) => {
                    onUpdateRestTime?.(val);
                    setIsRestPickerVisible(false);
                }}
            />
        </View>
    );
};
