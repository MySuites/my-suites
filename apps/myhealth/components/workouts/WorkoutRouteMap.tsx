import React from 'react';
import { View } from 'react-native';
import Svg, { Polyline, Circle } from 'react-native-svg';

export interface WorkoutRoutePoint {
    latitude: number;
    longitude: number;
    timestamp: string;
}

interface WorkoutRouteMapProps {
    route: WorkoutRoutePoint[];
    color?: string;
    size?: number;
}

const PADDING = 12;

// Draws the workout's GPS route as a scaled polyline — no map tiles/streets,
// just the path shape (react-native-svg is already a dependency used
// elsewhere for charts, so this adds no new native modules). Longitude is
// corrected for latitude so N/S and E/W distances stay roughly proportional
// (a degree of longitude covers less ground the further from the equator).
export function WorkoutRouteMap({ route, color = '#3b82f6', size = 200 }: WorkoutRouteMapProps) {
    if (!route || route.length < 2) return null;

    const lats = route.map(p => p.latitude);
    const lngs = route.map(p => p.longitude);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const avgLatRad = ((minLat + maxLat) / 2) * (Math.PI / 180);
    const latSpan = maxLat - minLat;
    const lngSpan = (maxLng - minLng) * Math.cos(avgLatRad);
    const span = Math.max(latSpan, lngSpan, 0.0001); // guard near-stationary routes

    const innerSize = size - PADDING * 2;
    const usedWidth = (lngSpan / span) * innerSize;
    const usedHeight = (latSpan / span) * innerSize;
    const offsetX = PADDING + (innerSize - usedWidth) / 2;
    const offsetY = PADDING + (innerSize - usedHeight) / 2;

    const points = route.map(p => ({
        x: offsetX + ((p.longitude - minLng) * Math.cos(avgLatRad) / span) * innerSize,
        y: offsetY + ((maxLat - p.latitude) / span) * innerSize,
    }));

    const pointsStr = points.map(p => `${p.x},${p.y}`).join(' ');
    const start = points[0];
    const end = points[points.length - 1];

    return (
        <View style={{ alignItems: 'center' }}>
            <Svg width={size} height={size}>
                <Polyline
                    points={pointsStr}
                    fill="none"
                    stroke={color}
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <Circle cx={start.x} cy={start.y} r={5} fill={color} />
                <Circle cx={end.x} cy={end.y} r={5} fill="#fff" stroke={color} strokeWidth={2} />
            </Svg>
        </View>
    );
}
