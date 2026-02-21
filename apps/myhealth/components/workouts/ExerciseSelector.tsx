import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, SectionList, Modal, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useUITheme, HollowedCard, RaisedCard, Skeleton, IconSymbol } from '@mysuite/ui';
import { ScreenHeader } from '../ui/ScreenHeader';
import { BackButton } from '../ui/BackButton';
import DefaultExercises, { Groups } from '../../assets/data/default-exercises';
interface ExerciseSelectorProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (exercises: any[]) => void;
    exercises: any[];
    isLoading: boolean;
}

export const ExerciseSelector = ({
    visible,
    onClose,
    onSelect,
    exercises,
    isLoading
}: ExerciseSelectorProps) => {
    const theme = useUITheme();
    const [exerciseSearchQuery, setExerciseSearchQuery] = useState("");
    const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isFilterVisible, setIsFilterVisible] = useState(false);

    const uniqueMuscleGroups = ["All", ...Array.from(new Set(exercises.map(e => e.category))).filter(Boolean).sort()];
    const uniqueExerciseGroups = Array.from(new Set(exercises.map(e => e.group))).filter(g => g && g !== "Other").sort();

    const toggleCategory = (category: string) => {
        if (category === "All") {
            setSelectedCategories(new Set());
            return;
        }
        
        const newSet = new Set(selectedCategories);
        if (newSet.has(category)) {
            newSet.delete(category);
        } else {
            newSet.add(category);
        }
        setSelectedCategories(newSet);
    };

    const toggleSelection = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const sections = React.useMemo(() => {
        let filtered = exercises.filter(ex => ex.name.toLowerCase().includes(exerciseSearchQuery.toLowerCase()));
        
        if (selectedCategories.size > 0) {
            filtered = filtered.filter(ex => selectedCategories.has(ex.category) || selectedCategories.has(ex.group));
        }
        
        const result: { title: string, data: any[] }[] = [];
        
        // 1. Custom Exercises
        const custom = filtered.filter(ex => !DefaultExercises.some(d => d.id === ex.id));
        if (custom.length > 0) {
            result.push({ title: 'Custom Exercises', data: custom });
        }

        // 2. Grouped Default Exercises
        // Iterate over Groups to preserve order
        Object.entries(Groups).forEach(([groupName, groupExercises]) => {
            const groupIds = new Set(groupExercises.map((e: any) => e.id));
            const exercisesInGroup = filtered.filter(ex => groupIds.has(ex.id));
            
            if (exercisesInGroup.length > 0) {
                result.push({ title: groupName, data: exercisesInGroup });
            }
        });
        
        return result;
    }, [exercises, exerciseSearchQuery, selectedCategories]);

    const handleConfirm = () => {
        if (selectedIds.size === 0) return;
        const selectedExercises = exercises.filter(ex => selectedIds.has(ex.id));
        onSelect(selectedExercises);
        setSelectedIds(new Set()); // Reset selection
        setExerciseSearchQuery("");
        onClose();
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="fullScreen"
            onRequestClose={onClose}
        >
            <View className="flex-1 bg-light dark:bg-dark">
                <ScreenHeader 
                    title="Add Exercise" 
                    leftAction={<BackButton onPress={onClose} />}
                    rightAction={
                        selectedIds.size > 0 && (
                            <RaisedCard 
                                onPress={handleConfirm}
                                style={{ borderRadius: 9999 }}
                                className="w-12 h-12 p-0 my-0 rounded-full items-center justify-center bg-lighter dark:bg-dark-lighter"
                            >
                                <IconSymbol 
                                    name="checkmark" 
                                    size={24} 
                                    color={theme.primary} 
                                />
                            </RaisedCard>
                        )
                    }
                />
                <View className="flex-1 px-4 pt-32 pb-0">
                    {isLoading ? (
                        <View className="mt-4">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <View key={i} className="flex-row items-center justify-between py-3 border-b border-light dark:border-dark">
                                    <View className="flex-1">
                                        <Skeleton height={22} width="55%" className="mb-2" />
                                        <Skeleton height={14} width="35%" />
                                    </View>
                                    <View className="w-10 h-10 rounded-full bg-light-darker/10 dark:bg-highlight-dark/10" />
                                </View>
                            ))}
                        </View>
                    ) : (
                        <SectionList
                            sections={sections}
                            style={{ flex: 1 }}
                            contentContainerStyle={{ paddingBottom: 150 }}
                            keyExtractor={(item) => item.id}
                            ListHeaderComponent={
                                selectedCategories.size > 0 ? (
                                    <View className="pb-2 flex-row flex-wrap gap-2 mt-2">
                                        {Array.from(selectedCategories).sort().map(category => (
                                            <TouchableOpacity 
                                                key={category} 
                                                onPress={() => toggleCategory(category)}
                                                className="flex-row items-center bg-primary dark:bg-primary-dark px-3 py-1.5 rounded-full"
                                            >
                                                <Text className="text-white font-semibold text-xs mr-1">{category}</Text>
                                                <IconSymbol name="xmark" size={12} color="#fff" />
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                ) : null
                            }
                            renderSectionHeader={({ section: { title } }) => (
                                <View className="py-2 bg-light dark:bg-dark">
                                    <Text className="text-sm font-bold text-gray-500 uppercase tracking-widest">{title}</Text>
                                </View>
                            )}
                            renderItem={({ item }) => {
                                const isSelected = selectedIds.has(item.id);
                                return (
                                    <TouchableOpacity 
                                        className={`flex-row items-center justify-between py-3 px-2 border-b ${isSelected ? 'bg-primary/10 dark:bg-primary-dark/10 border-transparent rounded-xl' : 'border-light dark:border-dark'}`}
                                        onPress={() => toggleSelection(item.id)}
                                    >
                                        <View className="flex-1">
                                            <Text className={`text-base leading-6 font-semibold text-light dark:text-dark`} style={{ fontSize: 18 }}>{item.name}</Text>
                                            <Text className="text-light-muted dark:text-dark-muted text-sm">
                                                {item.category} • {item.properties?.join(', ') || item.type || item.rawType}
                                            </Text> 
                                        </View>
                                    </TouchableOpacity>
                                );
                            }}
                            ListEmptyComponent={
                                <View className="py-8">
                                    <HollowedCard className="p-8">
                                        <Text className="text-center text-light-muted dark:text-dark-muted">
                                            No exercises found. Try a different search.
                                        </Text>
                                    </HollowedCard>
                                </View>
                            }
                            showsVerticalScrollIndicator={false}
                            stickySectionHeadersEnabled={false}
                        />
                    )}
                </View>

                {/* Floating Bottom Search Bar */}
                <KeyboardAvoidingView 
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
                    className="absolute bottom-10 left-0 right-0 z-50 px-4 pb-8 pt-4 bg-transparent shadow-lg justify-end"
                    pointerEvents="box-none"
                >
                    {/* Filter Menu */}
                    {isFilterVisible && (
                        <View className="rounded-xl p-4 mb-2 z-50 shadow-[0_-8px_30px_-15px_rgba(0,0,0,0.3)] bg-lighter dark:bg-dark-lighter border border-white/10 dark:border-highlight-dark">
                            <ScrollView showsVerticalScrollIndicator={false} className="max-h-80" keyboardShouldPersistTaps="handled">
                                <TouchableOpacity 
                                    onPress={() => toggleCategory("All")}
                                    className={`self-start px-4 py-2 rounded-full mb-4 border ${selectedCategories.size === 0 ? 'bg-primary dark:bg-primary-dark border-transparent' : 'bg-transparent border-light dark:border-white/10'}`}
                                >
                                    <Text className={`font-semibold ${selectedCategories.size === 0 ? 'text-white' : 'text-light-muted dark:text-dark-muted'}`}>
                                        All
                                    </Text>
                                </TouchableOpacity>

                                <View className="mb-4">
                                    <Text className="text-light dark:text-dark font-bold mb-2 uppercase text-xs tracking-wider">Muscle Group</Text>
                                    <View className="flex-row flex-wrap gap-2">
                                        {uniqueMuscleGroups.map((category: any) => {
                                            if (category === "All") return null;
                                            return (
                                            <TouchableOpacity 
                                                key={category} 
                                                onPress={() => toggleCategory(category)}
                                                className={`px-4 py-2 rounded-full border ${selectedCategories.has(category) ? 'bg-primary dark:bg-primary-dark border-transparent' : 'bg-transparent border-light dark:border-white/10'}`}
                                            >
                                                <Text className={`font-semibold ${selectedCategories.has(category) ? 'text-white' : 'text-light-muted dark:text-dark-muted'}`}>
                                                    {category}
                                                </Text>
                                            </TouchableOpacity>
                                        )})}
                                    </View>
                                </View>

                                <View className="mb-4">
                                    <Text className="text-light dark:text-dark font-bold mb-2 uppercase text-xs tracking-wider">Exercise Group</Text>
                                    <View className="flex-row flex-wrap gap-2">
                                        {uniqueExerciseGroups.map((group: any) => (
                                            <TouchableOpacity 
                                                key={group} 
                                                onPress={() => toggleCategory(group)}
                                                className={`px-4 py-2 rounded-full border ${selectedCategories.has(group) ? 'bg-primary dark:bg-primary-dark border-transparent' : 'bg-transparent border-light dark:border-white/10'}`}
                                            >
                                                <Text className={`font-semibold ${selectedCategories.has(group) ? 'text-white' : 'text-light-muted dark:text-dark-muted'}`}>
                                                    {group}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            </ScrollView>
                        </View>
                    )}

                    <View className="flex-row items-center gap-2">
                        <View className="flex-1 flex-row items-center rounded-full px-4 h-12 border border-white/10 dark:border-highlight-dark shadow-xl bg-lighter dark:bg-dark-lighter">
                            <IconSymbol name="magnifyingglass" size={20} color={theme.placeholder || theme.textMuted || '#888'} />
                            <TextInput
                                className="flex-1 ml-2 text-base h-full text-light dark:text-dark"
                                placeholder="Search exercises..."
                                placeholderTextColor={theme.textMuted}
                                value={exerciseSearchQuery}
                                onChangeText={setExerciseSearchQuery}
                                autoCorrect={false}
                            />
                            {exerciseSearchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => setExerciseSearchQuery('')}>
                                    <IconSymbol name="xmark.circle.fill" size={20} color={theme.placeholder || theme.textMuted || '#888'} />
                                </TouchableOpacity>
                            )}
                        </View>
                        <TouchableOpacity 
                            activeOpacity={0.7}
                            onPress={() => setIsFilterVisible(!isFilterVisible)}
                            className={`w-12 h-12 rounded-full items-center justify-center border border-white/10 dark:border-highlight-dark shadow-xl bg-lighter dark:bg-dark-lighter ${isFilterVisible ? 'border-primary/50' : ''}`}
                        >
                            <IconSymbol 
                                name={"line.3.horizontal.decrease" as any} 
                                size={20} 
                                color={isFilterVisible ? theme.primary : (theme.icon || '#888')} 
                            />
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
};
