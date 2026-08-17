import React, { useState } from 'react';
import { View, useWindowDimensions, PanResponder } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useActiveWorkout } from '../../providers/ActiveWorkoutProvider';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, runOnJS, Easing } from 'react-native-reanimated';
import { IconSymbol } from '@mysuite/ui';
import { ActiveWorkoutDetailScreen } from './ActiveWorkoutDetailScreen';
import { ActiveWorkoutScreen } from './ActiveWorkoutScreen';

export function ActiveWorkoutOverlay() {
    const insets = useSafeAreaInsets();
    const { height: windowHeight } = useWindowDimensions();
    const {
        isExpanded,
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

