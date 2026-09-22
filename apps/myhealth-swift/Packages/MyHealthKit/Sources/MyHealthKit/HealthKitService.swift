import CoreLocation
import Foundation
import HealthKit

// Ported from apps/myhealth/services/HealthKitService.ts — the native
// HealthKit framework replaces @kingstinct/react-native-healthkit directly,
// no bridge needed. Covers the same read/write scope as the RN version
// (body mass, workouts, heart rate, active energy, distance, routes),
// including per-workout heart rate statistics and HKWorkoutRoute point
// extraction — imported into app history by WorkoutHealthKitSyncService.
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
    public var elevationGain: Double?
    public var route: [RoutePoint]?
}

public enum HealthKitService {
    private static let store = HKHealthStore()

    public static var isAvailable: Bool {
        HKHealthStore.isHealthDataAvailable()
    }

    private static let readTypes: Set<HKObjectType> = [
        HKQuantityType(.bodyMass),
        HKObjectType.workoutType(),
        HKSeriesType.workoutRoute(),
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
    public static func recentWorkouts(since startDate: Date? = nil, limit: Int = 20) async throws -> [HealthKitWorkout] {
        let sort = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)
        let predicate = startDate.map { HKQuery.predicateForSamples(withStart: $0, end: nil) }
        let samples: [HKWorkout] = try await withCheckedThrowingContinuation { continuation in
            let query = HKSampleQuery(sampleType: .workoutType(), predicate: predicate, limit: limit, sortDescriptors: [sort]) { _, samples, error in
                if let error {
                    continuation.resume(throwing: error)
                    return
                }
                continuation.resume(returning: (samples as? [HKWorkout]) ?? [])
            }
            store.execute(query)
        }

        var results: [HealthKitWorkout] = []
        for workout in samples {
            async let avgHeartRate = averageHeartRate(for: workout)
            async let maxHeartRate = maxHeartRate(for: workout)
            async let route = routePoints(for: workout)

            results.append(
                HealthKitWorkout(
                    uuid: workout.uuid.uuidString,
                    startDate: workout.startDate,
                    endDate: workout.endDate,
                    durationSeconds: Int(workout.duration),
                    activityLabel: activityTypeLabel(workout.workoutActivityType),
                    avgHeartRate: await avgHeartRate,
                    maxHeartRate: await maxHeartRate,
                    calories: workout.statistics(for: HKQuantityType(.activeEnergyBurned))?
                        .sumQuantity()?.doubleValue(for: .kilocalorie()),
                    distance: workout.statistics(for: HKQuantityType(.distanceWalkingRunning))?
                        .sumQuantity()?.doubleValue(for: .meter())
                        ?? workout.statistics(for: HKQuantityType(.distanceCycling))?
                        .sumQuantity()?.doubleValue(for: .meter()),
                    elevationGain: workout.metadata?[HKMetadataKeyElevationAscended]
                        .flatMap { ($0 as? HKQuantity)?.doubleValue(for: .meter()) },
                    route: await route
                )
            )
        }
        return results
    }

    private static func averageHeartRate(for workout: HKWorkout) async -> Double? {
        await heartRateStatistic(for: workout) { $0.averageQuantity() }
    }

    private static func maxHeartRate(for workout: HKWorkout) async -> Double? {
        await heartRateStatistic(for: workout) { $0.maximumQuantity() }
    }

    private static func heartRateStatistic(for workout: HKWorkout, _ extract: @escaping (HKStatistics) -> HKQuantity?) async -> Double? {
        let unit = HKUnit.count().unitDivided(by: .minute())
        let predicate = HKQuery.predicateForObjects(from: workout)
        return await withCheckedContinuation { continuation in
            let query = HKStatisticsQuery(quantityType: HKQuantityType(.heartRate), quantitySamplePredicate: predicate, options: [.discreteAverage, .discreteMax]) { _, stats, _ in
                guard let stats, let quantity = extract(stats) else {
                    continuation.resume(returning: nil)
                    return
                }
                continuation.resume(returning: quantity.doubleValue(for: unit))
            }
            store.execute(query)
        }
    }

    // HKWorkoutRoute is a series of CLLocation batches, not a plain sample —
    // fetched via a nested route-then-locations query pair, same two-step
    // shape as RN's sample.getWorkoutRoutes()/route.locations.
    private static func routePoints(for workout: HKWorkout) async -> [RoutePoint]? {
        let routes: [HKWorkoutRoute] = await withCheckedContinuation { continuation in
            let predicate = HKQuery.predicateForObjects(from: workout)
            let query = HKSampleQuery(sampleType: HKSeriesType.workoutRoute(), predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: nil) { _, samples, _ in
                continuation.resume(returning: (samples as? [HKWorkoutRoute]) ?? [])
            }
            store.execute(query)
        }
        guard !routes.isEmpty else { return nil }

        var points: [RoutePoint] = []
        for route in routes {
            let locations: [CLLocation] = await withCheckedContinuation { continuation in
                var collected: [CLLocation] = []
                let routeQuery = HKWorkoutRouteQuery(route: route) { _, batch, done, _ in
                    if let batch { collected.append(contentsOf: batch) }
                    if done { continuation.resume(returning: collected) }
                }
                store.execute(routeQuery)
            }
            points.append(contentsOf: locations.map {
                RoutePoint(latitude: $0.coordinate.latitude, longitude: $0.coordinate.longitude, timestamp: $0.timestamp)
            })
        }
        return points.isEmpty ? nil : points
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
