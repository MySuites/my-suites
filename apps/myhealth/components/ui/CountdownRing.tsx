import React from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useUITheme } from '@mysuite/ui';

interface CountdownRingProps {
    size: number;
    radius: number;
    strokeWidth: number;
    // 0-1, fraction of the ring still filled (remaining time / total).
    progress: number;
    color: string;
    children?: React.ReactNode;
}

export function CountdownRing({ size, radius, strokeWidth, progress, color, children }: CountdownRingProps) {
    const theme = useUITheme();
    const center = size / 2;
    const circumference = 2 * Math.PI * radius;
    const trackColor = theme.dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';

    return (
        <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
            <Svg width={size} height={size}>
                <Circle
                    cx={center}
                    cy={center}
                    r={radius}
                    stroke={trackColor}
                    strokeWidth={strokeWidth}
                    fill="transparent"
                />
                <Circle
                    cx={center}
                    cy={center}
                    r={radius}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference * (1 - progress)}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${center} ${center})`}
                />
            </Svg>
            <View style={{ position: 'absolute', justifyContent: 'center', alignItems: 'center' }}>
                {children}
            </View>
        </View>
    );
}
