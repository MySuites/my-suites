import React from 'react';
import { FlatList, TouchableOpacity, View, Alert, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useUITheme, RaisedButton, RaisedCard, HollowedCard, Skeleton } from '@mysuite/ui';
import { IconSymbol } from '../../components/ui/icon-symbol';
import { useWorkoutManager } from '../../hooks/workouts/useWorkoutManager';
import { useActiveWorkout } from '../../providers/ActiveWorkoutProvider';
import { useFloatingButton } from '../../providers/FloatingButtonContext';

import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { BackButton } from '../../components/ui/BackButton';

export default function RoutinesScreen() {
  const router = useRouter();
  
  const { routines, startActiveRoutine, isLoading } = useWorkoutManager();
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



  return (
    <View className="flex-1 bg-light dark:bg-dark">
      <ScreenHeader
        title="My Routines"
        leftAction={<BackButton />}
        rightAction={
            <RaisedButton 
                onPress={() => router.push('/routines/editor')}
                borderRadius={20}
                className="w-10 h-10 p-0 my-0 rounded-full items-center justify-center"
            >
                <IconSymbol 
                    name="square.and.pencil" 
                    size={20} 
                    color={theme.primary} 
                />
            </RaisedButton>
        }
      />
      
      {isLoading ? (
          <View className="flex-1 px-4 mt-28">
              {[1, 2, 3, 4, 5].map((i) => (
                  <RaisedCard key={i} className="flex-row items-center justify-between p-4 mb-3">
                      <View className="flex-1">
                          <Skeleton height={20} width="60%" className="mb-2" />
                          <Skeleton height={14} width="35%" />
                      </View>
                      <View className="w-20 h-8 rounded-md bg-light-darker/10 dark:bg-highlight-dark/10" />
                  </RaisedCard>
              ))}
          </View>
      ) : routines.length === 0 ? (
          <View className="flex-1 p-4 mt-28">
              <HollowedCard className="p-8 w-full">
                  <Text className="text-base text-center leading-6 text-light-muted dark:text-dark-muted">
                      No saved routines found. Create one to organize your workouts!
                  </Text>
              </HollowedCard>
          </View>
      ) : (
          <FlatList
            data={routines}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (

              <TouchableOpacity onPress={() => {
                  router.push({
                      pathname: '/routines/editor',
                      params: { id: item.id }
                  });
              }} activeOpacity={0.7}>
              <RaisedCard className="flex-row items-center justify-between p-4 mb-3">
                <View className="flex-1">
                    <Text className="text-base leading-6 font-semibold text-light dark:text-dark">{item.name}</Text>
                    <Text className="text-xs text-light-muted dark:text-dark-muted">
                        {item.sequence?.length || 0} Days
                    </Text> 
                </View>
                <View className="flex-row gap-2">
                    <RaisedButton 
                        title="Set Active"
                        onPress={(e) => {
                            e.stopPropagation();
                            handleSetRoutine(item.id, item.name, item.sequence);
                        }} 
                        className="px-3 h-8 my-0"
                        textClassName="text-primary dark:text-primary-dark text-sm font-semibold"
                    />

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
