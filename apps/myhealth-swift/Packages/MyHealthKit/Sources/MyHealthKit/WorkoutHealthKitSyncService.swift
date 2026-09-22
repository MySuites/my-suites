import Foundation
import SwiftData

// Ported from apps/myhealth/services/WorkoutHealthKitSyncService.ts —
// imports Apple Watch workouts (logged to HealthKit) into the app's workout
// history as read-only entries. Dedupes against the HealthKit sample uuid
// (WorkoutLogRecord.healthkitUuid) so re-running it doesn't create
// duplicates; the in-flight-task guard mirrors the RN version's
// in-flight-promise guard.
@MainActor
public enum WorkoutHealthKitSyncService {
    private static var syncTask: Task<Void, Never>?

    @discardableResult
    public static func syncWorkoutsFromHealthKit(context: ModelContext) -> Task<Void, Never> {
        if let syncTask { return syncTask }

        let task = Task {
            defer { syncTask = nil }
            guard HealthKitService.isAuthorized() else { return }
            let oneYearAgo = Calendar.current.date(byAdding: .year, value: -1, to: .now)
            guard let workouts = try? await HealthKitService.recentWorkouts(since: oneYearAgo, limit: 200),
                  !workouts.isEmpty else { return }

            let repository = WorkoutRepository(context: context)
            for workout in workouts {
                guard let alreadyImported = try? repository.hasWorkoutLog(healthkitUuid: workout.uuid),
                      !alreadyImported else { continue }
                _ = try? repository.saveLog(
                    workoutName: "\(workout.activityLabel) (Apple Watch)",
                    workoutDate: workout.startDate,
                    duration: workout.durationSeconds,
                    sets: [],
                    healthkitUuid: workout.uuid,
                    avgHeartRate: workout.avgHeartRate,
                    maxHeartRate: workout.maxHeartRate,
                    calories: workout.calories,
                    distance: workout.distance,
                    elevationGain: workout.elevationGain,
                    route: workout.route,
                    metricsSource: "healthkit"
                )
            }
        }
        syncTask = task
        return task
    }
}
