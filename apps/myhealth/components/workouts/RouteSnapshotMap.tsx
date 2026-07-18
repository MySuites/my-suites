import React from 'react';
import { View } from 'react-native';
import MapView, { Polyline } from 'react-native-maps';
import { TrackedRoutePoint } from '../../services/WorkoutLocationTrackingService';

interface RouteSnapshotMapProps {
    points: TrackedRoutePoint[];
    color?: string;
    size?: number;
    // Fixed pixel size (thumbnail) by default. Pass fill to instead stretch
    // to the parent's available space (full-screen viewer) — width/height
    // both come from the parent flex layout rather than `size`.
    fill?: boolean;
    // Thumbnails are a static, tappable preview (no pan/zoom); the
    // full-screen viewer opened from tapping one should let the user
    // actually explore the route.
    interactive?: boolean;
}

// Map snapshot of a completed route — used next to an outdoor exercise on
// the workout summary screen, and (in interactive/fill mode) as the
// full-screen view opened by tapping that thumbnail. Unlike LiveWorkoutMap,
// this doesn't poll or follow the user; it's handed a fixed set of points
// and just fits the map to their bounds once.
//
// Forwards its MapView ref so callers can rasterize the current view via
// takeSnapshot() — used to export the route as an image (see end.tsx).
export const RouteSnapshotMap = React.forwardRef<MapView, RouteSnapshotMapProps>(function RouteSnapshotMap(
    { points, color = '#3b82f6', size = 100, fill = false, interactive = false },
    forwardedRef
) {
    const mapRef = React.useRef<MapView>(null);
    React.useImperativeHandle(forwardedRef, () => mapRef.current as MapView, []);
    const coordinates = React.useMemo(
        () => points.map(p => ({ latitude: p.latitude, longitude: p.longitude })),
        [points]
    );

    if (coordinates.length < 2) return null;

    return (
        <View style={[fill ? { flex: 1 } : { width: size, height: size }, { borderRadius: 12, overflow: 'hidden' }]}>
            <MapView
                ref={mapRef}
                style={{ width: '100%', height: '100%' }}
                scrollEnabled={interactive}
                zoomEnabled={interactive}
                rotateEnabled={interactive}
                pitchEnabled={interactive}
                pointerEvents={interactive ? 'auto' : 'none'}
                onLayout={() => {
                    const padding = fill ? 24 : 12;
                    mapRef.current?.fitToCoordinates(coordinates, {
                        edgePadding: { top: padding, right: padding, bottom: padding, left: padding },
                        animated: false,
                    });
                }}
            >
                <Polyline coordinates={coordinates} strokeColor={color} strokeWidth={3} />
            </MapView>
        </View>
    );
});
