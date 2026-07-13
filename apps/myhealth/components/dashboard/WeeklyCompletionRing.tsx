import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { RaisedCard, useUITheme, IconSymbol } from '@mysuite/ui';

interface WeeklyCompletionRingProps {
    completed: number;
    goal: number;
}

const SIZE = 132;
const STROKE_WIDTH = 14;
const RADIUS = (SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// A Monday-start calendar week, so the ring fully resets every Monday. This is
// the deliberate design choice behind the whole component: unlike a running
// streak counter, there is no cross-week memory here — nothing is lost or
// "broken" by missing a week, so it can't turn into a Duolingo/Snapchat-style
// obligation. It's just "how am I doing this week."
export function getCurrentWeekRange(): { start: Date; end: Date } {
    const now = new Date();
    const day = now.getDay(); // 0 = Sunday ... 6 = Saturday
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    return { start, end };
}

export function WeeklyCompletionRing({ completed, goal }: WeeklyCompletionRingProps) {
    const theme = useUITheme();
    const safeGoal = Math.max(1, goal);
    const progress = Math.min(completed / safeGoal, 1);
    const isComplete = completed >= safeGoal;
    const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

    return (
        <RaisedCard className="p-4 flex-row items-center" style={{ borderRadius: 16 }}>
            <View style={{ width: SIZE, height: SIZE }}>
                <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
                    {/* Track */}
                    <Circle
                        cx={SIZE / 2}
                        cy={SIZE / 2}
                        r={RADIUS}
                        stroke={theme.bgLight}
                        strokeWidth={STROKE_WIDTH}
                        fill="none"
                    />
                    {/* Progress */}
                    <Circle
                        cx={SIZE / 2}
                        cy={SIZE / 2}
                        r={RADIUS}
                        stroke={theme.primary}
                        strokeWidth={STROKE_WIDTH}
                        strokeLinecap="round"
                        fill="none"
                        strokeDasharray={CIRCUMFERENCE}
                        strokeDashoffset={strokeDashoffset}
                        rotation="-90"
                        origin={`${SIZE / 2}, ${SIZE / 2}`}
                    />
                </Svg>
                <View
                    style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0, bottom: 0,
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    {isComplete ? (
                        <IconSymbol name="checkmark" size={32} color={theme.primary} />
                    ) : (
                        <>
                            <Text style={{ fontSize: 28, fontWeight: '800', color: theme.text }}>
                                {completed}
                            </Text>
                            <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textMuted }}>
                                of {safeGoal}
                            </Text>
                        </>
                    )}
                </View>
            </View>

            <View style={{ flex: 1, marginLeft: 16 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: theme.text }}>
                    This Week
                </Text>
                <Text style={{ fontSize: 13, color: theme.textMuted, marginTop: 2 }}>
                    {isComplete
                        ? `Goal hit — ${completed} of ${safeGoal} workouts done.`
                        : `${safeGoal - completed} more workout${safeGoal - completed === 1 ? '' : 's'} to hit your goal.`}
                </Text>
                <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 6, opacity: 0.7 }}>
                    Resets every Monday.
                </Text>
            </View>
        </RaisedCard>
    );
}
