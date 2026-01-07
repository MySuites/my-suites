import * as React from 'react';
import { useState, useEffect } from 'react';
import { View, TouchableOpacity, LayoutChangeEvent, Platform } from 'react-native';
import { IconSymbol } from './IconSymbol';
import { RaisedCard } from './RaisedCard';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';

export type ThemePreference = 'light' | 'dark' | 'system';

interface ThemeToggleProps {
  preference: ThemePreference;
  setPreference: (p: ThemePreference) => void;
}

export const ThemeToggle = ({ preference, setPreference }: ThemeToggleProps) => {
  const [containerWidth, setContainerWidth] = useState(0);
  
  // Border widths from className
  const BORDER_TOP = 0;
  const BORDER_LEFT = 2;
  const BORDER_BOTTOM = 2;
  const BORDER_RIGHT = 2;

  // Use symmetric padding to handle centering reliably
  const PADDING = 4; // p-1
  
  const TOTAL_HORIZONTAL_CHROME = BORDER_LEFT + BORDER_RIGHT + (PADDING * 2);
  
  const translateX = useSharedValue(0);
  
  const handleLayout = (e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  };
  
  const slideWidth = containerWidth > 0 ? (containerWidth - TOTAL_HORIZONTAL_CHROME) / 2 : 0;

  useEffect(() => {
    if (slideWidth === 0) return;
    
    // Sun is at 0, Moon is at slideWidth
    const targetX = preference === 'light' ? 0 : slideWidth;
    
    translateX.value = withTiming(targetX, {
      duration: 300,
      easing: Easing.out(Easing.cubic),
    });
  }, [preference, slideWidth, translateX]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
      width: slideWidth,
    };
  });

  return (
    <View 
      className="flex-row items-center my-3 pt-1 pb-[6px] h-12 w-full rounded-full bg-light dark:bg-dark-darker border-t-[3px] border-l-[3px] border-b-[1px] border-r-[1px] border-t-gray-300 border-l-gray-300 border-b-white border-r-white dark:border-t-black/60 dark:border-l-black/60 dark:border-b-white/10 dark:border-r-white/10"
      onLayout={handleLayout}
    >
      {/* Sliding Background Pill */}
      {containerWidth > 0 && (
        <Animated.View style={[
          animatedStyle, 
          { 
            height: '100%',
            zIndex: 0 
          }
        ]}>
           <RaisedCard
            className="w-full h-full p-0 items-center justify-center"
            style={{ margin: 0, borderRadius: 9999 }} 
            onPress={() => {}}
            disabled={true}
          >
           {/* Empty children */}
            <View /> 
          </RaisedCard>
        </Animated.View>
      )}

      {/* Interactive Layer - Positioning it absolutely inside the padding and borders to match the pill */}
      <View 
        className="absolute flex-row z-10" 
        style={{ 
            top: BORDER_TOP + PADDING, 
            left: BORDER_LEFT + PADDING,
            bottom: BORDER_BOTTOM + PADDING,
            right: BORDER_RIGHT + PADDING,
        }}
      >
        <TouchableOpacity
            onPress={() => setPreference('light')}
            className="flex-1 items-center justify-center bg-transparent"
            activeOpacity={0.8}
        >
            <IconSymbol 
                name="sun.max.fill" 
                size={20} 
                color={preference === 'light' ? 'black' : '#6b7280'} 
            />
        </TouchableOpacity>
        
        <TouchableOpacity
            onPress={() => setPreference('dark')}
            className="flex-1 items-center justify-center bg-transparent"
            activeOpacity={0.8}
        >
            <IconSymbol 
                name="moon.fill" 
                size={20} 
                color={preference === 'dark' ? 'white' : '#6b7280'}
            />
        </TouchableOpacity>
      </View>
    </View>
  );
};
