import { Tabs } from 'expo-router';
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BottomTabBar } from '@react-navigation/bottom-tabs';

import { HapticTab } from '../../components/ui/HapticTab';
import { FastNavigationButton } from '../../components/ui/FastNavigationButton';
import { useNavigationSettings } from '../providers/NavigationSettingsProvider';
import { IconSymbol } from '../../components/ui/icon-symbol';
import { Colors } from '../../constants/theme';
import { useColorScheme } from '../../hooks/use-color-scheme';
import { FastActionButton } from '../../components/ui/FastActionButton';
import { FastBackButton } from '../../components/ui/FastBackButton';

import { FloatingButtonProvider } from '../../components/ui/FloatingButtonContext';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { isFabEnabled } = useNavigationSettings();

  return (
    <FloatingButtonProvider>
      <Tabs
        backBehavior="history"
        tabBar={(props) => {
           if (isFabEnabled) {
               // Render our Floating Buttons INSTEAD of the tab bar.
               // We wrap them in a View that sits at the bottom but doesn't block interaction elsewhere.
               // Since the buttons are absolute positioned (bottom: 0/40), we can just render them.
               // We use absolute positioning on the container to ensure they anchor to the screen.
               return (
                   <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
                       {/* Pass the Tab Navigation prop directly to ensure correct context */}
                       <FastNavigationButton navigation={props.navigation} />
                       <FastActionButton />
                       {/* Pass navigation to Back Button too for correct history handling */}
                       <FastBackButton navigation={props.navigation} />
                   </View>
               );
           }
           return <BottomTabBar {...props} />;
        }}
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? 'light'].primary,
          headerShown: false,
          tabBarButton: HapticTab, // Always use HapticTab when BottomTabBar is rendered
          // We don't need to hide tabBarStyle manually anymore since we replace the bar entirely when enabled
        }}
      >
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
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
          }}
        />
      </Tabs>
    </FloatingButtonProvider>
  );
}
