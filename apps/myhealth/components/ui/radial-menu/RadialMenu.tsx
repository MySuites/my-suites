import React from 'react';

import { View, ViewStyle, StyleProp, Dimensions } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  withTiming,
  SharedValue
} from 'react-native-reanimated';
import { useUITheme, IconSymbol } from '@mysuite/ui';
import * as Haptics from 'expo-haptics';

import { RadialMenuItem, RadialMenuItemType } from './RadialMenuItem';
import { LinearGradient } from 'expo-linear-gradient';


const SCREEN_HEIGHT = Dimensions.get('window').height;
const SCREEN_WIDTH = Dimensions.get('window').width;

// Radial Menu Background fade
function RadialMenuBackdrop({ isOpen }: { isOpen: SharedValue<number> }) {
    const animatedStyle = useAnimatedStyle(() => {
        return {
            opacity: withTiming(isOpen.value * 0.5, { duration: 40 }), // Darken screen
        };
    });

    return (
        <Animated.View 
            style={[animatedStyle, {
                position: 'absolute',
                width: SCREEN_WIDTH * 2,
                height: SCREEN_HEIGHT * 2,
                backgroundColor: '#000',
                zIndex: 500, // Lowest zIndex but visible
                pointerEvents: 'none', // Don't block touches for now, just visual
            }]}
        />
    );
}

// Radial Menu Fan
function RadialMenuFan({ isOpen, menuRadius, theme }: { isOpen: SharedValue<number>, menuRadius: number, theme: any }) {
    const animatedStyle = useAnimatedStyle(() => {
        const scale = isOpen.value;
        const opacity = Math.min(isOpen.value * 2, 0.4); // Cap opacity at 0.4 for circle
        return {
            transform: [
                { scale },
            ],
            opacity: withSpring(opacity),
        };
    });

    const size = menuRadius * 2; 

    return (
        <Animated.View 
            style={[animatedStyle, {
                width: size,
                height: size, // Full circle
                borderRadius: size / 2,
                backgroundColor: theme.bgLight,
                position: 'absolute',
                // Center vertically on the button center (which acts as origin 0,0 locally often, but we are in a container)
                // Container aligns items-center justify-center.
                // Button is 60px.
                // If we put this absolutely centered, it should work.
                // But let's check container.
                bottom: -(size/2) + 30, // Offset to center on the 60px button (center is 30px from bottom)
                zIndex: 1000, 
            }]}
        />
    );
}

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
  const isPressed = useSharedValue(0);

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
    .onTouchesDown(() => {
        isPressed.value = withSpring(1, { mass: 0.5 });
    })
    .onTouchesUp(() => {
        isPressed.value = withSpring(0);
    })
    .onFinalize(() => { // Ensures reset if gesture is cancelled or fails
        isPressed.value = withSpring(0);
    })
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
      // backgroundColor is handled in the child view to allow for borders
      width: buttonSize,
      height: buttonSize,
      borderRadius: buttonSize / 2,
      shadowColor: '#000',
      shadowOffset: { width: 6, height: 6 }, // Deeper shadow for floating effect
      shadowOpacity: 0.3,
      shadowRadius: 5,
      elevation: 8,
      zIndex: 3000, // Ensure button is ABOVE items
      alignItems: 'center',
      justifyContent: 'center',
    };
  });

  const strongGradientStyle = useAnimatedStyle(() => {
      return {
          opacity: isPressed.value,
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
            {/* Base Background Layer */}
            <View 
             className="absolute inset-0" 
             style={[{ 
                 backgroundColor: style && (style as any).backgroundColor ? (style as any).backgroundColor : theme.bgLight, 
                 borderRadius: buttonSize/2 
             }]} 
            />
            
            {/* Gradient Overlay for Smooth Convex Effect */}
            <LinearGradient
                colors={theme.dark ? ['hsla(0, 0%, 100%, 0.25)', 'hsla(0, 0%, 0%, 0.3)'] : ['hsla(0, 0%, 98%, 0.9)', 'hsla(0, 0%, 80%, 0.05)']}
                locations={[0.3, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    borderRadius: buttonSize / 2,
                }}
            />

            {/* Stronger Gradient Overlay for Press State */}
            <Animated.View style={[
                {
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    borderRadius: buttonSize / 2,
                    overflow: 'hidden', // Ensure gradient stays within bounds
                },
                strongGradientStyle
            ]}>
                <LinearGradient
                    colors={theme.dark ? ['hsla(0, 0%, 100%, 0.25)', 'hsla(0, 0%, 0%, 0.3)'] : ['hsla(0, 0%, 98%, 0.9)', 'hsla(0, 0%, 80%, 0.05)']}
                    locations={[0.5, 1]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ flex: 1 }}
                />
            </Animated.View>

           <IconSymbol name={icon as any} size={buttonSize * 0.5} color={theme.text} />
         </Animated.View>
       </GestureDetector>
    </View>
  );
}

