import React, { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { useUITheme } from '@mycsuite/ui';
import { usePathname } from 'expo-router';
import { useNavigation } from '@react-navigation/native';

import { RadialMenu, RadialMenuItem } from './RadialMenu';
import { useFloatingButton } from './FloatingButtonContext';

// Configuration
const BUTTON_SIZE = 60;

// Configuration for matching paths to icons
const PATH_CONFIG = [
    { match: ['/profile', '/(tabs)/profile'], icon: 'person.fill' },
    { match: ['/', '/index', '/(tabs)', '/(tabs)/index'], icon: 'house.fill' },
    { match: ['/workout', '/(tabs)/workout'], icon: 'dumbbell.fill' },
];

export function FastNavigationButton({ navigation: propNavigation }: { navigation?: any }) {
  const theme = useUITheme();
  // Use prop navigation if valid, otherwise fallback to hook (though hook seems to be the source of error)
  const defaultNavigation = useNavigation();
  const navigation = propNavigation || defaultNavigation;
  
  const pathname = usePathname();
  const { activeButtonId, setActiveButtonId } = useFloatingButton();

  // Determine active icon based on current path
  const activeIcon = useMemo(() => {
     const found = PATH_CONFIG.find(c => c.match.some(m => pathname === m || pathname.startsWith(m + '/')));
     return found ? found.icon : 'house.fill';
  }, [pathname]);

  const navigateTo = React.useCallback((route: string) => {
      if (!navigation) {
          console.error('FastNavigationButton: Navigation prop is missing!');
          return;
      }
      // @ts-ignore - Dynamic string navigation with merge: true for proper Tab behavior
      navigation.navigate({ name: route, merge: true });
  }, [navigation]);

  // Define menu items with explicit angles
  // We use route names (index, workout, profile) to ensure the Tab Navigator tracks history correctly.
  const menuItems: RadialMenuItem[] = useMemo(() => [
    { id: 'profile', icon: 'person.fill', label: 'Profile', onPress: () => navigateTo('profile'), angle: -45 },
    { id: 'home', icon: 'house.fill', label: 'Home', onPress: () => navigateTo('index'), angle: 0 },
    { id: 'workout', icon: 'dumbbell.fill', label: 'Workout', onPress: () => navigateTo('workout'), angle: 45 },
  ], [navigateTo]);

  // Handle visibility animation
  const containerAnimatedStyle = useAnimatedStyle(() => {
      // If the OTHER button (action) is active, slide out to the LEFT
      const shouldHide = activeButtonId === 'action';
      return {
          transform: [
              { translateX: withSpring(shouldHide ? -150 : 0) } 
          ],
          opacity: withTiming(shouldHide ? 0 : 1)
      };
  });

  const handleMenuStateChange = (isOpen: boolean) => {
      if (isOpen) {
          setActiveButtonId('nav');
      } else if (activeButtonId === 'nav') { // Only clear if we were the owner
          setActiveButtonId(null);
      }
  };

  return (
    <Animated.View style={[styles.container, containerAnimatedStyle]} pointerEvents="box-none">
       <RadialMenu 
         items={menuItems} 
         icon={activeIcon} 
         menuRadius={100}
         style={{ backgroundColor: theme.primary }} 
         buttonSize={BUTTON_SIZE}
         onMenuStateChange={handleMenuStateChange}
       />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0, // Note: This stretches the container, so translateX affects the whole bar implicitly? 
    // Wait, RadialMenu is centered in this container (alignItems: center).
    // If we translate THIS container, the whole bottom bar moves?
    // Let's refine style to wrap just the button area if needed, but for now this moves the button.
    height: 150, 
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 40,
    zIndex: 1000,
    pointerEvents: 'box-none',
    overflow: 'visible',
  },
});
