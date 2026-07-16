import React, { useState } from 'react';
import { Text, View, FlatList } from 'react-native';
import { Stack, useRouter } from 'expo-router';

import { useWorkoutManager } from '../../providers/WorkoutManagerProvider';
import { ActionCard, HollowedCard, Skeleton } from '@mysuite/ui';
import { TopNavBanner } from '../../components/ui/TopNavBanner';
import { BottomActionBar } from '../../components/ui/BottomNavBar';
import { DashboardButton } from '../../components/ui/DashboardButton';
import { BottomNavButton } from '../../components/ui/BottomNavButton';
import { BurgerMenu } from '../../components/ui/BurgerMenu';

const WorkoutHistoryItem = ({ item, onDelete, onPress }: { item: any, onDelete: () => void, onPress: () => void }) => {
    return (
        <ActionCard
            onPress={onPress}
            onDelete={onDelete}
            activeOpacity={0.7}
            className="mb-3"
        >
            <View className="flex-row justify-between mb-2">
            <Text className="text-lg font-semibold text-light dark:text-dark">{item.workoutName || 'Untitled Workout'}</Text>
            <Text className="text-sm text-gray-500 dark:text-gray-400">
                {new Date(item.workoutDate).toLocaleDateString()}
            </Text>
            </View>
            <View className="flex-col gap-1">
                {item.notes && (
                    <Text className="text-sm text-light-muted dark:text-dark-muted" numberOfLines={1}>
                        {item.notes}
                    </Text>
                )}
                {item.exercises && item.exercises.length > 0 && (
                    <Text className="text-sm text-light-muted dark:text-dark-muted" numberOfLines={2}>
                        {item.exercises.map((ex: any) => ex.name).join(', ')}
                    </Text>
                )}
            </View>
            <View className="mt-2 items-end">
                <Text className="text-xs text-primary dark:text-primary-dark font-medium">Tap for details</Text>
            </View>
        </ActionCard>
    );
};

export default function WorkoutHistoryScreen() {
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);
  const { workoutHistory, deleteWorkoutLog, isLoading } = useWorkoutManager();

  return (
    <View className="flex-1 bg-light dark:bg-dark">
      <Stack.Screen options={{ headerShown: false, animation: 'none' }} />

      {isLoading ? (
        <View className="flex-1 px-4" style={{ paddingTop: 130 }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <ActionCard key={i} className="mb-3">
              <View className="flex-row justify-between mb-2">
                <Skeleton height={20} width="60%" />
                <Skeleton height={14} width="20%" />
              </View>
              <Skeleton height={14} width="40%" />
              <View className="mt-2 items-end">
                <Skeleton height={12} width="25%" />
              </View>
            </ActionCard>
          ))}
        </View>
      ) : (
      <FlatList
        data={workoutHistory}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingTop: 130, padding: 16, paddingBottom: 100 }}
        renderItem={({ item }) => (
            <WorkoutHistoryItem
                item={item}
                onDelete={() => deleteWorkoutLog(item.id, { skipConfirmation: true })}
                onPress={() => router.push({
                    pathname: '/workouts/details' as any,
                    params: { logId: item.id }
                })}
            />
        )}
        ListEmptyComponent={
          <View className="p-4 items-center">
            <HollowedCard className="p-8 w-full">
              <Text className="text-light-muted dark:text-dark-muted text-base text-center">
                There are currently no past workouts, start and finish a workout first.
              </Text>
            </HollowedCard>
          </View>
        }
      />
      )}

      <TopNavBanner />
      <BottomActionBar>
        <DashboardButton dimmed={menuVisible} />
        <BottomNavButton
            icon="dumbbell.fill"
            label="Exercises"
            onPress={() => router.navigate('/(tabs)/exercises' as any)}
        />
        <BottomNavButton
            icon="clock.fill"
            label="History"
            active
            onPress={() => router.navigate('/(tabs)/history' as any)}
        />
        <BottomNavButton
            icon="line.3.horizontal"
            label="Menu"
            active={menuVisible}
            boldWhenActive={false}
            onPress={() => setMenuVisible(!menuVisible)}
        />
      </BottomActionBar>

      <BurgerMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
      />
    </View>
  );
}
