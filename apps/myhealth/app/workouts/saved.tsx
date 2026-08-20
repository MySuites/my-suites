import React from 'react';
import { View, Alert, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useUITheme, RaisedCard, HollowedCard, Skeleton, IconSymbol } from '@mysuite/ui';
import { useWorkoutManager } from '../../providers/WorkoutManagerProvider';
import { SavedWorkoutItem } from '../../components/workouts/SavedWorkoutItem';
import { useActiveWorkout } from '../../providers/ActiveWorkoutProvider';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { BackButton } from '../../components/ui/BackButton';
import DraggableFlatList, { ScaleDecorator, RenderItemParams } from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

function SavedWorkoutsScreen() {
  const router = useRouter();
  const theme = useUITheme();
  
  const { savedWorkouts, isLoading, deleteSavedWorkout, reorderSavedWorkouts } = useWorkoutManager();
  const { hasActiveSession, startWorkout, finishWorkout, cancelWorkout } = useActiveWorkout();
  const [activeSwipedCardId, setActiveSwipedCardId] = React.useState<string | null>(null);
  

  const handleStart = (id: string, name: string, workoutExercises: any[]) => {
      if (hasActiveSession) {
          Alert.alert(
              "Active Workout",
              "You have an active workout. What would you like to do?",
              [
                  { text: "Cancel", style: "cancel" },
                  { text: "Stop Current", onPress: () => { finishWorkout(); router.back(); } },
                  { 
                      text: "Replace", 
                      style: "destructive", 
                      onPress: () => {
                          cancelWorkout();
                          setTimeout(() => startWorkout(workoutExercises || [], name, id), 100);
                          router.back();
                      }
                  }
              ]
          );
      } else {
          startWorkout(workoutExercises || [], name, id);
          router.back();
      }
  };



  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View className="flex-1 bg-light dark:bg-dark">
        <ScreenHeader
          title="Saved Workouts"
          leftAction={<BackButton />}
        rightAction={
            <RaisedCard 
                onPress={() => router.push('/workouts/details')}
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
          <DraggableFlatList
            data={savedWorkouts}
            keyExtractor={(item) => item.id}
            onDragEnd={({ data }) => reorderSavedWorkouts(data)}
            ItemSeparatorComponent={() => <View className="h-3" />}
            renderItem={({ item, drag, isActive }: RenderItemParams<any>) => (
                <ScaleDecorator activeScale={1.05}>
                    <View className={`w-full ${isActive ? 'opacity-80' : ''}`}>
                        <SavedWorkoutItem
                            item={item}
                            onEdit={() => {
                                router.push({
                                    pathname: '/workouts/details',
                                    params: { id: item.id }
                                });
                            }}
                            onStart={() => handleStart(item.id, item.name, item.exercises)}
                            onDelete={() => deleteSavedWorkout(item.id, { skipConfirmation: true })}
                            onDrag={drag}
                            swipeGroupId={item.id}
                            activeSwipeId={activeSwipedCardId}
                            onSwipeStart={setActiveSwipedCardId}
                        />
                    </View>
                </ScaleDecorator>
            )}
            style={{ flex: 1 }}
            containerStyle={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 120, paddingTop: 124 }}
            activationDistance={20}
          />
      )}
      </View>
    </GestureHandlerRootView>
  );
}



export default SavedWorkoutsScreen;
