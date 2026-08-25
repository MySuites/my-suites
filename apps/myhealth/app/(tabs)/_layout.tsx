import { Tabs } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

import { ActiveWorkoutOverlay } from '../../components/workouts/ActiveWorkoutOverlay';
import { TopNavBanner } from '../../components/ui/TopNavBanner';

export default function TabLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          // Navigation moved to TopNavBanner; the OS bottom tab bar is
          // hidden but the Tabs navigator stays so each tab keeps its own
          // stack/scroll state.
          tabBarStyle: { display: 'none' },
        }}
      >
        <Tabs.Screen name="exercises" />
        <Tabs.Screen name="saved" />
        <Tabs.Screen name="sleep" />
        <Tabs.Screen name="mind" />
        <Tabs.Screen name="index" />
        <Tabs.Screen name="workout" />
        <Tabs.Screen name="nutrition" />
      </Tabs>
      <TopNavBanner />
      <ActiveWorkoutOverlay />
    </View>
  );
}
