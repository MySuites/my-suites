import React from 'react';
import { FlatList, TouchableOpacity, View, Alert, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useUITheme, RaisedCard, HollowedCard, Skeleton, IconSymbol } from '@mysuite/ui';
import { useWorkoutManager } from '../../providers/WorkoutManagerProvider';
import { useActiveWorkout } from '../../providers/ActiveWorkoutProvider';
import { useFloatingButton } from '../../providers/FloatingButtonContext';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { BackButton } from '../../components/ui/BackButton';

export default function SavedWorkoutsScreen() {
  const router = useRouter();
  const theme = useUITheme();
  
  const { savedWorkouts, isLoading } = useWorkoutManager();
  const { hasActiveSession, startWorkout } = useActiveWorkout();
  
  // Hide floating buttons
  const { setIsHidden } = useFloatingButton();
  React.useEffect(() => {
      setIsHidden(true);
      return () => setIsHidden(false);
  }, [setIsHidden]);

  const handleStart = (id: string, name: string, workoutExercises: any[]) => {
      if (hasActiveSession) {
          Alert.alert("Active Session", "Please finish or cancel your current workout before starting a new one.");
          return;
      }
      startWorkout(workoutExercises || [], name, undefined, id);
      router.back();
  };



  return (
    <View className="flex-1 bg-light dark:bg-dark">
      <ScreenHeader
        title="Saved Workouts"
        leftAction={<BackButton />}
        rightAction={
            <RaisedCard 
                onPress={() => router.push('/workouts/editor')}
                style={{ borderRadius: 9999 }}
                className="w-12 h-12 p-0 my-0 rounded-full items-center justify-center"
            >
                <IconSymbol 
                    name="square.and.pencil" 
                    size={24} 
                    color={theme.primary} 
                />
            </RaisedCard>
        }
      />
      
      {isLoading ? (
          <View className="mt-28 flex-1 px-4">
              {[1, 2, 3, 4, 5].map((i) => (
                  <RaisedCard key={i} className="flex-row items-center justify-between p-4 mb-3">
                      <View className="flex-1">
                          <Skeleton height={20} width="60%" className="mb-2" />
                          <Skeleton height={14} width="30%" />
                      </View>
                      <View className="w-10 h-10 rounded-full bg-light-darker/10 dark:bg-highlight-dark/10" />
                  </RaisedCard>
              ))}
          </View>
      ) : savedWorkouts.length === 0 ? (
          <View className="mt-28 flex-1 p-4">
              <HollowedCard className="p-8 w-full">
                  <Text className="text-base text-center leading-6 text-light-muted dark:text-dark-muted">
                      No saved workouts found. Create one to get started!
                  </Text>
              </HollowedCard>
          </View>
      ) : (
          <FlatList
            data={savedWorkouts}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => {
                  router.push({
                      pathname: '/workouts/editor',
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
                    <RaisedCard 
                        onPress={(e) => {
                            e.stopPropagation();
                            handleStart(item.id, item.name, item.exercises);
                        }}
                        style={{ borderRadius: 9999 }}
                        className="w-10 h-10 p-0 my-0 rounded-full items-center justify-center"
                    >
                        <IconSymbol 
                            name="play.fill" 
                            size={20} 
                            color={theme.primary} 
                        />
                    </RaisedCard>

                </View>
              </RaisedCard>
              </TouchableOpacity>
            )}
            className="flex-1"
            contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 16, paddingTop: 124 }}
          />
      )}
    </View>
  );
}


