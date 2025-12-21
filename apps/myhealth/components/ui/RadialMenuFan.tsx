import React from 'react';
import Animated, { 
    useAnimatedStyle, 
    withSpring,
    SharedValue
} from 'react-native-reanimated';

export function RadialMenuFan({ isOpen, menuRadius, theme }: { isOpen: SharedValue<number>, menuRadius: number, theme: any }) {
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
                backgroundColor: theme.primary,
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
