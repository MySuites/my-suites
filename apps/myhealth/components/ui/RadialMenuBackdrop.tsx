import React from 'react';
import { Dimensions } from 'react-native';
import Animated, { 
    useAnimatedStyle, 
    withTiming,
    SharedValue
} from 'react-native-reanimated';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SCREEN_WIDTH = Dimensions.get('window').width;

export function RadialMenuBackdrop({ isOpen }: { isOpen: SharedValue<number> }) {
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
