import React, { useState, useRef } from 'react';
import { Text, View, FlatList, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, { 
    useAnimatedStyle, 
    useAnimatedReaction, 
    runOnJS, 
    interpolate, 
    Extrapolation, 
    SharedValue,
    useSharedValue
} from 'react-native-reanimated';
import { useWorkoutManager } from '../hooks/useWorkoutManager';
import { WorkoutDetailsModal } from '../components/workouts/WorkoutDetailsModal';
import { IconSymbol } from '../components/ui/icon-symbol';

import * as Haptics from 'expo-haptics';

// Actions component that monitors drag distance
const RightAction = ({ 
    dragX, 
    progress, 
    onDelete,
    onSetReadyToDelete
}: { 
    dragX: SharedValue<number>; 
    progress: SharedValue<number>;
    onDelete: () => void;
    onSetReadyToDelete: (ready: boolean) => void;
}) => {
    const { width } = useWindowDimensions();
    const hasTriggered = useSharedValue(false);
    // Trigger when card is swiped past 40% of screen width (less strict than 50%)
    // dragX is negative when swiping left
    const TRIGGER_THRESHOLD = -width * 0.4;
    
    const BUTTON_HEIGHT = 50; // Smaller circle
    const BUTTON_MARGIN = 20; // Increased spacing from card
    // Layout width needs to include the margin to snap correctly at the circle's edge
    const LAYOUT_WIDTH = BUTTON_HEIGHT + BUTTON_MARGIN; 

    // Monitor drag value to trigger haptic feedback on long swipe
    useAnimatedReaction(
        () => dragX.value,
        (currentDrag) => {
            if (currentDrag < TRIGGER_THRESHOLD && !hasTriggered.value) {
                hasTriggered.value = true;
                runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
                // Mark parent as ready to delete
                runOnJS(onSetReadyToDelete)(true);
            } else if (currentDrag > TRIGGER_THRESHOLD + 40 && hasTriggered.value) {
                hasTriggered.value = false;
                // Unmark if user swipes back
                runOnJS(onSetReadyToDelete)(false);
            }
        }
    );

    const animatedBgStyle = useAnimatedStyle(() => {
        // Width matches drag distance. 
        const width = Math.abs(dragX.value);
        
        // Scale the button from 0 to 1 as it opens
        const scale = interpolate(
            dragX.value,
            [-LAYOUT_WIDTH, 0],
            [1, 0], 
            Extrapolation.CLAMP
        );

        // Opacity fade in
        const opacity = interpolate(
            dragX.value,
            [-LAYOUT_WIDTH, -20], // Start fading in a bit earlier or matching scale
            [1, 0],
            Extrapolation.CLAMP
        );
        
        return {
            width: Math.max(width - BUTTON_MARGIN, BUTTON_HEIGHT), 
            height: BUTTON_HEIGHT,
            borderRadius: BUTTON_HEIGHT / 2, 
            transform: [{ scale }],
            opacity,
        };
    });

    const iconStyle = useAnimatedStyle(() => {
        const scale = interpolate(
            dragX.value,
            [-LAYOUT_WIDTH, 0],
            [1, 0.5],
            Extrapolation.CLAMP
        );
        return {
            transform: [{ scale }]
        };
    });

    const textStyle = useAnimatedStyle(() => {
        const scale = interpolate(
            dragX.value,
            [-LAYOUT_WIDTH, 0],
            [1, 0], 
            Extrapolation.CLAMP
        );
        const opacity = interpolate(
            dragX.value,
            [-LAYOUT_WIDTH, -20],
            [1, 0],
            Extrapolation.CLAMP
        );

        // Slide text down from the center of the button as it grows
        // Button center is at 25px (50/2). Text layout is below button (at 50px + margin).
        // scale 0: translateY = -25 -> Text at 25px (center)
        // scale 1: translateY = 0 -> Text at 50px+ (bottom)
        const translateY = interpolate(
            dragX.value,
            [-LAYOUT_WIDTH, 0],
            [0, -BUTTON_HEIGHT / 2],
            Extrapolation.CLAMP
        );

        return {
            opacity,
            transform: [{ scale }, { translateY }]
        };
    });

    return (
        <View style={{ width: LAYOUT_WIDTH, height: '100%', justifyContent: 'center', alignItems: 'flex-end', marginBottom: 12 }}>
             {/* 
                Structure: Stack Button and Text vertically.
                Align items-center so text stays centered with the button.
                The Wrapper is anchored right (items-end in parent), so as button grows width, it expands left,
                and the text (centered) moves left with it.
             */}
            <View style={{ marginLeft: BUTTON_MARGIN, alignItems: 'center' }}>
                <Animated.View 
                    className="bg-red-500 justify-center items-center" 
                    style={[animatedBgStyle]} 
                >
                    <View style={{ width: BUTTON_HEIGHT, height: '100%', justifyContent: 'center', alignItems: 'center' }}>
                        <TouchableOpacity onPress={onDelete} activeOpacity={0.8}>
                            <Animated.View style={[iconStyle, { alignItems: 'center' }]}>
                                <IconSymbol name="trash.fill" size={18} color="white" />
                            </Animated.View>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
                {/* Text outside the button */}
                <Animated.Text 
                    className="text-gray-500 dark:text-gray-400 text-[10px] font-semibold mt-1"
                    style={[textStyle]} 
                >
                    Trash
                </Animated.Text>
            </View>
        </View>
    );
};


const WorkoutHistoryItem = ({ item, onDelete, onPress }: { item: any, onDelete: () => void, onPress: () => void }) => {
    // Track if we are deep enough to delete
    const shouldDelete = useRef(false);

    // Callback to update the ref from the shared value listener
    const setReadyToDelete = (ready: boolean) => {
        shouldDelete.current = ready;
    };

    return (
        <Swipeable
            renderRightActions={(progress, dragX) => (
                <RightAction 
                    dragX={dragX} 
                    progress={progress} 
                    onDelete={onDelete} 
                    onSetReadyToDelete={setReadyToDelete}
                />
            )}
            overshootRight={true} // Allow overshooting to swipe fully
            friction={2}
            rightThreshold={40} // Easy to open (Reveal threshold)
            onSwipeableWillOpen={() => {
                // Trigger delete ONLY if we dragged past the deep threshold
                if (shouldDelete.current) {
                    onDelete();
                }
                // If not deep enough, it just opens (revealing the button)
            }}
            containerStyle={{ overflow: 'visible' }}
        >
            <TouchableOpacity 
                className="bg-surface dark:bg-surface_dark rounded-xl p-4 mb-3 border border-surface dark:border-white/10 shadow-sm"
                onPress={onPress}
                activeOpacity={0.7}
            >
                <View className="flex-row justify-between mb-2">
                <Text className="text-lg font-semibold text-apptext dark:text-apptext_dark">{item.workoutName || 'Untitled Workout'}</Text>
                <Text className="text-sm text-gray-500">
                    {new Date(item.workoutTime).toLocaleDateString()}
                </Text>
                </View>
                <View className="flex-row items-center">
                <Text className="text-sm text-gray-500 mr-2">{new Date(item.workoutTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
                {item.notes && <Text className="text-sm text-gray-500" numberOfLines={1}>• {item.notes}</Text>}
                </View>
                <View className="mt-2 items-end">
                    <Text className="text-xs text-primary dark:text-primary_dark">Tap for details</Text>
                </View>
            </TouchableOpacity>
        </Swipeable>
    );
};

export default function WorkoutHistoryScreen() {
  const router = useRouter();
  const { workoutHistory, deleteWorkoutLog } = useWorkoutManager();
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background_dark">
      <Stack.Screen options={{ headerShown: false }} />
      
      <View className="flex-row justify-between items-center px-4 py-3 border-b border-surface dark:border-white/10">
        <Text className="text-2xl font-bold text-apptext dark:text-apptext_dark">Workout History</Text>
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <Text className="text-primary dark:text-primary_dark text-base font-semibold">Close</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={workoutHistory}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
            <WorkoutHistoryItem 
                item={item} 
                onDelete={() => deleteWorkoutLog(item.id, { skipConfirmation: true })}
                onPress={() => setSelectedLogId(item.id)}
            />
        )}
        ListEmptyComponent={
          <View className="p-8 items-center">
            <Text className="text-gray-500 text-base text-center">
              There are currently no past workouts, start and finish a workout first.
            </Text>
          </View>
        }
      />

      <WorkoutDetailsModal 
        visible={!!selectedLogId} 
        onClose={() => setSelectedLogId(null)} 
        workoutLogId={selectedLogId} 
      />
    </SafeAreaView>
  );
}
