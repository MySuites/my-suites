import React, { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { useUITheme } from '@mycsuite/ui';
import { useRouter, usePathname } from 'expo-router';
import { RadialMenu, RadialMenuItem } from './RadialMenu';
import { useFloatingButton } from './FloatingButtonContext';
import { useActiveWorkout } from '../../providers/ActiveWorkoutProvider';

// ... (imports remain)

// Configuration
const BUTTON_SIZE = 60; 

type ActionItemType = {
  id: string;
  icon: string;
  label: string;
  route?: string; 
  action?: string; 
};

// Define actions per route context
const CONTEXT_ACTIONS: Record<string, ActionItemType[]> = {
  'home': [
    { id: 'add_widget', icon: 'plus', label: 'Add Widget', action: 'add_widget' },
    { id: 'quick_note', icon: 'pencil', label: 'Quick Note', action: 'quick_note' },
  ],
  // 'workout' actions will be generated dynamically now
  'profile': [
    { id: 'edit_profile', icon: 'pencil', label: 'Edit', route: '/settings/account' },
    { id: 'settings', icon: 'gear', label: 'Settings', route: '/settings' },
  ],
};

export function FastUtilityButton() {
  const theme = useUITheme();
  const router = useRouter();
  const pathname = usePathname();
  const { activeButtonId, setActiveButtonId } = useFloatingButton();
  const { isRunning, startWorkout, pauseWorkout, finishWorkout, isExpanded } = useActiveWorkout();

  // Determine current context and actions
  const currentActions = useMemo(() => {
     if (isExpanded || pathname.includes('active-workout')) {
         return [
            { 
                id: 'toggle_workout', 
                icon: isRunning ? 'pause.fill' : 'play.fill', 
                label: isRunning ? 'Pause' : 'Start', 
                action: 'toggle_workout' 
            },
            { id: 'log_weight', icon: 'scale.3d', label: 'Log Weight', action: 'log_weight' },
            { id: 'finish_workout', icon: 'flag.checkered', label: 'Finish', action: 'finish_workout' },
         ];
     }
     if (pathname.includes('workout') || pathname === '/') {
        // General workout tab logic (or home if '/' maps there)
         return [
            { id: 'create_routine', icon: 'list.bullet.clipboard', label: 'New Routine', action: 'create_routine' },
            // TODO: Add a button to access all exercises
            // TODO: Add a button to choose a workout
            { id: 'log_weight', icon: 'scale.3d', label: 'Log Weight', action: 'log_weight' },
         ];
     }
     if (pathname.includes('profile')) return CONTEXT_ACTIONS['profile'];
     return CONTEXT_ACTIONS['home'] || [];
  }, [pathname, isRunning, isExpanded]);

  const handleAction = React.useCallback((item: ActionItemType) => {
      if (item.action === 'toggle_workout') {
          if (isRunning) {
              pauseWorkout();
          } else {
              startWorkout();
              // Already on the screen, no need to push
          }
          return;
      }
      
      if (item.action === 'finish_workout') {
        finishWorkout();
        return; 
      }

      if (item.route) {
          router.push(item.route as any);
      } else {
          console.log('Trigger action:', item.action);
      }
  }, [router, isRunning, startWorkout, pauseWorkout, finishWorkout]);

  // Map to RadialMenuItems
  // We use distributed angles, so we don't set angle explicitly
  const menuItems: RadialMenuItem[] = useMemo(() => {
    return currentActions.map(action => ({
        id: action.id,
        icon: action.icon,
        label: action.label,
        onPress: () => handleAction(action)
    }));
  }, [currentActions, handleAction]);

  const containerAnimatedStyle = useAnimatedStyle(() => {
      // If the OTHER button (nav) is active, slide out to the RIGHT
      const shouldHide = activeButtonId === 'nav';
      return {
          transform: [
              { translateX: withSpring(shouldHide ? 150 : 0) } 
          ],
          opacity: withTiming(shouldHide ? 0 : 1)
      };
  });

  const handleMenuStateChange = (isOpen: boolean) => {
      if (isOpen) {
          setActiveButtonId('action');
      } else if (activeButtonId === 'action') {
          setActiveButtonId(null);
      }
  };

  if (!currentActions || currentActions.length === 0) return null;

  return (
    <Animated.View style={[styles.container, containerAnimatedStyle]} pointerEvents="box-none">
       <RadialMenu 
         items={menuItems} 
         icon="ellipsis" // Always ellipsis as requested
         menuRadius={120}
         startAngle={0}
         endAngle={-90}
         style={{ backgroundColor: theme.surface }}
         buttonSize={BUTTON_SIZE}
         onMenuStateChange={handleMenuStateChange}
       />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 40, 
    right: 40, 
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1100, 
    width: 60, // Constrain size to avoid blocking
    height: 60,
    overflow: 'visible',
  }
});
