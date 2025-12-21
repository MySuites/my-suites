import React from 'react';
import Animated, { 
    useAnimatedStyle, 
    withSpring,
    SharedValue
} from 'react-native-reanimated';
import { IconSymbol } from './icon-symbol';

export type RadialMenuItemType = {
  id: string;
  icon: string;
  label: string;
  onPress?: () => void;
  angle?: number; // Explicit angle
};

export function RadialMenuItem({
    item,
    index,
    angle,
    menuRadius,
    isOpen,
    selectedItemIndex,
    theme,
}: {
    item: RadialMenuItemType,
    index: number,
    angle: number,
    menuRadius: number,
    isOpen: SharedValue<number>,
    selectedItemIndex: SharedValue<number>,
    theme: any
}) {
    const angleRad = (angle - 90) * (Math.PI / 180); 

    const containerStyle = useAnimatedStyle(() => {
        const progress = isOpen.value; 
        const translateX = progress * menuRadius * Math.cos(angleRad);
        const translateY = progress * menuRadius * Math.sin(angleRad);

        return {
            transform: [
                { translateX },
                { translateY },
            ],
            opacity: 1, 
            zIndex: 2000, 
        };
    });

    const circleStyle = useAnimatedStyle(() => {
        const isSelected = selectedItemIndex.value === index;
        const scale = withSpring(isSelected ? 1.3 : 1);
        return {
            transform: [{ scale }]
        };
    });

    const animatedLabelStyle = useAnimatedStyle(() => {
        const isSelected = selectedItemIndex.value === index;
        return {
            opacity: withSpring(isSelected ? 1 : 0),
        };
    });

    return (
        <Animated.View style={containerStyle} className="absolute w-[52px] h-[52px] items-center justify-center">
            <Animated.View style={[{ backgroundColor: theme.primary }, circleStyle]} className="w-[52px] h-[52px] rounded-full items-center justify-center shadow-sm">
                <IconSymbol name={item.icon as any} size={28} color="#fff" />
            </Animated.View>
             <Animated.Text style={[{ color: '#fff', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: {width: 0, height: 1}, textShadowRadius: 2 }, animatedLabelStyle]} className="absolute -top-7 text-xs font-semibold w-20 text-center">
                {item.label}
             </Animated.Text>
        </Animated.View>
    );
}
