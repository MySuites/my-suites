import React, { useEffect, useState } from 'react';
import { FlatList, TouchableOpacity, View, ActivityIndicator, TextInput } from 'react-native'; 
import { useRouter } from 'expo-router';
import { useActiveWorkout } from '../providers/ActiveWorkoutProvider';
import { ThemedText } from '../components/ui/ThemedText';
import { ThemedView } from '../components/ui/ThemedView';
import { useUITheme } from '@mycsuite/ui';
import { useAuth } from '@mycsuite/auth';
import { fetchExercises } from '../hooks/useWorkoutManager';
import { IconSymbol } from '../components/ui/icon-symbol';

export default function ExercisesScreen() {
  const router = useRouter();
  const theme = useUITheme();
  const { addExercise } = useActiveWorkout();
  const { user } = useAuth();
  const [exercises, setExercises] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
        if (!user) {
            setLoading(false);
            return;
        }
        const { data } = await fetchExercises(user);
        setExercises(data || []);
        setLoading(false);
    }
    load();
  }, [user]);

  return (
    <ThemedView className="flex-1">
      <ThemedView className="flex-row items-center justify-between p-4 border-b border-surface dark:border-white/10">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
           <ThemedText type="link">Close</ThemedText>
        </TouchableOpacity>
        <ThemedText type="subtitle">Exercises</ThemedText>
        <TouchableOpacity onPress={() => router.push('/create-exercise')} className="p-2">
            <ThemedText type="link">Create</ThemedText>
        </TouchableOpacity> 
      </ThemedView>
      
      <View className="px-4 py-3 border-b border-surface dark:border-white/10">
        <View className="flex-row items-center bg-surface dark:bg-surface_dark rounded-lg px-2.5 h-10">
            <IconSymbol name="magnifyingglass" size={20} color={theme.icon || '#888'} />
             <TextInput
                className="flex-1 ml-2 text-base h-full text-apptext dark:text-apptext_dark"
                placeholder="Search exercises..."
                placeholderTextColor={theme.icon || '#888'}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCorrect={false}
            />
            {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                     <IconSymbol name="xmark.circle.fill" size={20} color={theme.icon || '#888'} />
                </TouchableOpacity>
            )}
        </View>
      </View>
      
      {loading ? (
        <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
      <FlatList
        data={exercises.filter(ex => ex.name.toLowerCase().includes(searchQuery.toLowerCase()))}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            className="flex-row items-center justify-between p-4 border-b border-surface dark:border-white/10"
            onPress={() => {
                addExercise(item.name, "3", "10", item.rawType); // Default sets/reps for now
                router.back();
            }}
          >
            <View>
                <ThemedText type="defaultSemiBold">{item.name}</ThemedText>
                <ThemedText style={{color: theme.icon ?? '#888', fontSize: 12}}>
                    {item.category} • {item.type || item.rawType}
                </ThemedText> 
            </View>
            <IconSymbol name="plus.circle" size={20} color={theme.primary} />
          </TouchableOpacity>
        )}
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120 }}
        ListEmptyComponent={
            <View className="p-5 items-center">
                <ThemedText style={{color: theme.icon}}>No exercises found.</ThemedText>
            </View>
        }
        showsVerticalScrollIndicator={false}
      />
      )}
    </ThemedView>
  );
}
