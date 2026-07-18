import React from 'react';
import { View, StyleSheet } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { WorkoutLocationTrackingService, TrackedRoutePoint } from '../../services/WorkoutLocationTrackingService';

const POLL_INTERVAL_MS = 3000;

interface LiveWorkoutMapProps {
    color?: string;
    // Omit to fill whatever space the parent gives it (flex: 1) instead of a
    // fixed pixel height — self-adjusts to available room so it never
    // overflows its container regardless of device size.
    height?: number;
}

// Live-updating map for the active workout screen — polls the same GPS
// buffer the background location task writes to (WorkoutLocationTrackingService),
// drawing the route as it's recorded and following the runner, similar to
// Strava/Nike Run Club's in-run map.
//
// Memoized on its own props (color/height, both stable across the parent's
// once-a-second stopwatch tick) so that tick doesn't force this component
// (and the native MapView/Polyline it holds) to re-render 3x more often
// than its own GPS poll actually produces new data.
function LiveWorkoutMapInner({ color = '#3b82f6', height }: LiveWorkoutMapProps) {
    const [points, setPoints] = React.useState<TrackedRoutePoint[]>([]);

    React.useEffect(() => {
        let cancelled = false;

        const poll = async () => {
            const latest = await WorkoutLocationTrackingService.getLiveRoute();
            if (!cancelled) setPoints(latest);
        };

        poll();
        const interval = setInterval(poll, POLL_INTERVAL_MS);
        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, []);

    const lastPoint = points[points.length - 1];
    const coordinates = React.useMemo(
        () => points.map(p => ({ latitude: p.latitude, longitude: p.longitude })),
        [points]
    );

    return (
        <View style={[height ? { height } : { flex: 1 }, { width: '100%', borderRadius: 16, overflow: 'hidden' }]}>
            <MapView
                style={StyleSheet.absoluteFill}
                showsUserLocation
                followsUserLocation
            >
                {coordinates.length >= 2 && (
                    <Polyline coordinates={coordinates} strokeColor={color} strokeWidth={4} />
                )}
                {lastPoint && (
                    <Marker coordinate={{ latitude: lastPoint.latitude, longitude: lastPoint.longitude }} />
                )}
            </MapView>
        </View>
    );
}

export const LiveWorkoutMap = React.memo(LiveWorkoutMapInner);
