import Foundation
import SwiftData

// SwiftData-backed CRUD layer, ported from apps/myhealth/providers/DataRepository.tsx.
// `sync_status`/`deleted_at` sync semantics dropped per the plan — soft
// delete (`deletedAt`) is kept on records for potential undo UX but nothing
// here filters on it yet; add `WHERE deletedAt == nil` predicates once a
// screen actually needs trash/undo.
@MainActor
public final class WorkoutRepository {
    private let context: ModelContext

    public init(context: ModelContext) {
        self.context = context
    }

    // MARK: - Workouts (templates)

    public func fetchWorkouts() throws -> [WorkoutRecord] {
        let descriptor = FetchDescriptor<WorkoutRecord>(
            sortBy: [SortDescriptor(\.sortOrder), SortDescriptor(\.createdAt, order: .reverse)]
        )
        return try context.fetch(descriptor)
    }

    public func saveWorkout(id: String? = nil, name: String, exercises: [WorkoutExerciseTemplate], sortOrder: Int? = nil) throws {
        if let id, let existing = try fetchWorkout(id: id) {
            existing.name = name
            existing.exercises = exercises
            existing.updatedAt = .now
            if let sortOrder { existing.sortOrder = sortOrder }
        } else {
            let workout = WorkoutRecord(id: id ?? UUID().uuidString, name: name, exercises: exercises, sortOrder: sortOrder)
            context.insert(workout)
        }
        try context.save()
    }

    public func updateWorkoutSortOrders(_ orders: [(id: String, sortOrder: Int)]) throws {
        for order in orders {
            if let workout = try fetchWorkout(id: order.id) {
                workout.sortOrder = order.sortOrder
                workout.updatedAt = .now
            }
        }
        try context.save()
    }

    public func deleteWorkout(id: String) throws {
        if let workout = try fetchWorkout(id: id) {
            context.delete(workout)
            try context.save()
        }
    }

    // Parameter deliberately not named `id` — the #Predicate macro can crash
    // at runtime (SIGTRAP) when the captured variable shadows the model
    // property name it's compared against.
    private func fetchWorkout(id targetId: String) throws -> WorkoutRecord? {
        var descriptor = FetchDescriptor<WorkoutRecord>(predicate: #Predicate { $0.id == targetId })
        descriptor.fetchLimit = 1
        return try context.fetch(descriptor).first
    }

    // MARK: - History (performed workout logs)

    public func fetchHistory() throws -> [WorkoutLogRecord] {
        let descriptor = FetchDescriptor<WorkoutLogRecord>(sortBy: [SortDescriptor(\.workoutDate, order: .reverse)])
        return try context.fetch(descriptor)
    }

    @discardableResult
    public func saveLog(
        id: String? = nil,
        workoutName: String,
        workoutDate: Date = .now,
        duration: Int,
        note: String? = nil,
        sets: [SetLogRecord],
        imageUrls: [String] = [],
        healthkitUuid: String? = nil,
        avgHeartRate: Double? = nil,
        maxHeartRate: Double? = nil,
        calories: Double? = nil,
        distance: Double? = nil,
        elevationGain: Double? = nil,
        route: [RoutePoint]? = nil,
        metricsSource: String? = nil
    ) throws -> WorkoutLogRecord {
        let log = WorkoutLogRecord(
            id: id ?? UUID().uuidString,
            workoutDate: workoutDate,
            workoutName: workoutName,
            duration: duration,
            note: note,
            imageUrls: imageUrls,
            healthkitUuid: healthkitUuid,
            avgHeartRate: avgHeartRate,
            maxHeartRate: maxHeartRate,
            calories: calories,
            distance: distance,
            elevationGain: elevationGain,
            route: route,
            metricsSource: metricsSource
        )
        context.insert(log)
        for set in sets {
            set.workoutLog = log
            context.insert(set)
        }
        try context.save()
        return log
    }

    public func deleteHistory(id targetId: String) throws {
        var descriptor = FetchDescriptor<WorkoutLogRecord>(predicate: #Predicate { $0.id == targetId })
        descriptor.fetchLimit = 1
        if let log = try context.fetch(descriptor).first {
            context.delete(log)
            try context.save()
        }
    }

    public func hasWorkoutLog(healthkitUuid targetUuid: String) throws -> Bool {
        var descriptor = FetchDescriptor<WorkoutLogRecord>(predicate: #Predicate { $0.healthkitUuid == targetUuid })
        descriptor.fetchLimit = 1
        return try context.fetch(descriptor).first != nil
    }

    // MARK: - Exercise library

    public func fetchExercises() throws -> [ExerciseRecord] {
        let descriptor = FetchDescriptor<ExerciseRecord>(sortBy: [SortDescriptor(\.name)])
        return try context.fetch(descriptor)
    }

    public func saveExercises(_ exercises: [ExerciseRecord]) throws {
        for exercise in exercises {
            context.insert(exercise)
        }
        try context.save()
    }

    public func deleteExercise(id targetId: String) throws {
        var descriptor = FetchDescriptor<ExerciseRecord>(predicate: #Predicate { $0.id == targetId })
        descriptor.fetchLimit = 1
        if let exercise = try context.fetch(descriptor).first {
            context.delete(exercise)
            try context.save()
        }
    }

    public func seedDefaultExercisesIfNeeded(_ seed: [ExerciseRecord], version: Int, currentVersionKey: String = "exercise_data_version") throws {
        let storedVersion = UserDefaults.standard.integer(forKey: currentVersionKey)
        guard storedVersion < version else { return }
        for exercise in seed {
            context.insert(exercise)
        }
        try context.save()
        UserDefaults.standard.set(version, forKey: currentVersionKey)
    }

    // MARK: - Body measurements

    public func latestBodyWeight() throws -> Double? {
        var descriptor = FetchDescriptor<BodyMeasurementRecord>(sortBy: [SortDescriptor(\.date, order: .reverse)])
        descriptor.fetchLimit = 1
        return try context.fetch(descriptor).first?.weight
    }

    public func bodyWeightHistory(since startDate: Date? = nil) throws -> [BodyMeasurementRecord] {
        var descriptor: FetchDescriptor<BodyMeasurementRecord>
        if let startDate {
            descriptor = FetchDescriptor<BodyMeasurementRecord>(predicate: #Predicate { $0.date >= startDate })
        } else {
            descriptor = FetchDescriptor<BodyMeasurementRecord>()
        }
        descriptor.sortBy = [SortDescriptor(\.date)]
        return try context.fetch(descriptor)
    }

    public func saveBodyWeight(_ weight: Double, date: Date = .now) throws {
        context.insert(BodyMeasurementRecord(weight: weight, date: date))
        try context.save()
    }

    // MARK: - Progress pictures

    public func fetchProgressPictures() throws -> [ProgressPictureRecord] {
        let descriptor = FetchDescriptor<ProgressPictureRecord>(sortBy: [SortDescriptor(\.date, order: .reverse)])
        return try context.fetch(descriptor)
    }

    public func saveProgressPicture(_ picture: ProgressPictureRecord) throws {
        context.insert(picture)
        try context.save()
    }

    public func deleteProgressPicture(id targetId: String) throws {
        var descriptor = FetchDescriptor<ProgressPictureRecord>(predicate: #Predicate { $0.id == targetId })
        descriptor.fetchLimit = 1
        if let picture = try context.fetch(descriptor).first {
            context.delete(picture)
            try context.save()
        }
    }

    // MARK: - Bulk

    public func clearAllLocalData(preservingExerciseIds: Set<String>) throws {
        for workout in try context.fetch(FetchDescriptor<WorkoutRecord>()) { context.delete(workout) }
        for log in try context.fetch(FetchDescriptor<WorkoutLogRecord>()) { context.delete(log) }
        for measurement in try context.fetch(FetchDescriptor<BodyMeasurementRecord>()) { context.delete(measurement) }
        for picture in try context.fetch(FetchDescriptor<ProgressPictureRecord>()) { context.delete(picture) }
        for exercise in try context.fetch(FetchDescriptor<ExerciseRecord>()) where !preservingExerciseIds.contains(exercise.id) {
            context.delete(exercise)
        }
        try context.save()
    }
}
