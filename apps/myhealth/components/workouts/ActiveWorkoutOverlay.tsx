import React, { useState } from 'react';
import { View, Text, useWindowDimensions, PanResponder } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useActiveWorkout, useActiveWorkoutTimer } from '../../providers/ActiveWorkoutProvider';
import Animated, { SlideInDown, SlideOutDown, FadeIn, FadeOut, useSharedValue, useAnimatedStyle, withTiming, runOnJS, Easing } from 'react-native-reanimated';
import { RaisedCard, IconSymbol } from '@mysuite/ui';
import { formatSeconds } from '../../utils/formatting';
import { ActiveWorkoutDetailScreen } from './ActiveWorkoutDetailScreen';
import { ActiveWorkoutScreen } from './ActiveWorkoutScreen';

export function ActiveWorkoutOverlay() {
    const insets = useSafeAreaInsets();
    const { height: windowHeight } = useWindowDimensions();
    const {
        exercises,
        isExpanded,
        toggleExpanded,
        hasActiveSession,
        setExpanded,
    } = useActiveWorkout();
    
    const [activeView, setActiveView] = useState<'detail' | 'active'>('active');

    const handleToggleToActive = React.useCallback(() => setActiveView('active'), []);
    const handleToggleToDetail = React.useCallback(() => setActiveView('detail'), []);

    const translateY = useSharedValue(windowHeight);

    React.useEffect(() => {
        if (isExpanded) {
            translateY.value = withTiming(0, {
                duration: 300,
                easing: Easing.out(Easing.quad)
            });
        } else {
            translateY.value = windowHeight;
        }
    }, [isExpanded, windowHeight]);

    React.useEffect(() => {
        if (hasActiveSession) {
            setActiveView('active');
        }
    }, [hasActiveSession]);

    const panResponder = React.useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => false,
            onMoveShouldSetPanResponder: (evt, gestureState) => {
                const isNearTop = evt.nativeEvent.pageY < (insets.top + 70);
                const isSwipeDown = gestureState.dy > 10 && Math.abs(gestureState.dx) < 10;
                return isNearTop && isSwipeDown;
            },
            onPanResponderMove: (_, gestureState) => {
                translateY.value = Math.max(0, gestureState.dy);
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dy > 120 || gestureState.vy > 0.5) {
                    translateY.value = withTiming(windowHeight, { 
                        duration: 250, 
                        easing: Easing.out(Easing.quad) 
                    }, () => {
                        runOnJS(setExpanded)(false);
                    });
                } else {
                    translateY.value = withTiming(0, { 
                        duration: 200, 
                        easing: Easing.out(Easing.quad) 
                    });
                }
            },
            onPanResponderTerminate: () => {
                translateY.value = withTiming(0, { 
                    duration: 200, 
                    easing: Easing.out(Easing.quad) 
                });
            }
        })
    ).current;

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateY: translateY.value }]
        };
    });

    if (!hasActiveSession) {
        return null;
    }

    return (
        <>
            {!isExpanded && <MinimizedOverlayHeader toggleExpanded={toggleExpanded} />}
            {isExpanded && (
                <Animated.View 
                    className="absolute inset-0 z-[999] bg-light dark:bg-dark"
                    style={[animatedStyle]}
                    {...panResponder.panHandlers}
                >
                    <View style={{ flex: 1, display: activeView === 'detail' ? 'flex' : 'none' }}>
                        <ActiveWorkoutDetailScreen onToggleView={handleToggleToActive} />
                    </View>
                    <View style={{ flex: 1, display: activeView === 'active' ? 'flex' : 'none' }}>
                        <ActiveWorkoutScreen onToggleView={handleToggleToDetail} />
                    </View>

                    {/* Small chevron down icon right below the dynamic island */}
                    <View 
                        style={{ 
                            position: 'absolute', 
                            top: insets.top - 8, 
                            left: 0, 
                            right: 0, 
                            alignItems: 'center', 
                            zIndex: 1005 
                        }}
                        pointerEvents="none"
                    >
                        <IconSymbol 
                            name="chevron.down" 
                            size={20} 
                            color="rgba(150, 150, 150, 1)" 
                        />
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


