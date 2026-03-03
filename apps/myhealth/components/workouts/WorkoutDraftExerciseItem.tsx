import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Dimensions, Modal } from 'react-native';
import { useUITheme as useTheme, IconSymbol, RaisedCard } from '@mysuite/ui';
import { getExerciseDefaultProperties } from '../../providers/WorkoutManagerProvider';

export interface WorkoutDraftExerciseItemProps {
    item: any;
    index: number;
    isExpanded: boolean;
    onToggleExpand: () => void;
    onMove: (dir: -1 | 1) => void;
    onRemove: () => void;
    onUpdateSet: (setIndex: number, field: 'reps' | 'weight' | 'duration' | 'distance', value: string) => void;
    onAddSet: () => void;
    onRemoveSet: (setIndex: number) => void;
    latestBodyWeight?: number | null;
    isEditing: boolean;
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
    isEditing
}: WorkoutDraftExerciseItemProps) => {
    const theme = useTheme();
    const [menuVisible, setMenuVisible] = useState(false);
    const ellipsisRef = useRef<View>(null);
    const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
    const [isLocalEditing, setIsLocalEditing] = useState(item.isNewlyAdded || false);

    useEffect(() => {
        if (!isEditing) {
            setIsLocalEditing(false);
        }
    }, [isEditing]);

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
            showDistance: lowerProps.includes('distance')
        };
    };

    const { showBodyweight, showWeight, showReps, showDuration, showDistance } = getExerciseFields(item.properties, item.id);
    
    // Ensure duration falls back to reps if needed (legacy data fix for display)
    const rawTargets = item.setTargets || Array.from({ length: item.sets || 1 }, () => ({ reps: item.reps || 0, weight: 0 }));
    const currentTargets = rawTargets.map((t: any) => ({
        ...t,
        duration: t.duration || (showDuration ? (item.duration || item.reps) : 0),
        distance: t.distance || 0
    }));

    return (
        <View 
            style={{ 
                zIndex: menuVisible ? 10 : 1 
            }}
        >
            <View className="flex-row justify-between items-center">
                <TouchableOpacity 
                onPress={onToggleExpand}
                className="p-3 flex-1"
                style={{ zIndex: menuVisible ? 999 : 1, elevation: menuVisible ? 999 : 1 }}>
                    <Text className="text-base text-light dark:text-dark leading-6 font-semibold">{item.name}</Text>
                </TouchableOpacity>
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
                                <TouchableOpacity onPress={(e) => { e.stopPropagation(); setMenuVisible(false); setIsLocalEditing(!isLocalEditing); }} className="flex-row items-center p-3 rounded-lg active:bg-black/5 dark:active:bg-white/5">
                                    <IconSymbol name={isLocalEditing ? "checkmark" : "pencil"} size={18} color={theme.text as string} style={{ marginRight: 12 }} />
                                    <Text style={{ color: theme.text as string }} className="font-medium">{isLocalEditing ? "Done" : "Edit"}</Text>
                                </TouchableOpacity>
                                <View className="h-[1px] bg-black/5 dark:bg-white/5 my-1" />
                                <TouchableOpacity onPress={(e) => { e.stopPropagation(); setMenuVisible(false); onMove(-1); }} className="flex-row items-center p-3 rounded-lg active:bg-black/5 dark:active:bg-white/5">
                                    <IconSymbol name="arrow.up" size={18} color={theme.text as string} style={{ marginRight: 12 }} />
                                    <Text style={{ color: theme.text as string }} className="font-medium">Move Up</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={(e) => { e.stopPropagation(); setMenuVisible(false); onMove(1); }} className="flex-row items-center p-3 rounded-lg active:bg-black/5 dark:active:bg-white/5">
                                    <IconSymbol name="arrow.down" size={18} color={theme.text as string} style={{ marginRight: 12 }} />
                                    <Text style={{ color: theme.text as string }} className="font-medium">Move Down</Text>
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
                                            value={String(set.weight || 0)} 
                                            keyboardType="numeric"
                                            onChangeText={(v) => onUpdateSet(setIdx, 'weight', v)}
                                            className="bg-light dark:bg-dark border border-black/10 dark:border-white/10 rounded px-2 py-1 w-16 text-center text-light dark:text-dark"
                                            selectTextOnFocus
                                            editable={_isEditing}
                                        />
                                    ) : (
                                        <Text className="text-light dark:text-dark font-medium">{set.weight || 0}</Text>
                                    )}
                                </View>
                            )}

                            {showReps && (
                                <View className="flex-1 flex-row justify-center">
                                    {_isEditing ? (
                                        <TextInput 
                                            value={String(set.reps || 0)} 
                                            keyboardType="numeric"
                                            onChangeText={(v) => onUpdateSet(setIdx, 'reps', v)}
                                            className="bg-light dark:bg-dark border border-black/10 dark:border-white/10 rounded px-2 py-1 w-16 text-center text-light dark:text-dark"
                                            selectTextOnFocus
                                            editable={_isEditing}
                                        />
                                    ) : (
                                        <Text className="text-light dark:text-dark font-medium">{set.reps || 0}</Text>
                                    )}
                                </View>
                            )}

                            {showDuration && (
                                <View className="flex-1 flex-row justify-center">
                                    {_isEditing ? (
                                        <TextInput 
                                            value={String(set.duration || 0)} 
                                            keyboardType="numeric"
                                            onChangeText={(v) => onUpdateSet(setIdx, 'duration', v)}
                                            className="bg-light dark:bg-dark border border-black/10 dark:border-white/10 rounded px-2 py-1 w-16 text-center text-light dark:text-dark"
                                            selectTextOnFocus
                                            editable={_isEditing}
                                        />
                                    ) : (
                                        <Text className="text-light dark:text-dark font-medium">{set.duration || 0}</Text>
                                    )}
                                </View>
                            )}

                            {showDistance && (
                                <View className="flex-1 flex-row justify-center">
                                    {_isEditing ? (
                                        <TextInput 
                                            value={String(set.distance || 0)} 
                                            keyboardType="numeric"
                                            onChangeText={(v) => onUpdateSet(setIdx, 'distance', v)}
                                            className="bg-light dark:bg-dark border border-black/10 dark:border-white/10 rounded px-2 py-1 w-16 text-center text-light dark:text-dark"
                                            selectTextOnFocus
                                            editable={_isEditing}
                                        />
                                    ) : (
                                        <Text className="text-light dark:text-dark font-medium">{set.distance || 0}</Text>
                                    )}
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
                    {_isEditing && (
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
        </View>
    );
};
