import React from 'react';
import { View, Text } from 'react-native';
import { TrackedRoutePoint } from '../../services/WorkoutLocationTrackingService';

interface RouteSnapshotMapProps {
    points: TrackedRoutePoint[];
    color?: string;
    size?: number;
    fill?: boolean;
    interactive?: boolean;
}

// react-native-maps isn't web-compatible (it imports native-only RN
// internals), and Expo bundles every route — including this component's
// callers (the workout summary screen) — for `expo export --platform web`.
// Metro picks this file over RouteSnapshotMap.tsx automatically on web, so
// the native map never gets imported there. The forwarded ref stays null
// here (nothing to snapshot); callers already optional-chain their use of
// it (e.g. `mapRef.current?.takeSnapshot(...)`), so that's safe.
export const RouteSnapshotMap = React.forwardRef<null, RouteSnapshotMapProps>(function RouteSnapshotMap(
    { points, size = 100, fill = false },
    _forwardedRef
) {
    if (points.length < 2) return null;

    return (
        <View
            style={[
                fill ? { flex: 1 } : { width: size, height: size },
                { borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.05)' },
            ]}
        >
            <Text style={{ opacity: 0.5, fontSize: fill ? 14 : 10 }}>Map unavailable on web</Text>
        </View>
    );
});
