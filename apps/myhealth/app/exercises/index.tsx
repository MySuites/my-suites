import React, { useState, useCallback } from 'react';
import { SectionList, TouchableOpacity, View, TextInput, Text, ScrollView, KeyboardAvoidingView, Platform } from 'react-native'; 
import { useRouter, useFocusEffect } from 'expo-router';

import { useUITheme, RaisedCard, HollowedCard, Skeleton, useToast, IconSymbol } from '@mysuite/ui';
import { useAuth } from '@mysuite/auth';
import { fetchExercises } from '../../providers/WorkoutManagerProvider';
import DefaultExercises, { Groups } from '../../assets/data/default-exercises';

import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { BackButton } from '../../components/ui/BackButton';

export interface ExercisesScreenProps {
  mode?: 'browse' | 'select';
  onSelect?: (exercises: any[]) => void;
  onClose?: () => void;
}

export default function ExercisesScreen({
  mode = 'browse',
  onSelect,
  onClose
}: ExercisesScreenProps) {
  const router = useRouter();
  const theme = useUITheme();

  const { user } = useAuth();
  const [exercises, setExercises] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      async function load() {
          const { data, error } = await fetchExercises(user);
          if (error) {
            showToast({ message: "Failed to load exercises", type: 'error' });
          } else if (data && isMounted) {
            setExercises(data);
          }
          setIsLoading(false);
      }
      load();

      return () => {
        isMounted = false;
      };
    }, [user, showToast])
  );

  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isFilterVisible, setIsFilterVisible] = useState(false);

  const handleConfirm = () => {
      if (selectedIds.size === 0) return;
      const selectedExercises = exercises.filter(ex => selectedIds.has(ex.id));
      if (onSelect) {
          onSelect(selectedExercises);
      }
      setSelectedIds(new Set());
      setSearchQuery("");
      if (onClose) {
          onClose();
      }
  };

  // Filter out non-active progression exercises
  const processedExercises = React.useMemo(() => {
      const progressionMap = new Map<string, any[]>();
      const singles: any[] = [];

      exercises.forEach(e => {
        if (e.progressionId) {
          if (!progressionMap.has(e.progressionId)) progressionMap.set(e.progressionId, []);
          progressionMap.get(e.progressionId)?.push(e);
        } else {
          singles.push(e);
        }
      });
      
      
      const progressionRepresentatives: any[] = [];
      progressionMap.forEach((group, progressionId) => {
        let representative = group.find(e => e.isActiveProgression);
        
        if (!representative) {
          const sorted = group.sort((a, b) => (a.difficulty || 0) - (b.difficulty || 0));
          if (sorted.length > 0) representative = sorted[0];
        }

        if (representative) {
            // Extract the base object name directly from its progression ID (e.g. barbell_bench_press_progression -> Barbell Bench Press)
            const baseId = progressionId.replace('_progression', '');
            const progressionName = baseId
                .split('_')
                .map(w => w.charAt(0).toUpperCase() + w.slice(1))
                .join(' ');

            progressionRepresentatives.push({
                ...representative,
                name: progressionName
            });
        }
      });

      return [...singles, ...progressionRepresentatives];
  }, [exercises]);

  const uniqueMuscleGroups = React.useMemo(() => ["All", ...Array.from(new Set(processedExercises.flatMap(e => e.muscle_groups || []))).filter(Boolean).sort()], [processedExercises]);
  const uniqueExerciseGroups = React.useMemo(() => Array.from(new Set(processedExercises.map(e => e.group))).filter(g => g && g !== "Other").sort(), [processedExercises]);

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

  const sections = React.useMemo(() => {
    let filtered = processedExercises.filter(ex => ex.name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Hide non-active variations from the main list unless the user is actively searching
    if (!searchQuery) {
        filtered = filtered.filter(ex => !ex.progressionId || ex.isActiveProgression);
    }
    
    if (selectedCategories.size > 0) {
        filtered = filtered.filter(ex => 
            (ex.muscle_groups || []).some((m: string) => selectedCategories.has(m)) || 
            selectedCategories.has(ex.group)
        );
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
        const groupIds = new Set(groupExercises.map(e => e.id));
        const exercisesInGroup = filtered.filter(ex => groupIds.has(ex.id));
        
        if (exercisesInGroup.length > 0) {
            result.push({ title: groupName, data: exercisesInGroup });
        }
    });

    // Optional: catch-all for defaults that didn't match a group (shouldn't happen with correct data)
    // const caughtIds = new Set(result.flatMap(s => s.data.map(e => e.id)));
    // const uncaughtDefaults = filtered.filter(ex => DefaultExercises.some(d => d.id === ex.id) && !caughtIds.has(ex.id));
    // if (uncaughtDefaults.length > 0) { ... }
    
    return result;
  }, [processedExercises, searchQuery, selectedCategories]);

  return (
    <View className="flex-1 bg-light dark:bg-dark">
        <ScreenHeader
            title={mode === 'select' ? "Add Exercise" : "Exercises"}
            leftAction={mode === 'select' ? <BackButton onPress={onClose} /> : <BackButton />}
            rightAction={
                <RaisedCard 
                    onPress={() => router.push('/exercises/create')}
                    className="w-12 p-0 my-0 rounded-full items-center justify-center bg-lighter dark:bg-dark-lighter"
                >
                    <IconSymbol 
                        name="square.and.pencil" 
                        size={24}
                        color={theme.primary} 
                    />
                </RaisedCard>
            }
        />
      
        {isLoading ? (
            <View className="flex-1 px-4 mt-32">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <View key={i} className="flex-row items-center justify-between py-4 border-b border-light-darker/10 dark:border-highlight-dark/10">
                        <View className="flex-1">
                            <Skeleton height={20} width="60%" className="mb-2" />
                            <Skeleton height={14} width="40%" />
                        </View>
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
                <View>
                    <View className="h-32" />
                    {selectedCategories.size > 0 && (
                        <View className="px-4 pb-2 flex-row flex-wrap gap-2 mt-2">
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
                    )}
                </View>
            }
            renderSectionHeader={({ section: { title } }) => (
                <View className="px-4 py-2 bg-light dark:bg-dark">
                    <Text className="text-sm font-bold text-gray-500 uppercase tracking-widest">{title}</Text>
                </View>
            )}
            renderItem={({ item }) => {
            const isSelected = selectedIds.has(item.id);
            return (
            <TouchableOpacity 
                className="flex-row items-center justify-between py-4 pr-6 bg-light dark:bg-dark"
                style={{ paddingLeft: mode === 'select' ? 24 : 24 }}
                onPress={() => {
                    if (mode === 'select') {
                        const newSet = new Set(selectedIds);
                        if (newSet.has(item.id)) newSet.delete(item.id);
                        else newSet.add(item.id);
                        setSelectedIds(newSet);
                    } else {
                        router.push({
                            pathname: '/exercises/details',
                            params: { exercise: JSON.stringify(item) }
                        });
                    }
                }}
            >
                {mode === 'select' && isSelected && (
                    <View className="mr-3">
                        <IconSymbol name={"righttriangle.fill" as any} size={22} color={theme.primary as string} />
                    </View>
                )}
                <View className="flex-1 mr-4">
                    <Text className="text-base leading-6 font-semibold text-light dark:text-dark">{item.name}</Text>
                    <Text className="text-xs text-light-muted dark:text-dark-muted">
                        {item.muscle_groups?.join(', ')} • {item.properties?.join(', ') || item.rawType}
                    </Text> 
                </View>
                {mode === 'select' ? (
                    <TouchableOpacity 
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        onPress={() => {
                            router.push({
                                pathname: '/exercises/details',
                                params: { exercise: JSON.stringify(item) }
                            });
                        }}
                    >
                        <IconSymbol name={"info.circle" as any} size={22} color={theme.textMuted || '#888'} />
                    </TouchableOpacity>
                ) : (
                    <IconSymbol name="chevron.right" size={16} color={theme.textMuted || '#888'} />
                )}
            </TouchableOpacity>
            )}}
            ItemSeparatorComponent={() => <View className="h-[1px] bg-black/10 dark:bg-white/10 mx-4" />}
            stickySectionHeadersEnabled={false}
            ListEmptyComponent={
                <View className="px-4 py-8">
                    <HollowedCard className="p-8">
                        <Text className="text-base text-center leading-6 text-light-muted dark:text-dark-muted">
                            No exercises found. Try a different search or create a new exercise!
                        </Text>
                    </HollowedCard>
                </View>
            }
            showsVerticalScrollIndicator={false}
        />
        )}

        {/* Floating Bottom Search Bar */}
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
            className="absolute bottom-10 left-0 right-0 z-50 px-4 pb-8 pt-4 bg-transparent shadow-lg justify-end"
            pointerEvents="box-none"
        >
        {/* Filter Menu (opens upwards when search is at bottom) */}
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

        <View className="flex-row justify-center mb-2 h-12 z-40" pointerEvents="box-none">
            {mode === 'select' && selectedIds.size > 0 && (
                <RaisedCard 
                    onPress={handleConfirm}
                    className="w-64 h-full p-0 rounded-full items-center justify-center bg-primary dark:bg-primary-dark shadow-xl"
                >
                    <Text className="text-white font-bold text-base">
                        Add {selectedIds.size} {selectedIds.size === 1 ? 'Exercise' : 'Exercises'}
                    </Text>
                </RaisedCard>
            )}
        </View>

        <View className="flex-row items-center gap-2">
            <View className="flex-1 flex-row items-center rounded-full px-4 h-12 border border-white/10 dark:border-highlight-dark shadow-xl bg-lighter dark:bg-dark-lighter">
                <IconSymbol name="magnifyingglass" size={20} color={theme.placeholder || theme.textMuted || '#888'} />
                <TextInput
                    className="flex-1 ml-2 text-base h-full text-light dark:text-dark"
                    placeholder="Search exercises..."
                    placeholderTextColor={theme.textMuted}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoCorrect={false}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
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
  );
}
