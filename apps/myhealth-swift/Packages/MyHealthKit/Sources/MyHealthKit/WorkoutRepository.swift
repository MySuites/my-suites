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

    private func fetchWorkoutLog(id targetId: String) throws -> WorkoutLogRecord? {
        var descriptor = FetchDescriptor<WorkoutLogRecord>(predicate: #Predicate { $0.id == targetId })
        descriptor.fetchLimit = 1
        return try context.fetch(descriptor).first
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

    // MARK: - Export (ported from apps/myhealth/utils/exportUserData.ts)

    public struct UserDataExport: Codable {
        public var savedWorkouts: [WorkoutRecord.ExportDTO]
        public var workoutHistory: [WorkoutLogRecord.ExportDTO]
        public var exercises: [ExerciseRecord.ExportDTO]
        public var bodyWeightHistory: [BodyMeasurementRecord.ExportDTO]
        public var progressPictures: [ProgressPictureRecord.ExportDTO]
        public var exportedAt: Date
    }

    public func exportUserData() throws -> Data {
        let export = UserDataExport(
            savedWorkouts: try fetchWorkouts().map(\.exportDTO),
            workoutHistory: try fetchHistory().map(\.exportDTO),
            exercises: try fetchExercises().map(\.exportDTO),
            bodyWeightHistory: try bodyWeightHistory().map(\.exportDTO),
            progressPictures: try fetchProgressPictures().map(\.exportDTO),
            exportedAt: .now
        )
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        encoder.dateEncodingStrategy = .iso8601
        return try encoder.encode(export)
    }

    // MARK: - Import (counterpart to exportUserData; ported from
    // apps/myhealth/utils/importUserData.ts + the DataRepository bulk-save
    // methods it drives)

    public struct ImportSummary {
        public var savedWorkouts: Int
        public var workoutHistory: Int
        public var exercises: Int
        public var bodyWeightHistory: Int
    }

    public enum ImportError: LocalizedError {
        case invalidFormat

        public var errorDescription: String? {
            switch self {
            case .invalidFormat: return "File is not a valid MyHealth data export"
            }
        }
    }

    // Progress pictures aren't restorable from this file - the export DTO
    // deliberately omits the image (only date/notes/muscle metadata), since
    // the actual photo lives on-device and was never serialized. Everything
    // else upserts by id: an existing row with the same id is overwritten,
    // matching the RN version's INSERT OR REPLACE semantics.
    @discardableResult
    public func importUserData(_ data: Data) throws -> ImportSummary {
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        let export: UserDataExport
        if let native = try? decoder.decode(UserDataExport.self, from: data) {
            export = native
        } else if let legacy = try? JSONDecoder().decode(LegacyJSONImport.Bundle.self, from: data) {
            // Same top-level key names as this app's own export (both trace
            // back to the same original RN schema), so the native decode
            // above is what actually distinguishes the two: it fails on the
            // RN shape's mismatched field names/types (snake_case reps_left,
            // string-typed template reps, etc.) and falls through to here.
            export = legacy.toUserDataExport()
        } else {
            throw ImportError.invalidFormat
        }

        for dto in export.savedWorkouts {
            if let existing = try fetchWorkout(id: dto.id) {
                existing.name = dto.name
                existing.exercises = dto.exercises
                existing.updatedAt = .now
            } else {
                context.insert(WorkoutRecord(id: dto.id, name: dto.name, exercises: dto.exercises, createdAt: dto.createdAt))
            }
        }

        for dto in export.workoutHistory {
            // Sets are a cascade-deleted relationship, not addressable by id
            // individually here, so replace the whole log rather than diffing sets.
            if let existing = try fetchWorkoutLog(id: dto.id) {
                context.delete(existing)
            }
            let log = WorkoutLogRecord(
                id: dto.id,
                workoutDate: dto.workoutDate,
                workoutName: dto.workoutName,
                duration: dto.duration,
                note: dto.note,
                avgHeartRate: dto.avgHeartRate,
                maxHeartRate: dto.maxHeartRate,
                calories: dto.calories,
                distance: dto.distance
            )
            context.insert(log)
            for setDTO in dto.sets {
                let set = SetLogRecord(
                    exerciseId: setDTO.exerciseId,
                    exerciseName: setDTO.exerciseName,
                    weight: setDTO.weight,
                    reps: setDTO.reps,
                    repsLeft: setDTO.repsLeft,
                    repsRight: setDTO.repsRight,
                    distance: setDTO.distance,
                    duration: setDTO.duration,
                    rpe: setDTO.rpe
                )
                set.workoutLog = log
                context.insert(set)
            }
        }

        for dto in export.exercises {
            // id is @Attribute(.unique) - inserting a duplicate merges into
            // the existing row instead of creating a second one.
            context.insert(ExerciseRecord(
                id: dto.id,
                name: dto.name,
                muscleGroups: dto.muscleGroups,
                properties: dto.properties,
                exerciseDescription: dto.description,
                instructions: dto.instructions
            ))
        }

        for dto in export.bodyWeightHistory {
            context.insert(BodyMeasurementRecord(weight: dto.weight, date: dto.date))
        }

        try context.save()

        return ImportSummary(
            savedWorkouts: export.savedWorkouts.count,
            workoutHistory: export.workoutHistory.count,
            exercises: export.exercises.count,
            bodyWeightHistory: export.bodyWeightHistory.count
        )
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
