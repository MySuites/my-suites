import React, { useMemo } from 'react';
import Animated, { useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { useUITheme } from '@mysuite/ui';
import { useRouter, usePathname } from 'expo-router';
import { RadialMenu, RadialMenuItem } from './radial-menu/RadialMenu';
import { useFloatingButton } from '../../providers/FloatingButtonContext';
import { useActiveWorkout } from '../../providers/ActiveWorkoutProvider';
import { useBackButtonAction } from './BackButton';


const BUTTON_SIZE = 60; 

type ActionItemType = {
  id: string;
  icon: string;
  label: string;
  route?: string; 
  action?: string; 
};


const CONTEXT_ACTIONS: Record<string, ActionItemType[]> = {
  'home': [
    { id: 'add_widget', icon: 'plus', label: 'Add Widget', action: 'add_widget' },
    { id: 'quick_note', icon: 'pencil', label: 'Quick Note', action: 'quick_note' },
  ],

  'profile': [
    { id: 'edit_profile', icon: 'pencil', label: 'Edit', route: '/settings/account' },
    { id: 'settings', icon: 'gear', label: 'Settings', route: '/settings' },
  ],
};

export function QuickUtilityButton() {
  const theme = useUITheme();
  const router = useRouter();
  const pathname = usePathname();
  const { activeButtonId, setActiveButtonId, isHidden } = useFloatingButton();
  const { pauseWorkout, resetWorkout, isExpanded, setExpanded } = useActiveWorkout();


  // Ensure Back button is always last to be at -90 degrees (Left)
  const currentActions = useMemo(() => {
     let actions: ActionItemType[] = [];

     if (isExpanded || pathname.includes('active-workout')) {
         actions = [
            { id: 'end_workout', icon: 'flag.checkered', label: 'End', action: 'end_workout' },
            { id: 'reset_workout', icon: 'arrow.counterclockwise', label: 'Reset', action: 'reset_workout' },
         ];
     } else if (pathname.includes('workout') || pathname === '/') {
         actions = [
            { id: 'routines', icon: 'list.bullet.clipboard', label: 'Routines', route: '/routines' },
            { id: 'saved_workouts', icon: 'folder', label: 'Workouts', route: '/workouts/saved' },
            { id: 'exercises', icon: 'dumbbell.fill', label: 'Exercises', route: '/exercises' },
         ];
     } else if (pathname.includes('profile')) {
        actions = CONTEXT_ACTIONS['profile'];
     } else {
        actions = CONTEXT_ACTIONS['home'] || [];
     }

     // Always append Back button
     return [
       ...actions,
       { id: 'back', icon: 'chevron.left', label: 'Back', action: 'go_back' }
     ];
  }, [pathname, isExpanded]);

  const { handleBack } = useBackButtonAction();

  const handleAction = React.useCallback((item: ActionItemType) => {
      if (item.action === 'go_back') {
          handleBack();
          return;
      }
      
      if (item.action === 'end_workout') {
          pauseWorkout();
          setExpanded(false);
          router.push('/workouts/end' as any);
          return;
      }
      
      if (item.action === 'reset_workout') {
          resetWorkout();
          return; 
      }
      
      if (item.route) {
          router.push(item.route as any);
      } else {
          console.log('Trigger action:', item.action);
      }
  }, [router, pauseWorkout, resetWorkout, setExpanded, handleBack]);

  const menuItems: RadialMenuItem[] = useMemo(() => {
    return currentActions.map(action => ({
        id: action.id,
        icon: action.icon,
        label: action.label,
        onPress: () => handleAction(action)
    }));
  }, [currentActions, handleAction]);

  const containerAnimatedStyle = useAnimatedStyle(() => {

      const shouldHide = activeButtonId === 'nav' || isHidden;
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

  // We always have at least the Back button now, so no need for empty check returning null
  // unless we actually want to hide it completely if there are no other actions?
  // User request: "Place it always at the left horizontal line".
  // So we should probably let it render.

  return (
    <Animated.View 
        className="absolute bottom-10 right-10 items-center justify-center z-[1100] w-[60px] h-[60px] overflow-visible"
        style={[containerAnimatedStyle]} 
        pointerEvents="box-none"
    >
       <RadialMenu 
         items={menuItems} 
         icon="ellipsis" // Always ellipsis as requested
         menuRadius={120}
         startAngle={0}
         endAngle={-90}
         style={{ backgroundColor: theme.bgDark }}
         buttonSize={BUTTON_SIZE}
         onMenuStateChange={handleMenuStateChange}
       />
    </Animated.View>
  );
}
