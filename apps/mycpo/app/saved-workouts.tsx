import React from 'react';
import { FlatList, TouchableOpacity, View, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '../components/ui/ThemedText';
import { ThemedView } from '../components/ui/ThemedView';
import { useUITheme } from '@mycsuite/ui';
import { useWorkoutManager } from '../hooks/useWorkoutManager';
import { useActiveWorkout } from '../providers/ActiveWorkoutProvider';

export default function SavedWorkoutsScreen() {
  const router = useRouter();
  const theme = useUITheme();
  
  const { savedWorkouts, deleteSavedWorkout } = useWorkoutManager();
  const { hasActiveSession, setExercises } = useActiveWorkout();

  const handleLoad = (id: string, name: string, workoutExercises: any[]) => {
      if (hasActiveSession) {
          Alert.alert("Active Session", "Please finish or cancel your current workout before loading a new one.");
          return;
      }
      setExercises(workoutExercises || []);
      Alert.alert('Loaded', `Workout '${name}' loaded.`);
      router.back();
  };

  const handleDelete = (id: string, name: string) => {
      Alert.alert(
          "Delete Workout",
          `Are you sure you want to delete '${name}'?`,
          [
              { text: "Cancel", style: "cancel" },
              { 
                  text: "Delete", 
                  style: "destructive", 
                  onPress: () => deleteSavedWorkout(id) 
              }
          ]
      );
  };

  return (
    <ThemedView className="flex-1">
      <ThemedView className="flex-row items-center justify-between p-4 border-b border-surface dark:border-white/10">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
           <ThemedText type="link">Close</ThemedText>
        </TouchableOpacity>
        <ThemedText type="subtitle">Saved Workouts</ThemedText>
        <TouchableOpacity onPress={() => router.push('/create-workout')} className="p-2">
           <ThemedText type="link">Create</ThemedText>
        </TouchableOpacity>
      </ThemedView>
      
      {savedWorkouts.length === 0 ? (
          <View className="flex-1 items-center justify-center p-8">
              <ThemedText style={{color: theme.icon}}>No saved workouts found.</ThemedText>
          </View>
      ) : (
          <FlatList
            data={savedWorkouts}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View className="flex-row items-center justify-between p-4 border-b border-surface dark:border-white/10">
                <View className="flex-1">
                    <ThemedText type="defaultSemiBold">{item.name}</ThemedText>
                    <ThemedText style={{color: theme.icon ?? '#888', fontSize: 12}}>
                        {new Date(item.createdAt).toLocaleDateString()}
                    </ThemedText> 
                </View>
                <View className="flex-row gap-2">
                    <TouchableOpacity 
                        onPress={() => handleLoad(item.id, item.name, item.exercises)} 
                        className="py-1.5 px-3 rounded-md bg-primary dark:bg-primary_dark"
                    >
                        <ThemedText className="text-white text-sm font-semibold">Load</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        onPress={() => handleDelete(item.id, item.name)} 
                        className="py-1.5 px-3 rounded-md border border-surface dark:border-white/10"
                    >
                        <ThemedText className="text-sm">Delete</ThemedText>
                    </TouchableOpacity>
                </View>
              </View>
            )}
            className="flex-1"
            contentContainerStyle={{ paddingBottom: 120 }}
          />
      )}
    </ThemedView>
  );
}
