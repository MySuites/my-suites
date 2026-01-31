import React, { useState, useCallback } from 'react';
import { SectionList, TouchableOpacity, View, TextInput, Text } from 'react-native'; 
import { useRouter, useFocusEffect } from 'expo-router';

import { useUITheme, RaisedCard, HollowedCard, Skeleton, useToast, IconSymbol } from '@mysuite/ui';
import { useAuth } from '@mysuite/auth';
import { fetchExercises } from '../../providers/WorkoutManagerProvider';
import DefaultExercises from '../../assets/data/default-exercises.json';

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

  const sections = React.useMemo(() => {
    const filtered = exercises.filter(ex => ex.name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const custom = filtered.filter(ex => !DefaultExercises.some(d => d.id === ex.id));
    const defaults = filtered.filter(ex => DefaultExercises.some(d => d.id === ex.id));
    
    const result = [];
    if (custom.length > 0) {
        result.push({ title: 'Custom Exercises', data: custom });
    }
    if (defaults.length > 0) {
        result.push({ title: 'Default Exercises', data: defaults });
    }
    
    // If searching and everything matches one, show it. 
    // If no custom but searching, maybe show empty custom? No, standard behavior is hide section.
    return result;
  }, [exercises, searchQuery]);

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
      
      <View className="mt-28 px-4 py-3">
        <View className="flex-row items-center bg-light dark:bg-dark-lighter rounded-full px-4 h-10 border border-light-darker dark:border-highlight-dark">
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
