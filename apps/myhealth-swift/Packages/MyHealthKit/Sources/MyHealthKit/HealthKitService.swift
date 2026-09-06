import Foundation
import HealthKit

// Ported from apps/myhealth/services/HealthKitService.ts — the native
// HealthKit framework replaces @kingstinct/react-native-healthkit directly,
// no bridge needed. Covers the same read/write scope as the RN version
// (body mass, workouts, heart rate, active energy, distance, routes).
// Full workout-import parity (activity-type labeling, route point
// extraction) is Phase 3 work once WorkoutHealthKitSyncService is ported
// alongside it — this is the authorization + basic read/write surface.
public struct HealthKitWorkout {
    public var uuid: String
    public var startDate: Date
    public var endDate: Date
    public var durationSeconds: Int
    public var activityLabel: String
    public var avgHeartRate: Double?
    public var maxHeartRate: Double?
    public var calories: Double?
    public var distance: Double?
}

public enum HealthKitService {
    private static let store = HKHealthStore()

    public static var isAvailable: Bool {
        HKHealthStore.isHealthDataAvailable()
    }

    private static let readTypes: Set<HKObjectType> = [
        HKQuantityType(.bodyMass),
        HKObjectType.workoutType(),
        HKQuantityType(.heartRate),
        HKQuantityType(.activeEnergyBurned),
        HKQuantityType(.distanceWalkingRunning),
        HKQuantityType(.distanceCycling),
    ]

    private static let shareTypes: Set<HKSampleType> = [
        HKQuantityType(.bodyMass),
    ]

    @discardableResult
    public static func requestAuthorization() async throws -> Bool {
        guard isAvailable else { return false }
        try await store.requestAuthorization(toShare: shareTypes, read: readTypes)
        return true
    }

    private static let syncEnabledKey = "healthkit_sync_enabled"

    // Authorized = system sharing permission for body mass AND the local
    // "sync enabled" preference (a user-initiated disconnect stays off even
    // though HealthKit itself has no revoke-read API). Mirrors
    // HealthKitService.ts's isAuthorized: unset local pref defaults to true
    // once the system permission is granted, for backwards compatibility.
    public static func isAuthorized() -> Bool {
        guard store.authorizationStatus(for: HKQuantityType(.bodyMass)) == .sharingAuthorized else {
            return false
        }
        guard UserDefaults.standard.object(forKey: syncEnabledKey) != nil else {
            UserDefaults.standard.set(true, forKey: syncEnabledKey)
            return true
        }
        return UserDefaults.standard.bool(forKey: syncEnabledKey)
    }

    public static func enableSync() {
        UserDefaults.standard.set(true, forKey: syncEnabledKey)
    }

    public static func disableSync() {
        UserDefaults.standard.set(false, forKey: syncEnabledKey)
    }

    public static func latestBodyWeightKg() async throws -> Double? {
        let type = HKQuantityType(.bodyMass)
        let sort = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)
        return try await withCheckedThrowingContinuation { continuation in
            let query = HKSampleQuery(sampleType: type, predicate: nil, limit: 1, sortDescriptors: [sort]) { _, samples, error in
                if let error {
                    continuation.resume(throwing: error)
                    return
                }
                let sample = samples?.first as? HKQuantitySample
                continuation.resume(returning: sample?.quantity.doubleValue(for: .gramUnit(with: .kilo)))
            }
            store.execute(query)
        }
    }

    public static func saveBodyWeightKg(_ kilograms: Double, date: Date = .now) async throws {
        let type = HKQuantityType(.bodyMass)
        let quantity = HKQuantity(unit: .gramUnit(with: .kilo), doubleValue: kilograms)
        let sample = HKQuantitySample(type: type, quantity: quantity, start: date, end: date)
        try await store.save(sample)
    }

    // Best-effort — a missing/unsupported statistic shouldn't fail the whole fetch.
    public static func recentWorkouts(limit: Int = 20) async throws -> [HealthKitWorkout] {
        let sort = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)
        let samples: [HKWorkout] = try await withCheckedThrowingContinuation { continuation in
            let query = HKSampleQuery(sampleType: .workoutType(), predicate: nil, limit: limit, sortDescriptors: [sort]) { _, samples, error in
                if let error {
                    continuation.resume(throwing: error)
                    return
                }
                continuation.resume(returning: (samples as? [HKWorkout]) ?? [])
            }
            store.execute(query)
        }

        return samples.map { workout in
            HealthKitWorkout(
                uuid: workout.uuid.uuidString,
                startDate: workout.startDate,
                endDate: workout.endDate,
                durationSeconds: Int(workout.duration),
                activityLabel: activityTypeLabel(workout.workoutActivityType),
                avgHeartRate: nil, // requires a separate statistics query per workout — Phase 3
                maxHeartRate: nil,
                calories: workout.statistics(for: HKQuantityType(.activeEnergyBurned))?
                    .sumQuantity()?.doubleValue(for: .kilocalorie()),
                distance: workout.statistics(for: HKQuantityType(.distanceWalkingRunning))?
                    .sumQuantity()?.doubleValue(for: .meter())
            )
        }
    }

    // HKWorkoutActivityType -> human label, e.g. .functionalStrengthTraining -> "Functional Strength Training".
    private static func activityTypeLabel(_ type: HKWorkoutActivityType) -> String {
        switch type {
        case .traditionalStrengthTraining: return "Strength Training"
        case .functionalStrengthTraining: return "Functional Strength Training"
        case .running: return "Running"
        case .cycling: return "Cycling"
        case .walking: return "Walking"
        case .coreTraining: return "Core Training"
        case .highIntensityIntervalTraining: return "HIIT"
        default: return "Workout"
        }
    }
}
