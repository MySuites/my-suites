import React from 'react';
import { FlatList, TouchableOpacity, View, Alert, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useUITheme, RaisedButton, RaisedCard } from '@mysuite/ui';
import { useWorkoutManager } from '../../hooks/workouts/useWorkoutManager';
import { useActiveWorkout } from '../../providers/ActiveWorkoutProvider';
import { useFloatingButton } from '../../providers/FloatingButtonContext';

import { IconSymbol } from '../../components/ui/icon-symbol';
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
        withBackButton={true}
        rightAction={
            <RaisedButton 
                onPress={() => router.push('/workouts/create')}
                borderRadius={20}
                className="w-10 h-10 p-0 my-0 rounded-full items-center justify-center mr-2"
            >
                <IconSymbol 
                    name="plus" 
                    size={20} 
                    color={theme.primary} 
                />
            </RaisedButton>
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
              <TouchableOpacity onPress={() => {
                  router.push({
                      pathname: '/workouts/create',
                      params: { id: item.id }
                  });
              }} activeOpacity={0.7}>
              <RaisedCard className="flex-row items-center justify-between p-4 mb-3">
                <View className="flex-1">
                    <Text className="text-base leading-6 font-semibold text-light dark:text-dark">{item.name}</Text>
                    <Text className="text-xs text-light-muted dark:text-dark-muted">
                        {new Date(item.createdAt).toLocaleDateString()}
                    </Text> 
                </View>
                <View className="flex-row gap-2">
                    <TouchableOpacity 
                        onPress={(e) => {
                            e.stopPropagation();
                            handleLoad(item.id, item.name, item.exercises);
                        }} 
                        className="py-1.5 px-3 rounded-md bg-primary dark:bg-primary-dark"
                    >
                        <Text className="text-white text-sm font-semibold">Load</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        onPress={(e) => {
                            e.stopPropagation();
                            handleDelete(item.id, item.name);
                        }} 
                        className="py-1.5 px-3 rounded-md border border-light-darker dark:border-highlight-dark"
                    >
                        <Text className="text-sm text-light dark:text-dark">Delete</Text>
                    </TouchableOpacity>
                </View>
              </RaisedCard>
              </TouchableOpacity>
            )}
            className="flex-1"
            contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 16, paddingTop: 16 }}
          />
      )}
    </View>
  );
}


