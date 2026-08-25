import React, { useState, useCallback } from 'react';
import { SectionList, TouchableOpacity, View, TextInput, Text, ScrollView, KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback, Pressable } from 'react-native'; 
import { useRouter, useFocusEffect } from 'expo-router';

import { useUITheme, RaisedCard, HollowedCard, Skeleton, useToast, IconSymbol } from '@mysuite/ui';
import { useAuth } from '@mysuite/auth';
import { fetchExercises } from '../../providers/WorkoutManagerProvider';
import { groupExercisesForDisplay } from '../../assets/data/default-exercises';
import ExerciseDetailsScreen from '../exercises/details';
import { useExerciseSections } from '../../hooks/exercises/useExerciseSections';

import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { BackButton } from '../../components/ui/BackButton';
import { TopNavBanner } from '../../components/ui/TopNavBanner';
import { BottomActionBar, BottomNavButton, DashboardButton } from '../../components/ui/BottomNavBar';
import { BurgerMenu, useBurgerMenu } from '../../components/ui/BurgerMenu';
import { WORKOUT_MENU_ITEMS } from '../../utils/burgerMenuItems';

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
  const { visible: menuVisible, toggle: toggleMenu, close: closeMenu } = useBurgerMenu();
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
  const processedExercises = React.useMemo(() => groupExercisesForDisplay(exercises), [exercises]);

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

  const sections = useExerciseSections(processedExercises, searchQuery, selectedCategories, expandedGroups, mode);

  if (detailsExercise) {
      return (
          <ExerciseDetailsScreen
              exercise={detailsExercise}
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
                icon="list.bullet.clipboard"
                label="Saved"
                onPress={() => router.navigate('/(tabs)/saved' as any)}
            />
            <BottomNavButton
                icon="line.3.horizontal"
                label="More"
                active={menuVisible}
                boldWhenActive={false}
                onPress={toggleMenu}
            />
          </BottomActionBar>

          <BurgerMenu
            visible={menuVisible}
            onClose={closeMenu}
            items={WORKOUT_MENU_ITEMS}
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
