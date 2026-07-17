import { WorkoutLocationTrackingService } from "../services/WorkoutLocationTrackingService";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";

describe("WorkoutLocationTrackingService", () => {
    afterEach(async () => {
        jest.clearAllMocks();
        await AsyncStorage.clear();
    });

    describe("requestPermissions", () => {
        it("returns false if foreground permission is denied", async () => {
            (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ status: "denied" });

            const result = await WorkoutLocationTrackingService.requestPermissions();

            expect(result).toBe(false);
            expect(Location.requestBackgroundPermissionsAsync).not.toHaveBeenCalled();
        });

        it("returns true when foreground is granted, even if background is denied", async () => {
            (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ status: "granted" });
            (Location.requestBackgroundPermissionsAsync as jest.Mock).mockResolvedValue({ status: "denied" });

            const result = await WorkoutLocationTrackingService.requestPermissions();

            expect(result).toBe(true);
        });
    });

    describe("startTracking / stopTracking", () => {
        it("starts location updates and clears any stale buffer", async () => {
            (Location.hasStartedLocationUpdatesAsync as jest.Mock).mockResolvedValue(false);

            await WorkoutLocationTrackingService.startTracking();

            expect(Location.startLocationUpdatesAsync).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({ accuracy: Location.Accuracy.BestForNavigation })
            );
        });

        it("stops tracking and returns/clears the buffered route", async () => {
            (Location.hasStartedLocationUpdatesAsync as jest.Mock).mockResolvedValue(true);
            const bufferedPoints = [
                { latitude: 1, longitude: 2, timestamp: "2026-06-20T09:00:00.000Z" },
            ];
            await AsyncStorage.setItem("workout_gps_route_buffer", JSON.stringify(bufferedPoints));

            const result = await WorkoutLocationTrackingService.stopTracking();

            expect(Location.stopLocationUpdatesAsync).toHaveBeenCalled();
            expect(result).toEqual(bufferedPoints);
            expect(await AsyncStorage.getItem("workout_gps_route_buffer")).toBeNull();
        });

        it("returns an empty array when nothing was buffered", async () => {
            (Location.hasStartedLocationUpdatesAsync as jest.Mock).mockResolvedValue(false);

            const result = await WorkoutLocationTrackingService.stopTracking();

            expect(result).toEqual([]);
        });
    });
});
