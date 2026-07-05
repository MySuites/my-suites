import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useActiveWorkout, useActiveWorkoutTimer } from '../../providers/ActiveWorkoutProvider';
import Animated, { SlideInDown, SlideOutDown, FadeIn, FadeOut } from 'react-native-reanimated';
import { RaisedCard, IconSymbol } from '@mysuite/ui';
import { formatSeconds } from '../../utils/formatting';
import { ActiveWorkoutDetailScreen } from './ActiveWorkoutDetailScreen';
import { ActiveWorkoutScreen } from './ActiveWorkoutScreen';

export function ActiveWorkoutOverlay() {
    const insets = useSafeAreaInsets();
    const {
        exercises,
        isExpanded,
        toggleExpanded,
        hasActiveSession,
    } = useActiveWorkout();
    
    const [activeView, setActiveView] = useState<'detail' | 'active'>('detail');

    const handleToggleToActive = React.useCallback(() => setActiveView('active'), []);
    const handleToggleToDetail = React.useCallback(() => setActiveView('detail'), []);

    if (!hasActiveSession) {
        return null;
    }

    return (
        <>
            {!isExpanded && <MinimizedOverlayHeader toggleExpanded={toggleExpanded} />}
            {isExpanded && (
                <Animated.View 
                    className="absolute inset-0 z-[999] bg-light dark:bg-dark"
                    entering={SlideInDown.duration(400)} 
                    exiting={SlideOutDown.duration(400)}
                >
                    <View style={{ flex: 1, display: activeView === 'detail' ? 'flex' : 'none' }}>
                        <ActiveWorkoutDetailScreen onToggleView={handleToggleToActive} />
                    </View>
                    <View style={{ flex: 1, display: activeView === 'active' ? 'flex' : 'none' }}>
                        <ActiveWorkoutScreen onToggleView={handleToggleToDetail} />
                    </View>
                </Animated.View>
            )}
        </>
    );
}

function MinimizedOverlayHeader({ toggleExpanded }: { toggleExpanded: () => void }) {
    const insets = useSafeAreaInsets();
    const { isRunning, workoutSeconds } = useActiveWorkoutTimer();
    const { exercises } = useActiveWorkout();
    
    const totalSets = exercises.reduce((acc, ex) => {
        const setsNum = typeof ex.sets === 'string' ? parseInt(ex.sets, 10) : (typeof ex.sets === 'number' ? ex.sets : 0);
        return acc + (isNaN(setsNum) ? 0 : setsNum);
    }, 0);
    const completedSets = exercises.reduce((acc, ex) => acc + (ex.completedSets || 0), 0);
    const progressPercent = totalSets > 0 ? (completedSets / totalSets) * 100 : 0;

    return (
        <Animated.View 
            entering={FadeIn.delay(200).duration(300)}
            exiting={FadeOut.duration(200)}
            style={{ 
                zIndex: 40,
                bottom: insets.bottom + 65,
                alignSelf: 'center',
                width: '60%',
                maxWidth: 300,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.25,
                shadowRadius: 8,
                elevation: 8,
            }}
            className="absolute"
        >
            <RaisedCard
                onPress={toggleExpanded}
                className="flex-col items-center justify-center py-3 px-6 rounded-full bg-primary dark:bg-primary-dark border-0 overflow-hidden"
                style={{ borderRadius: 9999 }}
            >
                 <View className="flex-row items-center gap-2 mb-1">
                      {isRunning ? (
                          <View className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
                      ) : (
                          <IconSymbol name="pause.fill" size={10} color="rgba(255,255,255,0.7)" />
                      )}
                      <Text className="text-lg font-bold tabular-nums text-white">
                         {formatSeconds(workoutSeconds)}
                      </Text>
                 </View>
                 {totalSets > 0 && (
                      <View className="w-24 h-1 bg-white/20 rounded-full overflow-hidden">
                           <View 
                               className="h-full bg-white" 
                               style={{ width: `${progressPercent}%` }} 
                            />
                      </View>
                 )}
            </RaisedCard>
        </Animated.View>
    );
}


