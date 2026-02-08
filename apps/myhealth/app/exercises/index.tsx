import React, { useState, useCallback } from 'react';
import { SectionList, TouchableOpacity, View, TextInput, Text, ScrollView } from 'react-native'; 
import { useRouter, useFocusEffect } from 'expo-router';

import { useUITheme, RaisedCard, HollowedCard, Skeleton, useToast, IconSymbol } from '@mysuite/ui';
import { useAuth } from '@mysuite/auth';
import { fetchExercises } from '../../providers/WorkoutManagerProvider';
import DefaultExercises, { Groups } from '../../assets/data/default-exercises';

import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { BackButton } from '../../components/ui/BackButton';

export default function ExercisesScreen() {
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
  const [isFilterVisible, setIsFilterVisible] = useState(false);

  const uniqueCategories = React.useMemo(() => {
      return ["All", ...Array.from(new Set(exercises.map(e => e.category))).filter(Boolean).sort()];
  }, [exercises]);

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
    let filtered = exercises.filter(ex => ex.name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (selectedCategories.size > 0) {
        filtered = filtered.filter(ex => selectedCategories.has(ex.category));
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
  }, [exercises, searchQuery, selectedCategories]);

  return (
    <View className="flex-1 bg-light dark:bg-dark">
      <ScreenHeader
        title="Exercises"
        leftAction={<BackButton />}
        rightAction={
            <RaisedCard 
                onPress={() => router.push('/exercises/create')}
                style={{ borderRadius: 9999 }}
                className="w-12 h-12 p-0 my-0 rounded-full items-center justify-center bg-light dark:bg-dark-lighter"
            >
                <IconSymbol 
                    name="square.and.pencil" 
                    size={24} 
                    color={theme.primary} 
                />
            </RaisedCard>
        }
      />
      
      <View className="mt-28 px-4 py-3 z-20">
        <View className="flex-row items-center gap-2">
            <View className="flex-1 flex-row items-center bg-light dark:bg-dark-lighter rounded-full px-4 h-10 border border-light-darker dark:border-highlight-dark">
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
            <RaisedCard 
                onPress={() => setIsFilterVisible(!isFilterVisible)}
                style={{ borderRadius: 14 }}
                className={`w-10 h-10 p-0 items-center justify-center ${isFilterVisible ? 'bg-primary/10' : ''}`}
            >
                <IconSymbol 
                    name={"line.3.horizontal.decrease" as any} 
                    size={20} 
                    color={isFilterVisible ? theme.primary : (theme.icon || '#888')} 
                />
            </RaisedCard>
        </View>
        
        {/* Filter Menu */}
        {isFilterVisible && (
            <RaisedCard className="rounded-xl p-4 mt-4 absolute top-12 left-4 right-4 z-50 shadow-xl bg-light dark:bg-dark-lighter border border-light-darker/50 dark:border-highlight-dark">
                <ScrollView showsVerticalScrollIndicator={false} className="max-h-96" keyboardShouldPersistTaps="handled">
                    <TouchableOpacity 
                        onPress={() => toggleCategory("All")}
                        className={`self-start px-4 py-2 rounded-full mb-4 border ${selectedCategories.size === 0 ? 'bg-primary dark:bg-primary-dark border-transparent' : 'bg-transparent border-light dark:border-white/10'}`}
                    >
                        <Text className={`font-semibold ${selectedCategories.size === 0 ? 'text-white' : 'text-light-muted dark:text-dark-muted'}`}>
                            All
                        </Text>
                    </TouchableOpacity>

                    {["Chest & Arms", "Back & Core", "Lower Body", "Other"].map(group => {
                        // Filter uniqueCategories that belong to this group
                        const catsInGroup = uniqueCategories.filter(cat => {
                            if (cat === "All") return false;
                            const NOTE_GROUPS: any = {
                                "Chest & Arms": ["Chest", "Shoulders", "Biceps", "Triceps", "Forearms"],
                                "Back & Core": ["Back", "Neck", "Traps", "Lats","Abdominals", "Abs", "Core", "Lower Back", "Upper Back"],
                                "Lower Body": ["Quadriceps", "Hamstrings", "Calves", "Glutes", "Adductors", "Abductors", "Legs"],
                                "General": ["Cardio", "Olympic", "Full Body", "Other", "Plyometrics", "Strongman", "Powerlifting", "Stretching"]
                            };
                            const foundGroup = Object.keys(NOTE_GROUPS).find(g => NOTE_GROUPS[g].includes(cat)) || "Other";
                            return foundGroup === group;
                        });

                        if (catsInGroup.length === 0) return null;

                        return (
                            <View key={group} className="mb-4">
                                <Text className="text-light dark:text-dark font-bold mb-2 uppercase text-xs tracking-wider">{group}</Text>
                                <View className="flex-row flex-wrap gap-2">
                                    {catsInGroup.map((category) => (
                                        <TouchableOpacity 
                                            key={category} 
                                            onPress={() => toggleCategory(category)}
                                            className={`px-4 py-2 rounded-full border ${selectedCategories.has(category) ? 'bg-primary dark:bg-primary-dark border-transparent' : 'bg-transparent border-light dark:border-white/10'}`}
                                        >
                                            <Text className={`font-semibold ${selectedCategories.has(category) ? 'text-white' : 'text-light-muted dark:text-dark-muted'}`}>
                                                {category}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        );
                    })}
                </ScrollView>
            </RaisedCard>
        )}
      </View>
      
      {isLoading ? (
        <View className="flex-1 px-4 mt-4">
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
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
            selectedCategories.size > 0 ? (
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
            ) : null
        }
        renderSectionHeader={({ section: { title } }) => (
            <View className="px-4 py-2 bg-light dark:bg-dark">
                <Text className="text-sm font-bold text-gray-500 uppercase tracking-widest">{title}</Text>
            </View>
        )}
        renderItem={({ item }) => (
          <TouchableOpacity 
            className="flex-row items-center justify-between p-4 bg-light dark:bg-dark"
            onPress={() => {
                router.push({
                    pathname: '/exercises/details',
                    params: { exercise: JSON.stringify(item) }
                });
            }}
          >
            <View>
                <Text className="text-base leading-6 font-semibold text-light dark:text-dark">{item.name}</Text>
                <Text className="text-xs text-light-muted dark:text-dark-muted">
                    {item.category} • {item.properties?.join(', ') || item.rawType}
                </Text> 
            </View>
          </TouchableOpacity>
        )}
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120 }}
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
    </View>
  );
}
