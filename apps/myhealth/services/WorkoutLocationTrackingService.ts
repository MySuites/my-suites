import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface TrackedRoutePoint {
    latitude: number;
    longitude: number;
    altitude?: number;
    timestamp: string; // ISO
}

const LOCATION_TASK_NAME = "myhealth-workout-location-tracking";
const ROUTE_BUFFER_KEY = "workout_gps_route_buffer";

// Defined at module scope (required by expo-task-manager, not inside a
// component/hook) so it's registered even if the app was relaunched
// headlessly by iOS to deliver a background location update. Appends to
// AsyncStorage rather than an in-memory array/closure variable, since
// module-level JS state can be lost between such headless invocations.
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
    if (error) {
        console.error("[WorkoutLocationTrackingService] Task error:", error);
        return;
    }
    const { locations } = (data as { locations: Location.LocationObject[] }) || { locations: [] };
    if (!locations || locations.length === 0) return;

    try {
        const existingRaw = await AsyncStorage.getItem(ROUTE_BUFFER_KEY);
        const existing: TrackedRoutePoint[] = existingRaw ? JSON.parse(existingRaw) : [];
        const newPoints: TrackedRoutePoint[] = locations.map((loc) => ({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            altitude: loc.coords.altitude ?? undefined,
            timestamp: new Date(loc.timestamp).toISOString(),
        }));
        await AsyncStorage.setItem(ROUTE_BUFFER_KEY, JSON.stringify([...existing, ...newPoints]));
    } catch (e) {
        console.error("[WorkoutLocationTrackingService] Failed to buffer location:", e);
    }
});

export const WorkoutLocationTrackingService = {
    /**
     * Requests foreground, then background, location permission.
     * Returns true if at least foreground permission was granted (tracking
     * can proceed in a degraded, foreground-only mode if background is denied).
     */
    requestPermissions: async (): Promise<boolean> => {
        try {
            const foreground = await Location.requestForegroundPermissionsAsync();
            if (foreground.status !== "granted") return false;

            // Best-effort: background denial doesn't block tracking, it just
            // means updates pause while the phone is locked/app backgrounded.
            await Location.requestBackgroundPermissionsAsync();
            return true;
        } catch (error) {
            console.error("[WorkoutLocationTrackingService] Permission request failed:", error);
            return false;
        }
    },

    startTracking: async (): Promise<void> => {
        try {
            await AsyncStorage.removeItem(ROUTE_BUFFER_KEY);
            const alreadyStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
            if (alreadyStarted) {
                await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
            }
            await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
                accuracy: Location.Accuracy.BestForNavigation,
                timeInterval: 5000,
                distanceInterval: 10,
                showsBackgroundLocationIndicator: true,
                foregroundService: {
                    notificationTitle: "MyHealth",
                    notificationBody: "Tracking your workout route",
                },
            });
        } catch (error) {
            console.error("[WorkoutLocationTrackingService] Failed to start tracking:", error);
        }
    },

    /**
     * Stops tracking and returns the buffered route points collected since
     * the last startTracking() call.
     */
    stopTracking: async (): Promise<TrackedRoutePoint[]> => {
        try {
            const isStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
            if (isStarted) {
                await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
            }
        } catch (error) {
            console.error("[WorkoutLocationTrackingService] Failed to stop tracking:", error);
        }

        try {
            const raw = await AsyncStorage.getItem(ROUTE_BUFFER_KEY);
            await AsyncStorage.removeItem(ROUTE_BUFFER_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (error) {
            console.error("[WorkoutLocationTrackingService] Failed to read buffered route:", error);
            return [];
        }
    },
};
