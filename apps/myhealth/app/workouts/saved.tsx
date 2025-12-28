import React from 'react';
import { FlatList, TouchableOpacity, View, Alert, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useUITheme } from '@mysuite/ui';
import { useWorkoutManager } from '../../hooks/workouts/useWorkoutManager';
import { useActiveWorkout } from '../../providers/ActiveWorkoutProvider';
import { useFloatingButton } from '../../providers/FloatingButtonContext';

import { ScreenHeader } from '../../components/ui/ScreenHeader';

export default function SavedWorkoutsScreen() {
  const router = useRouter();
  const theme = useUITheme();
  
  const { savedWorkouts, deleteSavedWorkout } = useWorkoutManager();
  const { hasActiveSession, setExercises } = useActiveWorkout();
  
  // Hide floating buttons
  const { setIsHidden } = useFloatingButton();
  React.useEffect(() => {
      setIsHidden(true);
      return () => setIsHidden(false);
  }, [setIsHidden]);

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
    <View className="flex-1 bg-light dark:bg-dark">
      <ScreenHeader
        title="Saved Workouts"
        leftAction={
            <TouchableOpacity onPress={() => router.back()} className="p-2">
                <Text className="text-base font-semibold text-primary dark:text-primary-dark">Close</Text>
            </TouchableOpacity>
        }
        rightAction={
            <TouchableOpacity onPress={() => router.push('/workouts/create')} className="p-2">
                <Text className="text-base font-semibold text-primary dark:text-primary-dark">Create</Text>
            </TouchableOpacity>
        }
      />
      
      {savedWorkouts.length === 0 ? (
          <View className="flex-1 items-center justify-center p-8">
              <Text className="text-base leading-6 text-light-muted dark:text-dark-muted">No saved workouts found.</Text>
          </View>
      ) : (
          <FlatList
            data={savedWorkouts}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View className="flex-row items-center justify-between p-4 border-b border-light-darker dark:border-highlight-dark">
                <View className="flex-1">
                    <Text className="text-base leading-6 font-semibold text-light dark:text-dark">{item.name}</Text>
                    <Text className="text-xs text-light-muted dark:text-dark-muted">
                        {new Date(item.createdAt).toLocaleDateString()}
                    </Text> 
                </View>
                <View className="flex-row gap-2">
                    <TouchableOpacity 
                        onPress={() => handleLoad(item.id, item.name, item.exercises)} 
                        className="py-1.5 px-3 rounded-md bg-primary dark:bg-primary-dark"
                    >
                        <Text className="text-white text-sm font-semibold">Load</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        onPress={() => handleDelete(item.id, item.name)} 
                        className="py-1.5 px-3 rounded-md border border-light-darker dark:border-highlight-dark"
                    >
                        <Text className="text-sm text-light dark:text-dark">Delete</Text>
                    </TouchableOpacity>
                </View>
              </View>
            )}
            className="flex-1"
            contentContainerStyle={{ paddingBottom: 120 }}
          />
      )}
    </View>
  );
}
