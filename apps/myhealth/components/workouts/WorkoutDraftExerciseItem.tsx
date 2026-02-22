import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useUITheme as useTheme, IconSymbol } from '@mysuite/ui';
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
        <View className="bg-light-lighter dark:bg-dark-lighter rounded-xl mb-3 overflow-hidden border border-black/5 dark:border-white/10">
            <TouchableOpacity 
                onPress={onToggleExpand}
                className="flex-row items-center justify-between p-3"
            >
                <View className="flex-1 mr-2">
                    <Text className="text-base text-light dark:text-dark leading-6 font-semibold">{item.name}</Text>
                    <Text className="text-gray-500 dark:text-gray-400 text-sm">
                        {item.sets} Sets
                    </Text>
                </View>
                <View className="flex-row items-center">
                    {isEditing && (
                        <>
                            <TouchableOpacity onPress={(e) => { e.stopPropagation(); onMove(-1); }} className="p-2"> 
                                <IconSymbol name="arrow.up" size={16} color={theme.icon || '#888'} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={(e) => { e.stopPropagation(); onMove(1); }} className="p-2"> 
                                <IconSymbol name="arrow.down" size={16} color={theme.icon || '#888'} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={(e) => { e.stopPropagation(); onRemove(); }} className="p-2 ml-1"> 
                                <IconSymbol name="trash.fill" size={18} color={theme.options?.destructiveColor || '#ff4444'} />
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </TouchableOpacity>
            
            {isExpanded && (
                <View className="px-3 pb-3 pt-1 bg-light/50 dark:bg-dark/30">
                    <View className="flex-row mb-2">
                        <Text className="w-10 text-xs text-gray-500 font-semibold text-center">Set</Text>
                        {showBodyweight && <Text className="w-12 text-xs text-gray-500 font-semibold text-center">{latestBodyWeight ? 'Lbs' : 'BW'}</Text>}
                        {showWeight && <Text className="flex-1 text-xs text-gray-500 font-semibold text-center">Lbs</Text>}
                        {showReps && <Text className="flex-1 text-xs text-gray-500 font-semibold text-center">Reps</Text>}
                        {showDuration && <Text className="flex-1 text-xs text-gray-500 font-semibold text-center">Time</Text>}
                        {showDistance && <Text className="flex-1 text-xs text-gray-500 font-semibold text-center">Dist</Text>}
                        <View className="w-8" />
                    </View>
                    {currentTargets.map((set: any, setIdx: number) => (
                        <View key={setIdx} className="flex-row items-center mb-2">
                            <Text className="w-10 text-light dark:text-dark text-center font-medium">{setIdx + 1}</Text>
                            
                            {showBodyweight && (
                                <View className="w-12 items-center justify-center">
                                    <Text className="text-sm font-bold text-black/50 dark:text-white/50">
                                        {latestBodyWeight ? `${latestBodyWeight}` : 'BW'}
                                    </Text>
                                </View>
                            )}

                            {showWeight && (
                                <View className="flex-1 flex-row justify-center">
                                    {isEditing ? (
                                        <TextInput 
                                            value={String(set.weight || 0)} 
                                            keyboardType="numeric"
                                            onChangeText={(v) => onUpdateSet(setIdx, 'weight', v)}
                                            className="bg-light dark:bg-dark border border-black/10 dark:border-white/10 rounded px-2 py-1 w-16 text-center text-light dark:text-dark"
                                            selectTextOnFocus
                                            editable={isEditing}
                                        />
                                    ) : (
                                        <Text className="text-light dark:text-dark font-medium">{set.weight || 0}</Text>
                                    )}
                                </View>
                            )}

                            {showReps && (
                                <View className="flex-1 flex-row justify-center">
                                    {isEditing ? (
                                        <TextInput 
                                            value={String(set.reps || 0)} 
                                            keyboardType="numeric"
                                            onChangeText={(v) => onUpdateSet(setIdx, 'reps', v)}
                                            className="bg-light dark:bg-dark border border-black/10 dark:border-white/10 rounded px-2 py-1 w-16 text-center text-light dark:text-dark"
                                            selectTextOnFocus
                                            editable={isEditing}
                                        />
                                    ) : (
                                        <Text className="text-light dark:text-dark font-medium">{set.reps || 0}</Text>
                                    )}
                                </View>
                            )}

                            {showDuration && (
                                <View className="flex-1 flex-row justify-center">
                                    {isEditing ? (
                                        <TextInput 
                                            value={String(set.duration || 0)} 
                                            keyboardType="numeric"
                                            onChangeText={(v) => onUpdateSet(setIdx, 'duration', v)}
                                            className="bg-light dark:bg-dark border border-black/10 dark:border-white/10 rounded px-2 py-1 w-16 text-center text-light dark:text-dark"
                                            selectTextOnFocus
                                            editable={isEditing}
                                        />
                                    ) : (
                                        <Text className="text-light dark:text-dark font-medium">{set.duration || 0}</Text>
                                    )}
                                </View>
                            )}

                            {showDistance && (
                                <View className="flex-1 flex-row justify-center">
                                    {isEditing ? (
                                        <TextInput 
                                            value={String(set.distance || 0)} 
                                            keyboardType="numeric"
                                            onChangeText={(v) => onUpdateSet(setIdx, 'distance', v)}
                                            className="bg-light dark:bg-dark border border-black/10 dark:border-white/10 rounded px-2 py-1 w-16 text-center text-light dark:text-dark"
                                            selectTextOnFocus
                                            editable={isEditing}
                                        />
                                    ) : (
                                        <Text className="text-light dark:text-dark font-medium">{set.distance || 0}</Text>
                                    )}
                                </View>
                            )}

                            {isEditing && (
                                <TouchableOpacity 
                                    onPress={() => onRemoveSet(setIdx)}
                                    className="w-8 items-center justify-center rounded h-8 ml-2"
                                >
                                    <IconSymbol name="minus.circle.fill" size={20} color="#ff4444" />
                                </TouchableOpacity>
                            )}
                        </View>
                    ))}
                    {isEditing && (
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
