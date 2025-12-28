import React from 'react';
import { FlatList, TouchableOpacity, View, Alert, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useUITheme, RaisedButton, RaisedCard } from '@mysuite/ui';
import { IconSymbol } from '../../components/ui/icon-symbol';
import { useWorkoutManager } from '../../hooks/workouts/useWorkoutManager';
import { useActiveWorkout } from '../../providers/ActiveWorkoutProvider';
import { useFloatingButton } from '../../providers/FloatingButtonContext';

import { ScreenHeader } from '../../components/ui/ScreenHeader';

export default function RoutinesScreen() {
  const router = useRouter();
  
  const { routines, deleteRoutine, startActiveRoutine } = useWorkoutManager();
  const { hasActiveSession, setExercises } = useActiveWorkout();
  const theme = useUITheme();

    // Hide floating buttons
    const { setIsHidden } = useFloatingButton();
    React.useEffect(() => {
        setIsHidden(true);
        return () => setIsHidden(false);
    }, [setIsHidden]);

  const handleSetRoutine = (id: string, name: string, sequence: any[]) => {
      if (hasActiveSession) {
          Alert.alert("Active Session", "Please finish or cancel your current workout before setting a new routine.");
          return;
      }
      
      startActiveRoutine(id);
      
      // Load day 1 if available
      if (sequence && sequence.length > 0) {
          const first = sequence[0];
          if (first.type === 'workout' && first.workout) {
              setExercises(first.workout.exercises || []);
          }
      }
      
      router.back();
  };

  const handleDelete = (id: string, name: string) => {
      Alert.alert(
          "Delete Routine",
          `Are you sure you want to delete '${name}'?`,
          [
              { text: "Cancel", style: "cancel" },
              { 
                  text: "Delete", 
                  style: "destructive", 
                  onPress: () => deleteRoutine(id) 
              }
          ]
      );
  };

  return (
    <View className="flex-1 bg-light dark:bg-dark">
      <ScreenHeader
        title="My Routines"
        withBackButton={true}
        rightAction={
            <RaisedButton 
                onPress={() => router.push('/routines/create')}
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
      
      {routines.length === 0 ? (
          <View className="flex-1 items-center justify-center p-8">
              <Text className="text-base leading-6 text-light-muted dark:text-dark-muted">No saved routines found.</Text>
          </View>
      ) : (
          <FlatList
            data={routines}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (

              <TouchableOpacity onPress={() => {
                  router.push({
                      pathname: '/routines/details',
                      params: { routine: JSON.stringify(item) }
                  });
              }} activeOpacity={0.7}>
              <RaisedCard className="flex-row items-center justify-between p-4 mb-3">
                <View className="flex-1">
                    <Text className="text-base leading-6 font-semibold text-light dark:text-dark">{item.name}</Text>
                    <Text className="text-xs text-light-muted dark:text-dark-muted">
                        {new Date(item.createdAt).toLocaleDateString()} • {item.sequence?.length || 0} Days
                    </Text> 
                </View>
                <View className="flex-row gap-2">
                    <TouchableOpacity 
                        onPress={(e) => {
                            e.stopPropagation();
                            handleSetRoutine(item.id, item.name, item.sequence);
                        }} 
                        className="py-1.5 px-3 rounded-md bg-primary dark:bg-primary-dark"
                    >
                        <Text className="text-white text-sm font-semibold">Set Active</Text>
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
