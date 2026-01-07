import React, { useEffect, useState } from 'react';
import { FlatList, TouchableOpacity, View, TextInput, Alert, Text } from 'react-native'; 
import { useRouter, useLocalSearchParams } from 'expo-router';

import { useUITheme, RaisedCard, HollowedCard, Skeleton, useToast, IconSymbol } from '@mysuite/ui';
import { useAuth } from '@mysuite/auth';
import { fetchExercises } from '../../providers/WorkoutManagerProvider';
import { useActiveWorkout } from '../../providers/ActiveWorkoutProvider';

import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { BackButton } from '../../components/ui/BackButton';

export default function ExercisesScreen() {
  const router = useRouter();
  const { mode } = useLocalSearchParams();
  const theme = useUITheme();

  const { user } = useAuth();
  const [exercises, setExercises] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();
  const { addExercise, hasActiveSession } = useActiveWorkout();

  const handleAddExercise = (exercise: any) => {
      if (!hasActiveSession) {
          Alert.alert("No Active Workout", "Please start a workout first.");
          return;
      }
      addExercise(exercise.name, "3", "10", exercise.properties);
      router.back();
  };

  useEffect(() => {
    let isMounted = true; // For cleanup to prevent state updates on unmounted component
    async function load() {
        // if (!user) { ... } <- Removed to allow guest loading
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
  }, [user, showToast]);

  return (
    <View className="flex-1 bg-light dark:bg-dark">
      <ScreenHeader
        title="Exercises"
        leftAction={<BackButton />}
        rightAction={
            <RaisedCard 
                onPress={() => router.push('/exercises/create')}
                style={{ borderRadius: 9999 }}
                className="w-10 h-10 p-0 my-0 rounded-full items-center justify-center"
            >
                <IconSymbol 
                    name="square.and.pencil" 
                    size={20} 
                    color={theme.primary} 
                />
            </RaisedCard>
        }
      />
      
      <View className="mt-28 px-4 py-3">
        <View className="flex-row items-center bg-light dark:bg-dark rounded-full px-4 h-10 border border-light-darker dark:border-highlight-dark">
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
             {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <View key={i} className="flex-row items-center justify-between py-4 border-b border-light-darker/10 dark:border-highlight-dark/10">
                    <View className="flex-1">
                        <Skeleton height={20} width="60%" className="mb-2" />
                        <Skeleton height={14} width="40%" />
                    </View>
                </View>
             ))}
        </View>
      ) : (
      <FlatList
        data={exercises.filter(ex => ex.name.toLowerCase().includes(searchQuery.toLowerCase()))}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            className="flex-row items-center justify-between p-4"
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
            {hasActiveSession && mode === 'add' && (
              <RaisedCard 
                onPress={(e) => {
                  e.stopPropagation(); // Prevent navigation
                  handleAddExercise(item);
                }}
                className="w-10 h-10 p-0 rounded-full bg-light-lighter dark:bg-dark-lighter items-center justify-center"
                style={{ borderRadius: 9999 }}
              >
                  <IconSymbol name="plus" size={24} color={theme.primary} />
              </RaisedCard>
            )}
          </TouchableOpacity>
        )}
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120 }}
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
