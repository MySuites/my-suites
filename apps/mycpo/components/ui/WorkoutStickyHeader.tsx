import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUITheme } from '@mycsuite/ui';
import Animated, { FadeIn, FadeOut, Layout } from 'react-native-reanimated';
import { useActiveWorkout } from '../../providers/ActiveWorkoutProvider';
import { formatSeconds } from '../../utils/formatting';
import { IconSymbol } from './icon-symbol';

export function WorkoutStickyHeader() {
    const theme = useUITheme();
    const insets = useSafeAreaInsets();
    
    // Get workout state
    const { isRunning, workoutSeconds, workoutName, isExpanded, toggleExpanded, hasActiveSession } = useActiveWorkout();
    
    // Logic for visibility:
    // Must have an active session
    const hasActiveWorkout = hasActiveSession;
    
    
    if (!hasActiveWorkout) {
        return null; // Don't show if no workout at all
    }

    // Config based on screen state
    // User requested title to ALWAYS be the workout name
    const title = workoutName || "Current Workout";
    const rightIcon = isExpanded ? "chevron.down" : "chevron.up";
    
    const handlePress = () => {
         toggleExpanded();
    };

    return (
        <Animated.View 
            layout={Layout.springify()} // Animate layout changes if any (e.g. height)
            entering={FadeIn.duration(300)}
            exiting={FadeOut.duration(300)}
            style={{ paddingTop: insets.top + 8 }}
            className="absolute top-0 left-0 right-0 z-[1001] pb-6 px-4 shadow-sm border-b border-black/5 bg-surface dark:bg-surface_dark"
        >
            <TouchableOpacity 
                className="flex-row items-center justify-between"
                onPress={handlePress}
                activeOpacity={0.8}
            >
                 <View className="flex-row items-center gap-2">
                     <View className={`w-2 h-2 rounded-full ${isRunning ? 'bg-primary dark:bg-primary_dark' : 'bg-gray-400'}`} />
                     <Text className="text-sm font-semibold text-apptext dark:text-apptext_dark">{title}</Text>
                 </View>
                 
                 <View className="flex-row items-center gap-2">
                     <Text className="text-sm font-semibold tabular-nums text-apptext dark:text-apptext_dark">{formatSeconds(workoutSeconds)}</Text>
                     <IconSymbol name={rightIcon} size={16} color={theme.icon ?? '#000'} />
                 </View>
            </TouchableOpacity>
        </Animated.View>
    );
}
