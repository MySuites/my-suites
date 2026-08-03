import React, { useState, useCallback } from 'react';
import { SectionList, TouchableOpacity, View, TextInput, Text, ScrollView, KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback, Pressable } from 'react-native'; 
import { useRouter, useFocusEffect } from 'expo-router';

import { useUITheme, RaisedCard, HollowedCard, Skeleton, useToast, IconSymbol } from '@mysuite/ui';
import { useAuth } from '@mysuite/auth';
import { fetchExercises } from '../../providers/WorkoutManagerProvider';
import DefaultExercises from '../../assets/data/default-exercises';
import ExerciseDetailsScreen from '../exercises/details';

import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { BackButton } from '../../components/ui/BackButton';
import { TopNavBanner } from '../../components/ui/TopNavBanner';
import { BottomActionBar } from '../../components/ui/BottomNavBar';
import { DashboardButton } from '../../components/ui/DashboardButton';
import { BottomNavButton } from '../../components/ui/BottomNavButton';
import { BurgerMenu } from '../../components/ui/BurgerMenu';

function getCollapsedGroupDetails(comp: any[]) {
    const ids = comp.map(e => e.id);
    
    if (ids.some(id => id.includes('split_squat') || id.includes('bulgarian'))) {
        return {
            name: "Split Squat",
            representativeId: "split_squat",
            subtitle: `${comp.length} variations (Bodyweight, Bulgarian...)`
        };
    }
    if (ids.some(id => id.includes('lunge'))) {
        return {
            name: "Lunge",
            representativeId: "lunges",
            subtitle: `${comp.length} variations (Bodyweight, Weighted...)`
        };
    }
    if (ids.includes('push_up') || ids.includes('pushup')) {
        return {
            name: "Push-up",
            representativeId: "push_up",
            subtitle: `${comp.length} variations (Wall, Incline, Knee, Decline...)`
        };
    }
    if (ids.some(id => id === 'weighted_squat' || id === 'barbell_squat')) {
        return {
            name: "Weighted Squat",
            representativeId: "weighted_squat",
            subtitle: `${comp.length} variations (Goblet, Barbell, Hack, Pendulum...)`
        };
    }
    if (ids.some(id => id.includes('squat'))) {
        return {
            name: "Squat",
            representativeId: "bodyweight_squat",
            subtitle: `${comp.length} variations (Bodyweight, Sissy, Shrimp, Pistol...)`
        };
    }
    if (ids.some(id => id.includes('tricep') || id.includes('skullcrusher'))) {
        return {
            name: "Tricep Extension / Pushdown",
            representativeId: "cable_tricep_pushdown",
            subtitle: `${comp.length} variations (Cable, Dumbbell, Overhead, Kickbacks...)`
        };
    }
    if (ids.some(id => id.includes('lateral_raise') || id.includes('delt_raise'))) {
        return {
            name: "Lateral Raise",
            representativeId: "lateral_raise",
            subtitle: `${comp.length} variations (Dumbbell, Cable, Machine...)`
        };
    }
    if (ids.some(id => id.includes('shoulder_press') || id.includes('overhead_press') || id.includes('arnold_press'))) {
        return {
            name: "Shoulder Press",
            representativeId: "shoulder_press",
            subtitle: `${comp.length} variations (Dumbbell, Barbell, Machine, Arnold...)`
        };
    }
    if (ids.some(id => id.includes('deadlift'))) {
        return {
            name: "Deadlift",
            representativeId: "deadlift",
            subtitle: `${comp.length} variations (Standard, Romanian...)`
        };
    }
    if (ids.some(id => id.includes('calf_raise'))) {
        return {
            name: "Calf Raise",
            representativeId: "calf_raise",
            subtitle: `${comp.length} variations (Bodyweight, Dumbbell, Machine...)`
        };
    }
    if (ids.some(id => id.includes('leg_curl'))) {
        return {
            name: "Leg Curl",
            representativeId: "seated_leg_curl",
            subtitle: `${comp.length} variations (Seated, Lying...)`
        };
    }
    if (ids.some(id => id.includes('leg_press'))) {
        return {
            name: "Leg Press",
            representativeId: "leg_press",
            subtitle: `${comp.length} variations (Standard, Horizontal...)`
        };
    }
    if (ids.some(id => id.includes('plank'))) {
        return {
            name: "Plank",
            representativeId: "plank",
            subtitle: `${comp.length} variations (Standard, Side, Weighted...)`
        };
    }
    if (ids.includes('pull_up') || ids.includes('pullup')) {
        return {
            name: "Pull-up",
            representativeId: "pull_up",
            subtitle: `${comp.length} variations (Standard, Weighted...)`
        };
    }
    if (ids.includes('chin_up') || ids.includes('chinup')) {
        return {
            name: "Chin-up",
            representativeId: "chin_up",
            subtitle: `${comp.length} variations (Standard, Weighted...)`
        };
    }
    if (ids.some(id => id.includes('handstand') || id.includes('crow_pose') || id.includes('frog_stand'))) {
        return {
            name: "Handstand / Balance",
            representativeId: "handstand",
            subtitle: `${comp.length} variations (Frog Stand, Crow, Wall, Freestanding...)`
        };
    }
    if (ids.some(id => id.includes('planche'))) {
        return {
            name: "Planche",
            representativeId: "tuck_planche",
            subtitle: `${comp.length} variations (Pseudo Planche, Tuck, Straddle, Full...)`
        };
    }
    if (ids.some(id => id.includes('front_lever'))) {
        return {
            name: "Front Lever",
            representativeId: "tuck_front_lever",
            subtitle: `${comp.length} variations (Tuck, Straddle, Full...)`
        };
    }
    if (ids.some(id => id.includes('back_lever'))) {
        return {
            name: "Back Lever",
            representativeId: "tuck_back_lever",
            subtitle: `${comp.length} variations (Tuck, Straddle, Full...)`
        };
    }

    const sorted = [...comp].sort((a, b) => (a.difficulty || 0) - (b.difficulty || 0));
    const rep = sorted[0];
    return {
        name: rep.name,
        representativeId: rep.id,
        subtitle: `${comp.length} variations`
    };
}

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
  const [inputText, setInputText] = useState('');
  const searchInputRef = React.useRef<TextInput>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [detailsExercise, setDetailsExercise] = useState<any | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  // Tabs stay mounted when you switch away — without this, leaving the
  // burger menu open and navigating elsewhere means it's still open when
  // you come back.
  useFocusEffect(useCallback(() => () => setMenuVisible(false), []));
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  React.useEffect(() => {
      const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
      const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
      const showSub = Keyboard.addListener(showEvent, () => setIsKeyboardVisible(true));
      const hideSub = Keyboard.addListener(hideEvent, () => setIsKeyboardVisible(false));
      return () => {
          showSub.remove();
          hideSub.remove();
      };
  }, []);


  React.useEffect(() => {
      const timeoutId = setTimeout(() => {
          setSearchQuery(inputText);
      }, 50);
      return () => clearTimeout(timeoutId);
  }, [inputText]);
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
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const toggleGroupExpanded = (groupId: string) => {
      setExpandedGroups(prev => {
          const next = new Set(prev);
          if (next.has(groupId)) {
              next.delete(groupId);
          } else {
              next.add(groupId);
          }
          return next;
      });
  };

  const handleConfirm = () => {
      if (selectedIds.size === 0) return;
      const selectedExercises = exercises.filter(ex => selectedIds.has(ex.id));
      if (onSelect) {
          onSelect(selectedExercises);
      }
      setSelectedIds(new Set());
      setSearchQuery("");
      setInputText("");
      searchInputRef.current?.clear();
      if (onClose) {
          onClose();
      }
  };

  // Filter out non-active progression exercises and combine similar ones
  const processedExercises = React.useMemo(() => {
      // 1. Build undirected adjacency maps for default exercises to find connected components
      const adj = new Map<string, Set<string>>();
      exercises.forEach(ex => {
          if (!adj.has(ex.id)) adj.set(ex.id, new Set());
          (ex.nextVariations || []).forEach((childId: string) => {
              if (!adj.has(childId)) adj.set(childId, new Set());
              adj.get(ex.id)!.add(childId);
              adj.get(childId)!.add(ex.id);
          });
      });

      // 2. Find connected components (groups)
      const visited = new Set<string>();
      const resultList: any[] = [];

      const defaultExs = exercises.filter(ex => DefaultExercises.some(d => d.id === ex.id));
      const customExs = exercises.filter(ex => !DefaultExercises.some(d => d.id === ex.id));

      defaultExs.forEach(ex => {
          if (!visited.has(ex.id)) {
              const comp: any[] = [];
              const queue = [ex.id];
              visited.add(ex.id);

              while (queue.length > 0) {
                  const currId = queue.shift()!;
                  const currEx = defaultExs.find(e => e.id === currId);
                  if (currEx) {
                      comp.push(currEx);
                  }
                  const neighbors = adj.get(currId) || new Set();
                  neighbors.forEach(neighId => {
                      if (!visited.has(neighId)) {
                          visited.add(neighId);
                          queue.push(neighId);
                      }
                  });
              }

              if (comp.length > 1) {
                  const details = getCollapsedGroupDetails(comp);
                  const representative = comp.find(e => e.id === details.representativeId) || comp[0];
                  resultList.push({
                      isGroup: true,
                      id: `group_${details.name.replace(/\s+/g, '_').toLowerCase()}`,
                      name: details.name,
                      subtitle: details.subtitle,
                      variations: comp,
                      representative: representative,
                      muscle_groups: Array.from(new Set(comp.flatMap(e => e.muscle_groups || []))).filter(Boolean),
                      difficulty: representative.difficulty || 0,
                      group: representative.group || "Other"
                  });
              } else if (comp.length === 1) {
                  resultList.push(comp[0]);
              }
          }
      });

      return [...resultList, ...customExs];
  }, [exercises]);

  const uniqueMuscleGroups = React.useMemo(() => ["All", ...Array.from(new Set(processedExercises.flatMap(e => e.muscle_groups || []))).filter(Boolean).sort()], [processedExercises]);

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
    const normalizeSearch = (text: string) => text.toLowerCase().replace(/[-_\s]+/g, ' ').trim();
    const normalizedQuery = normalizeSearch(searchQuery);

    const flattenData = (dataArray: any[]) => {
        const flat: any[] = [];
        dataArray.forEach(item => {
            flat.push(item);
            if (item.isGroup && mode === 'select' && expandedGroups.has(item.id)) {
                item.variations.forEach((v: any) => {
                    flat.push({
                        ...v,
                        isVariation: true,
                        parentGroupId: item.id
                    });
                });
            }
        });
        return flat;
    };

    let filtered = processedExercises.filter(ex => {
        if (ex.isGroup) {
            const matchesGroupName = normalizeSearch(ex.name).includes(normalizedQuery);
            const matchesVariationName = ex.variations.some((v: any) => normalizeSearch(v.name).includes(normalizedQuery));
            return matchesGroupName || matchesVariationName;
        }
        return normalizeSearch(ex.name).includes(normalizedQuery);
    });
    
    if (selectedCategories.size > 0) {
        filtered = filtered.filter(ex => 
            (ex.muscle_groups || []).some((m: string) => selectedCategories.has(m)) || 
            selectedCategories.has(ex.group)
        );
    }
    
    const result: { title: string, data: any[] }[] = [];
    
    // 1. Custom Exercises
    const custom = filtered.filter(ex => !ex.isGroup && !DefaultExercises.some(d => d.id === ex.id));
    if (custom.length > 0) {
        result.push({ title: 'Custom Exercises', data: flattenData(custom) });
    }

    // 2. Default Exercises & Groups sorted by dynamic Muscle Group
    const defaultFiltered = filtered.filter(ex => ex.isGroup || DefaultExercises.some(d => d.id === ex.id));
    const muscleGroupMap = new Map<string, any[]>();
    defaultFiltered.forEach(ex => {
        const primary = ex.muscle_groups && ex.muscle_groups.length > 0 ? ex.muscle_groups[0] : "Other";
        if (!muscleGroupMap.has(primary)) muscleGroupMap.set(primary, []);
        muscleGroupMap.get(primary)!.push(ex);
    });

    const sortedMuscleGroups = Array.from(muscleGroupMap.keys()).sort((a, b) => {
        if (a === "Other") return 1;
        if (b === "Other") return -1;
        return a.localeCompare(b);
    });

    sortedMuscleGroups.forEach(mg => {
        result.push({ title: mg, data: flattenData(muscleGroupMap.get(mg)!) });
    });
    
    return result;
  }, [processedExercises, searchQuery, selectedCategories, expandedGroups, mode]);

  if (detailsExercise) {
      return (
          <ExerciseDetailsScreen
              exercise={detailsExercise}
              mode={mode}
              onSelect={(selectedEx) => {
                  if (onSelect) onSelect([selectedEx]);
                  setSelectedIds(new Set());
                  setDetailsExercise(null);
                  if (onClose) onClose();
              }}
              onBack={() => setDetailsExercise(null)}
          />
      );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View className="flex-1 bg-light dark:bg-dark">
        {isFilterVisible && (
          <Pressable 
            testID="filter-backdrop"
            className="absolute inset-0 bg-black/20 dark:bg-black/40 z-40" 
            onPress={() => setIsFilterVisible(false)}
          />
        )}
        {mode === 'select' ? (
            <ScreenHeader
                title="Add Exercise"
                leftAction={<BackButton onPress={onClose} />}
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
        ) : (
            <TopNavBanner />
        )}

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
            keyboardShouldPersistTaps="never"
            keyboardDismissMode="on-drag"
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
            
            if (item.isGroup) {
                const isExpanded = expandedGroups.has(item.id);
                return (
                    <TouchableOpacity 
                        className="flex-row items-center justify-between py-4 pr-6 bg-light dark:bg-dark"
                        style={{ paddingLeft: 24 }}
                        onPress={() => {
                            if (mode === 'select') {
                                toggleGroupExpanded(item.id);
                            } else {
                                router.push({
                                    pathname: '/exercises/details',
                                    params: { exercise: JSON.stringify(item.representative) }
                                });
                            }
                        }}
                    >
                        <View className="flex-1 mr-4">
                            <Text className="text-base leading-6 font-bold text-light dark:text-dark">{item.name}</Text>
                            <Text className="text-xs text-light-muted dark:text-dark-muted mt-0.5">{item.subtitle}</Text>
                        </View>
                        <IconSymbol name={isExpanded ? "chevron.down" : "chevron.right"} size={16} color={theme.textMuted || '#888'} />
                    </TouchableOpacity>
                );
            }

            return (
            <TouchableOpacity 
                className="flex-row items-center justify-between py-4 pr-6 bg-light dark:bg-dark"
                style={{ paddingLeft: item.isVariation ? 48 : 24 }}
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
                    <View className="flex-row items-center mt-0.5">
                        <Text className="text-xs text-light-muted dark:text-dark-muted">
                            {item.muscle_groups?.join(', ')}
                        </Text>
                        {item.difficulty !== undefined && item.properties?.includes('Bodyweight') && (
                            <View className="flex-row items-center ml-2">
                                {Array.from({ length: 10 }).map((_, i) => {
                                    const difficulty = item.difficulty || 0;
                                    const starValue = i + 1;
                                    let iconName = "star";
                                    if (difficulty >= starValue) {
                                        iconName = "star.fill";
                                    } else if (difficulty >= starValue - 0.5) {
                                        iconName = "star.leadinghalf.filled";
                                    }
                                    
                                    return (
                                        <IconSymbol 
                                            key={i}
                                            name={iconName as any} 
                                            size={9} 
                                            color={theme.primary} 
                                            style={{ marginRight: 0.5 }}
                                        />
                                    );
                                })}
                            </View>
                        )}
                    </View>
                </View>
                {mode === 'select' ? (
                    <TouchableOpacity 
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        onPress={() => {
                            setDetailsExercise(item);
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
            className={`absolute left-0 right-0 z-[1000] px-4 pb-8 pt-4 bg-transparent shadow-lg justify-end ${mode === 'select' ? 'bottom-10' : 'bottom-24'}`}
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
            {mode === 'browse' && (
                <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => router.push('/exercises/create')}
                    className="w-12 h-12 rounded-full items-center justify-center border border-white/10 dark:border-highlight-dark shadow-xl bg-lighter dark:bg-dark-lighter"
                >
                    <IconSymbol
                        name="square.and.pencil"
                        size={20}
                        color={theme.icon || theme.textMuted || '#888'}
                    />
                </TouchableOpacity>
            )}
            <View className="flex-1 flex-row items-center rounded-full px-4 h-12 border border-white/10 dark:border-highlight-dark shadow-xl bg-lighter dark:bg-dark-lighter">
                <IconSymbol name="magnifyingglass" size={20} color={theme.placeholder || theme.textMuted || '#888'} />
                <TextInput
                    ref={searchInputRef}
                    className="flex-1 ml-2 text-[16px] text-light dark:text-dark"
                    placeholder="Search exercises..."
                    placeholderTextColor={theme.textMuted}
                    onChangeText={setInputText}
                    autoCorrect={false}
                />
                <View className="w-6 items-center justify-center">
                    {inputText.length > 0 && (
                        <TouchableOpacity onPress={() => {
                            setInputText('');
                            searchInputRef.current?.clear();
                        }}>
                            <IconSymbol name="xmark.circle.fill" size={20} color={theme.placeholder || theme.textMuted || '#888'} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
            <TouchableOpacity 
                activeOpacity={0.7}
                onPress={() => {
                    Keyboard.dismiss();
                    setIsFilterVisible(!isFilterVisible);
                }}
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

      {mode === 'browse' && (
        <>
          <BottomActionBar>
            <DashboardButton dimmed={menuVisible} />
            <BottomNavButton
                icon="dumbbell.fill"
                label="Exercises"
                active
                onPress={() => router.navigate('/(tabs)/exercises' as any)}
            />
            <BottomNavButton
                icon="line.3.horizontal"
                label="Menu"
                active={menuVisible}
                boldWhenActive={false}
                onPress={() => setMenuVisible(!menuVisible)}
            />
          </BottomActionBar>

          <BurgerMenu
            visible={menuVisible}
            onClose={() => setMenuVisible(false)}
          />
        </>
      )}

      {isKeyboardVisible && (
          <Pressable
              className="absolute inset-0 z-[999]"
              onPress={() => Keyboard.dismiss()}
          />
      )}
    </View>
    </TouchableWithoutFeedback>
  );
}
