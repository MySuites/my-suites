import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { useUITheme } from '@mycsuite/ui';
import { useRouter } from 'expo-router';
import { IconSymbol } from './icon-symbol';
import { useFloatingButton } from './FloatingButtonContext';
import * as Haptics from 'expo-haptics';
import { useActiveWorkout } from '../../providers/ActiveWorkoutProvider';


const BUTTON_SIZE = 60;

export function FastBackButton() {
  const theme = useUITheme();
  const router = useRouter();
  const { activeButtonId } = useFloatingButton();
  
  // Import useActiveWorkout hook at the top
  const { isExpanded, setExpanded } = useActiveWorkout();
  
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (isExpanded) {
        setExpanded(false);
        return;
    }

    // Use Router for back navigation
    if (router.canGoBack()) {
        router.back();
    } else {
        // Fallback: If we can't go back, go to Home
        router.replace('/');
    }
  };

  const containerAnimatedStyle = useAnimatedStyle(() => {
      // If ANY other menu is active, slide out to the LEFT
      const shouldHide = activeButtonId !== null;
      return {
          transform: [
              { translateX: withSpring(shouldHide ? -150 : 0) } 
          ],
          opacity: withTiming(shouldHide ? 0 : 1)
      };
  });

  return (
    <Animated.View style={[styles.container, containerAnimatedStyle]} pointerEvents="box-none">
       <TouchableOpacity 
         style={[styles.button, { backgroundColor: theme.surface }]} 
         onPress={handlePress}
         activeOpacity={0.8}
       >
          <IconSymbol name="chevron.left" size={28} color={theme.text} />
       </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 900,
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  }
});
