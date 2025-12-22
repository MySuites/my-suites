import React, { useMemo } from 'react';
import Animated, { useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { useUITheme } from '@mycsuite/ui';
import { usePathname, useRouter } from 'expo-router';

import { RadialMenu, RadialMenuItem } from './radial-menu/RadialMenu';
import { useFloatingButton } from '../../providers/FloatingButtonContext';


const BUTTON_SIZE = 60;

const PATH_CONFIG = [
    { match: ['/profile', '/(tabs)/profile'], icon: 'person.fill' },
    { match: ['/', '/index', '/(tabs)', '/(tabs)/index'], icon: 'house.fill' },
    { match: ['/workout', '/(tabs)/workout'], icon: 'dumbbell.fill' },
];

export function QuickNavigationButton() {
  const theme = useUITheme();
  const router = useRouter();
  
  const pathname = usePathname();
  const { activeButtonId, setActiveButtonId, isHidden } = useFloatingButton();
  

  const activeIcon = useMemo(() => {
     const found = PATH_CONFIG.find(c => c.match.some(m => pathname === m || pathname.startsWith(m + '/')));
     return found ? found.icon : 'house.fill';
  }, [pathname]);

  const navigateTo = React.useCallback((route: string) => {

      if (route === 'index') router.navigate('/(tabs)');
      else if (route === 'workout') router.navigate('/(tabs)/workout');
      else if (route === 'profile') router.navigate('/(tabs)/profile');
      else router.navigate(route as any);
  }, [router]);


  const menuItems: RadialMenuItem[] = useMemo(() => [
    { id: 'profile', icon: 'person.fill', label: 'Profile', onPress: () => navigateTo('profile'), angle: 0 },   // Up
    { id: 'home', icon: 'house.fill', label: 'Home', onPress: () => navigateTo('index'), angle: 45 },           // Diagonal
    { id: 'workout', icon: 'dumbbell.fill', label: 'Workout', onPress: () => navigateTo('workout'), angle: 90 }, // Right
  ], [navigateTo]);


  const containerAnimatedStyle = useAnimatedStyle(() => {
      const shouldHide = activeButtonId === 'action' || isHidden;
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
    <Animated.View 
        className="absolute bottom-10 left-10 items-center justify-center z-[1100] w-[60px] h-[60px] overflow-visible"
        style={[containerAnimatedStyle]}
        pointerEvents="box-none"
    >
       <RadialMenu 
         items={menuItems} 
         icon={activeIcon} 
         menuRadius={120}
         style={{ backgroundColor: theme.primary }} 
         buttonSize={BUTTON_SIZE}
         onMenuStateChange={handleMenuStateChange}
       />
    </Animated.View>
  );
}
