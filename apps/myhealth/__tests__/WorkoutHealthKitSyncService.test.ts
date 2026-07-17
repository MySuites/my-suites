import { WorkoutHealthKitSyncService } from "../services/WorkoutHealthKitSyncService";
import { HealthKitService } from "../services/HealthKitService";
import { DataRepository } from "../providers/DataRepository";

jest.mock("../services/HealthKitService", () => ({
    HealthKitService: {
        isAuthorized: jest.fn(),
        fetchWorkouts: jest.fn(),
    },
}));

jest.mock("../providers/DataRepository", () => ({
    DataRepository: {
        hasWorkoutLogWithHealthKitUuid: jest.fn(),
        saveLog: jest.fn(),
    },
}));

describe("WorkoutHealthKitSyncService", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    const mockWorkout = {
        uuid: "hk-workout-1",
        startDate: "2026-06-20T09:00:00.000Z",
        endDate: "2026-06-20T09:30:00.000Z",
        durationSeconds: 1800,
        activityLabel: "Running",
        avgHeartRate: 142,
        maxHeartRate: 168,
        calories: 310,
        distance: 5230,
        elevationGain: 42,
        route: [
            { latitude: 37.7749, longitude: -122.4194, timestamp: "2026-06-20T09:00:00.000Z" },
            { latitude: 37.7755, longitude: -122.4183, timestamp: "2026-06-20T09:01:00.000Z" },
        ],
    };

    it("skips import when not authorized", async () => {
        (HealthKitService.isAuthorized as jest.Mock).mockResolvedValue(false);

        await WorkoutHealthKitSyncService.syncWorkoutsFromHealthKit("user1");

        expect(HealthKitService.fetchWorkouts).not.toHaveBeenCalled();
        expect(DataRepository.saveLog).not.toHaveBeenCalled();
    });

    it("imports a new HealthKit workout as a workout log", async () => {
        (HealthKitService.isAuthorized as jest.Mock).mockResolvedValue(true);
        (HealthKitService.fetchWorkouts as jest.Mock).mockResolvedValue([mockWorkout]);
        (DataRepository.hasWorkoutLogWithHealthKitUuid as jest.Mock).mockResolvedValue(false);
        (DataRepository.saveLog as jest.Mock).mockResolvedValue(undefined);

        await WorkoutHealthKitSyncService.syncWorkoutsFromHealthKit("user1");

        expect(DataRepository.saveLog).toHaveBeenCalledTimes(1);
        expect(DataRepository.saveLog).toHaveBeenCalledWith(
            expect.objectContaining({
                userId: "user1",
                name: "Running (Apple Watch)",
                duration: 1800,
                date: mockWorkout.startDate,
                exercises: [],
                healthkitUuid: "hk-workout-1",
                metricsSource: "healthkit",
                avgHeartRate: 142,
                maxHeartRate: 168,
                calories: 310,
                distance: 5230,
                elevationGain: 42,
                route: mockWorkout.route,
            })
        );
    });

    it("does not re-import a workout already synced (dedupe by uuid)", async () => {
        (HealthKitService.isAuthorized as jest.Mock).mockResolvedValue(true);
        (HealthKitService.fetchWorkouts as jest.Mock).mockResolvedValue([mockWorkout]);
        (DataRepository.hasWorkoutLogWithHealthKitUuid as jest.Mock).mockResolvedValue(true);

        await WorkoutHealthKitSyncService.syncWorkoutsFromHealthKit("user1");

        expect(DataRepository.hasWorkoutLogWithHealthKitUuid).toHaveBeenCalledWith("hk-workout-1");
        expect(DataRepository.saveLog).not.toHaveBeenCalled();
    });
});
