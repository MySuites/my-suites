import React, { useState, useEffect, useCallback, useMemo } from "react";
import { View, ScrollView, Text, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '@mysuite/auth';
import { useUITheme, useToast } from '@mysuite/ui';

import { BurgerMenu, useBurgerMenu } from '../../components/ui/BurgerMenu';
import { PROFILE_MENU_ITEMS } from '../../utils/burgerMenuItems';
import { BottomActionBar, BottomNavButton, DashboardButton } from '../../components/ui/BottomNavBar';
import { BodyWeightCard } from '../../components/bodyweight/BodyWeightCard';
import { WeightLogModal } from '../../components/bodyweight/WeightLogModal';
import { useWorkoutManager, WorkoutLog } from '../../providers/WorkoutManagerProvider';
import { VolumeTrendCard } from '../../components/workouts/VolumeTrendCard';
import { MuscleHeatmap } from '../../components/dashboard/MuscleHeatmap';
import { WeeklyCompletionRing } from '../../components/dashboard/WeeklyCompletionRing';
import { StrengthRankCard } from '../../components/dashboard/StrengthRankCard';
import { WidgetGrid } from '../../components/dashboard/WidgetGrid';
import { useBodyWeightTrend } from '../../hooks/bodyweight/useBodyWeightTrend';
import { useWorkoutVolumeTrend } from '../../hooks/workouts/useWorkoutVolumeTrend';
import { useStrengthRanks } from '../../hooks/workouts/useStrengthRanks';
import { useMuscleVolumes } from '../../hooks/dashboard/useMuscleVolumes';
import { storage } from '../../utils/storage';
import { useUnitPreference } from '../../providers/UnitPreferenceProvider';
import { WIDGET_ORDER_STORAGE_KEY, DEFAULT_WIDGET_ORDER, WidgetId } from '../../utils/widgetOrder';
import { WEEKLY_GOAL_STORAGE_KEY, DEFAULT_WEEKLY_GOAL } from '../../utils/weeklyGoal';
import { getCurrentWeekRange } from '../../components/dashboard/WeeklyCompletionRing';
import { RANKING_SEX_STORAGE_KEY, DEFAULT_RANKING_SEX, StrengthSex } from '../../utils/strengthStandards';
import { HEIGHT_STORAGE_KEY } from '../../utils/height';

export default function ProfileScreen() {
  const { user } = useAuth();
  const theme = useUITheme();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const { unitSystem } = useUnitPreference();
  const { visible: menuVisible, toggle: toggleMenu, close: closeMenu } = useBurgerMenu();

  const [isWeightModalVisible, setIsWeightModalVisible] = useState(false);
  const { workoutHistory, isLoading: workoutsLoading } = useWorkoutManager();

  const {
    latestWeight,
    displayLatestWeight,
    displayWeightHistory,
    displayRangeAverage,
    selectedRange,
    setSelectedRange,
    isLoading,
    saveWeight,
  } = useBodyWeightTrend(user?.id || null, unitSystem);

  const {
    volumeHistoryData,
    rangeAverageVolume,
    rangeTotalVolume,
    rangeWorkoutCount,
    selectedVolumeRange,
    setSelectedVolumeRange,
  } = useWorkoutVolumeTrend(workoutHistory);

  const muscleVolumes = useMuscleVolumes(workoutHistory);

  const [widgetOrder, setWidgetOrder] = useState<WidgetId[]>([...DEFAULT_WIDGET_ORDER]);
  const [isEditMode, setIsEditMode] = useState(false);
  useEffect(() => {
    storage.getItem<WidgetId[]>(WIDGET_ORDER_STORAGE_KEY).then((order) => {
      if (order && order.length > 0) {
        // Drop any widgets no longer in DEFAULT_WIDGET_ORDER (removed since
        // this order was saved), then merge in any new ones added since.
        const known = order.filter((id) => (DEFAULT_WIDGET_ORDER as readonly string[]).includes(id));
        const missing = DEFAULT_WIDGET_ORDER.filter((id) => !known.includes(id));
        setWidgetOrder([...known, ...missing]);
      }
    });
  }, []);

  const handleWidgetReorder = useCallback((order: WidgetId[]) => {
    setWidgetOrder(order);
    storage.setItem(WIDGET_ORDER_STORAGE_KEY, order);
  }, []);

  const [weeklyGoal, setWeeklyGoal] = useState(DEFAULT_WEEKLY_GOAL);

  const loadWeeklyGoal = useCallback(() => {
    storage.getItem<number>(WEEKLY_GOAL_STORAGE_KEY).then((goal) => {
      if (goal !== null) setWeeklyGoal(goal);
    });
  }, []);

  useEffect(() => {
    loadWeeklyGoal();
  }, [loadWeeklyGoal]);

  // Re-check the goal whenever the screen regains focus, so a change made in
  // Settings shows up immediately without needing to reload the whole app.
  useFocusEffect(useCallback(() => {
    loadWeeklyGoal();
  }, [loadWeeklyGoal]));

  const weeklyCompletedCount = useMemo(() => {
    const { start, end } = getCurrentWeekRange();
    return (workoutHistory || []).filter((log: WorkoutLog) => {
      if (!log.workoutDate) return false;
      const d = new Date(log.workoutDate);
      return d >= start && d < end;
    }).length;
  }, [workoutHistory]);

  const [rankingSex, setRankingSex] = useState<StrengthSex>(DEFAULT_RANKING_SEX);
  useEffect(() => {
    storage.getItem<StrengthSex>(RANKING_SEX_STORAGE_KEY).then((sex) => {
      if (sex === 'male' || sex === 'female') setRankingSex(sex);
    });
  }, []);

  const handleChangeRankingSex = useCallback(async (sex: StrengthSex) => {
    setRankingSex(sex);
    await storage.setItem(RANKING_SEX_STORAGE_KEY, sex);
  }, []);

  const { bests: strengthBests, isLoading: strengthLoading } = useStrengthRanks(user);

  const [heightInches, setHeightInches] = useState<number | null>(null);
  const loadHeight = useCallback(() => {
    storage.getItem<number>(HEIGHT_STORAGE_KEY).then((height) => {
      if (height !== null) setHeightInches(height);
    });
  }, []);

  useEffect(() => {
    loadHeight();
  }, [loadHeight]);

  // Re-check on focus too, same reasoning as weekly goal — height is set
  // from Settings, a separate screen.
  useFocusEffect(useCallback(() => {
    loadHeight();
  }, [loadHeight]));

  const handleSaveWeight = async (weight: number, date: Date) => {
    try {
        await saveWeight(weight, date);
    } catch (error) {
        console.log('Error saving weight:', error);
        showToast({ message: "Failed to save weight", type: 'error' });
    }
  };

  const renderWidgetContent = (id: WidgetId) => {
    switch (id) {
      case 'weeklyCompletion':
        return <WeeklyCompletionRing completed={weeklyCompletedCount} goal={weeklyGoal} />;
      case 'strengthRank':
        return (
          <StrengthRankCard
            bests={strengthBests}
            bodyweight={latestWeight}
            heightInches={heightInches}
            sex={rankingSex}
            onChangeSex={handleChangeRankingSex}
            isLoading={strengthLoading}
          />
        );
      case 'bodyWeight':
        return (
          <BodyWeightCard
            weight={displayLatestWeight}
            history={displayWeightHistory}
            rangeAverage={displayRangeAverage}
            onLogWeight={() => setIsWeightModalVisible(true)}
            selectedRange={selectedRange}
            onRangeChange={setSelectedRange}
            primaryColor={theme.primary}
            textColor={theme.textMuted}
            isLoading={isLoading}
          />
        );
      case 'volumeTrend':
        return (
          <VolumeTrendCard
            history={volumeHistoryData}
            selectedRange={selectedVolumeRange}
            onRangeChange={setSelectedVolumeRange}
            rangeAverage={rangeAverageVolume}
            rangeTotal={rangeTotalVolume}
            workoutCount={rangeWorkoutCount}
            primaryColor={theme.primary}
            textColor={theme.textMuted}
            isLoading={workoutsLoading}
          />
        );
      case 'muscleHeatmap':
        return <MuscleHeatmap volumes={muscleVolumes} isLoading={workoutsLoading} />;
      default:
        return null;
    }
  };

  return (
    <View className="flex-1 bg-light dark:bg-dark">
      <ScrollView
        contentContainerStyle={{ paddingTop: 130, paddingBottom: 100 + insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        <WidgetGrid
          order={widgetOrder}
          onReorder={handleWidgetReorder}
          isEditMode={isEditMode}
          onRequestEditMode={() => setIsEditMode(true)}
          renderWidget={renderWidgetContent}
          containerPadding={16}
        />
      </ScrollView>

      <WeightLogModal
        visible={isWeightModalVisible}
        onClose={() => setIsWeightModalVisible(false)}
        onSave={handleSaveWeight}
      />

      <BottomActionBar>
        <DashboardButton dimmed={menuVisible} />
        {isEditMode ? (
          <TouchableOpacity
            onPress={() => setIsEditMode(false)}
            className="h-12 px-4 items-center justify-center"
          >
            <Text className="text-base font-semibold text-primary">Done</Text>
          </TouchableOpacity>
        ) : (
          <BottomNavButton
            icon="line.3.horizontal"
            label="More"
            active={menuVisible}
            boldWhenActive={false}
            onPress={toggleMenu}
          />
        )}
      </BottomActionBar>

      <BurgerMenu
        visible={menuVisible}
        onClose={closeMenu}
        items={PROFILE_MENU_ITEMS}
      />
    </View>
  );
}