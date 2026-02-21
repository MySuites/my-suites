import { Tabs } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { PlatformPressable } from '@react-navigation/elements';
import * as Haptics from 'expo-haptics';

import { IconSymbol, hslToHex } from "@mysuite/ui";
import { useColorScheme } from '../../hooks/ui/use-color-scheme';
import { ActiveWorkoutOverlay } from '../../components/workouts/ActiveWorkoutOverlay';

import colors from '../../../../packages/ui/colors';
const { baseColors, appThemes } = colors;

// import { GlobalOverlay } from '../../components/ui/GlobalOverlay';
// import { QuickNavigationButton } from '../../components/ui/QuickNavigationMenu';
// import { QuickUtilityButton } from '../../components/ui/QuickUtilityMenu';

function HapticTab(props: any) {
  return (
    <PlatformPressable
      {...props}
      onPressIn={(ev) => {
        if (process.env.EXPO_OS === 'ios') {
          // Add a soft haptic feedback when pressing down on the tabs.
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        props.onPressIn?.(ev);
      }}
    />
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        backBehavior="history"
        screenOptions={{
          tabBarActiveTintColor: hslToHex(appThemes['myhealth'][colorScheme ?? 'light'].primary),
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarStyle: {
            backgroundColor: hslToHex(baseColors[colorScheme ?? 'light'].bgLight),
            borderTopColor: hslToHex(baseColors[colorScheme ?? 'light'].border),
          }
        }}
      >
        <Tabs.Screen 
          name="sleep"
          options={{
            title: 'Sleep',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="moon.zzz.fill" color={color} />,
          }}
        />

        <Tabs.Screen 
        name="mind"
        options={{
          title: 'Mind',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="brain.head.profile" color={color} />,
        }}
        />

        <Tabs.Screen 
          name="index" 
          options={{ 
            title: 'Home',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
          }} 
        />
          
        <Tabs.Screen
          name='workout'
          options={{
            title: 'Workout',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="dumbbell.fill" color={color} />,
          }}
        />

        <Tabs.Screen
          name='nutrition'
          options={{
            title: 'Nutrition',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="fork.knife" color={color} />,
          }}
        />
      </Tabs>
      <ActiveWorkoutOverlay />
    </View>
  );
}
