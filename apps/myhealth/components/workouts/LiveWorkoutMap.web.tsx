import React from 'react';
import { View, Text } from 'react-native';

interface LiveWorkoutMapProps {
    color?: string;
    height?: number;
}

// react-native-maps isn't web-compatible (it imports native-only RN
// internals), and Expo bundles every route — including this component's
// callers — for `expo export --platform web`. Metro picks this file over
// LiveWorkoutMap.tsx automatically on web, so the native map never gets
// imported there.
export function LiveWorkoutMap({ height }: LiveWorkoutMapProps) {
    return (
        <View
            style={[
                height ? { height } : { flex: 1 },
                { width: '100%', borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.05)' },
            ]}
        >
            <Text style={{ opacity: 0.5 }}>Map unavailable on web</Text>
        </View>
    );
}
