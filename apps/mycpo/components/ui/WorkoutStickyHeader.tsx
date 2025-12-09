import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
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
    const { isRunning, workoutSeconds, workoutName, isExpanded, toggleExpanded } = useActiveWorkout();
    
    // Logic for visibility:
    // Must be running OR have some time elapsed (paused state).
    const hasActiveWorkout = isRunning || workoutSeconds > 0;
    
    
    if (!hasActiveWorkout) {
        return null; // Don't show if no workout at all
    }

    // Styles
    const containerStyle = [
        styles.container, 
        { paddingTop: insets.top + 8, backgroundColor: theme.surface }
    ];

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
            style={containerStyle}
        >
            <TouchableOpacity 
                style={styles.content} 
                onPress={handlePress}
                activeOpacity={0.8}
            >
                 <View style={styles.leftInfo}>
                     <View style={[styles.indicator, { backgroundColor: isRunning ? theme.primary : theme.icon }]} />
                     <Text style={[styles.label, { color: theme.text }]}>{title}</Text>
                 </View>
                 
                 <View style={styles.rightInfo}>
                     <Text style={[styles.timer, { color: theme.text }]}>{formatSeconds(workoutSeconds)}</Text>
                     <IconSymbol name={rightIcon} size={16} color={theme.icon ?? '#000'} />
                 </View>
            </TouchableOpacity>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000, // Above everything
        paddingBottom: 12,
        paddingHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    leftInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    indicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
    },
    rightInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    timer: {
        fontSize: 14,
        fontVariant: ['tabular-nums'],
        fontWeight: '600',
    }
});
