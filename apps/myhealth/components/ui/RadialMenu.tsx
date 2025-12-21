import React from 'react';

import { View, ViewStyle, StyleProp } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { useUITheme } from '@mycsuite/ui';
import { IconSymbol } from './icon-symbol';
import * as Haptics from 'expo-haptics';
import { RadialMenuBackdrop } from './RadialMenuBackdrop';
import { RadialMenuFan } from './RadialMenuFan';
import { RadialMenuItem, RadialMenuItemType } from './RadialMenuItem';

// Configuration
const BUTTON_SIZE = 60;
const ACTIVATION_DELAY = 100; 

export { RadialMenuItemType as RadialMenuItem };

type RadialMenuProps = {
  items: RadialMenuItemType[];
  icon: string; // Icon for the main button
  startAngle?: number; // For distributed mode
  endAngle?: number;   // For distributed mode
  menuRadius?: number;
  style?: StyleProp<ViewStyle>;
  buttonSize?: number;
  onMenuStateChange?: (isOpen: boolean) => void;
};


export function RadialMenu({
  items,
  icon,
  startAngle = -90,
  endAngle = -90,
  menuRadius = 100,
  style,
  buttonSize = BUTTON_SIZE,
  onMenuStateChange,
}: RadialMenuProps) {
  const theme = useUITheme();

  // Animation values
  const isOpen = useSharedValue(0);
  const scale = useSharedValue(1);
  const selectedItemIndex = useSharedValue(-1);

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle) => {
    Haptics.impactAsync(style);
  };

  const handleSelection = (index: number) => {
    if (index === -1) return;
    const item = items[index];
    if (item && item.onPress) {
      item.onPress();
    }
  };

  // Helper to get angle for an item
  const getItemAngle = React.useCallback((index: number) => {
    const item = items[index];
    if (item.angle !== undefined) {
      return item.angle;
    }
    // Distributed mode logic
    if (items.length === 1) return (startAngle + endAngle) / 2;
    const step = (endAngle - startAngle) / (items.length - 1);
    return startAngle + (index * step);
  }, [items, startAngle, endAngle]);
  
  // Pre-calculate angles to safely access them in the UI thread worklet
  const itemAngles = React.useMemo(() => items.map((_, i) => getItemAngle(i)), [items, getItemAngle]);

  const handleMenuStateChangeWrapper = (isOpen: boolean) => {
      if (onMenuStateChange) {
          onMenuStateChange(isOpen);
      }
  };

  // Gesture Logic
  const gesture = Gesture.Pan()
    .activateAfterLongPress(ACTIVATION_DELAY) 
    .onStart(() => {
      isOpen.value = withSpring(1);
      scale.value = withSpring(1.1);
      runOnJS(triggerHaptic)(Haptics.ImpactFeedbackStyle.Medium);
      runOnJS(handleMenuStateChangeWrapper)(true);
    })
    .onUpdate((e) => {
      const x = e.translationX;
      const y = e.translationY;
      
      const angleRad = Math.atan2(y, x);
      const angleDeg = angleRad * (180 / Math.PI);
      const effectiveAngle = angleDeg + 90; 

      let bestIndex = -1;
      
      for (let i = 0; i < itemAngles.length; i++) {
        const targetAngle = itemAngles[i];
        let diff = Math.abs(effectiveAngle - targetAngle);
        if (diff > 180) diff = 360 - diff;

        const dist = Math.sqrt(x*x + y*y);
        
        if (dist > 40 && diff < 15) {
            bestIndex = i;
        }
      }
      
      if (selectedItemIndex.value !== bestIndex) {
         if (bestIndex !== -1) {
             runOnJS(triggerHaptic)(Haptics.ImpactFeedbackStyle.Light);
         }
         selectedItemIndex.value = bestIndex;
      }
    })
    .onEnd(() => {
      isOpen.value = withSpring(0);
      scale.value = withSpring(1);
      if (selectedItemIndex.value !== -1) {
        runOnJS(handleSelection)(selectedItemIndex.value);
      }
      runOnJS(handleMenuStateChangeWrapper)(false);
      selectedItemIndex.value = -1;
    });

  const tapGesture = Gesture.Tap().onEnd(() => {
      if (isOpen.value > 0.5) {
          isOpen.value = withSpring(0);
          runOnJS(handleMenuStateChangeWrapper)(false);
      } else {
          runOnJS(triggerHaptic)(Haptics.ImpactFeedbackStyle.Light);
      }
  });
  
  const composedGesture = Gesture.Race(gesture, tapGesture);

  // Styles
  const buttonStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      backgroundColor: theme.background, 
      width: buttonSize,
      height: buttonSize,
      borderRadius: buttonSize / 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
      zIndex: 3000, // Ensure button is ABOVE items
      alignItems: 'center',
      justifyContent: 'center',
    };
  });

  return (
    <View className="items-center justify-center overflow-visible" style={[style, { backgroundColor: 'transparent' }]} pointerEvents="box-none">
       {/* Menu Backdrop */}
       <RadialMenuBackdrop isOpen={isOpen} />

       {/* Fan Background */}
       <RadialMenuFan isOpen={isOpen} menuRadius={menuRadius} theme={theme} />

       {items.map((item, index) => (
           <RadialMenuItem 
             key={item.id}
             item={item}
             index={index}
             angle={itemAngles[index]}
             menuRadius={menuRadius}
             isOpen={isOpen} // Keep this for potential future usage or fallback
             selectedItemIndex={selectedItemIndex}
             theme={theme}
           />
       ))}

      <GestureDetector gesture={composedGesture}>
        <Animated.View style={buttonStyle}>
           <View className="absolute inset-0" style={[{ backgroundColor: style && (style as any).backgroundColor ? (style as any).backgroundColor : theme.surface, borderRadius: buttonSize/2 }]} />
          <IconSymbol name={icon as any} size={buttonSize * 0.5} color={theme.text} />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

