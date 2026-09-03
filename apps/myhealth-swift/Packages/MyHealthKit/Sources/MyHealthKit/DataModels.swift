import Foundation
import SwiftData

// SwiftData models for the local-only data layer, ported from the schema in
// apps/myhealth/utils/db/database.ts — see SWIFT_MIGRATION_PLAN.md
// "Frozen Data Schema" for the full column-by-column source. `sync_status`
// and the old backend-sync semantics are dropped (see "Current Sync & Auth
// Behavior" in the plan — sync was already dead code). Soft-delete
// (`deletedAt`) is kept as an option for undo UX but is not yet wired into
// any UI — Phase 2/3 work.
//
// This is a first-pass scaffold: `exercises`/`equipment`/`attachment`
// free-form JSON-or-plain-string quirks from the RN schema are normalized
// away here rather than replicated (per the plan's recommendation), and the
// `workouts.exercises` JSON blob becomes a real relationship
// (WorkoutRecord.exerciseTemplates) instead of a serialized column.

@Model
public final class ExerciseRecord {
    @Attribute(.unique) public var id: String
    public var name: String
    public var muscleGroups: [String]
    public var properties: [String] // e.g. "Weighted", "Bodyweight", "Location" — see isOutdoorGpsExercise
    public var exerciseDescription: String?
    public var progressionId: String?
    public var difficulty: Double?
    public var isActiveProgression: Bool
    public var nextVariations: [String]
    public var tips: [String]
    public var instructions: [String]
    public var equipment: String?
    public var movementType: String? // "unilateral" | "uniform"
    public var attachment: String?
    public var createdAt: Date
    public var updatedAt: Date
    public var deletedAt: Date?

    public init(
        id: String,
        name: String,
        muscleGroups: [String] = [],
        properties: [String] = [],
        exerciseDescription: String? = nil,
        progressionId: String? = nil,
        difficulty: Double? = nil,
        isActiveProgression: Bool = false,
        nextVariations: [String] = [],
        tips: [String] = [],
        instructions: [String] = [],
        equipment: String? = nil,
        movementType: String? = nil,
        attachment: String? = nil,
        createdAt: Date = .now,
        updatedAt: Date = .now,
        deletedAt: Date? = nil
    ) {
        self.id = id
        self.name = name
        self.muscleGroups = muscleGroups
        self.properties = properties
        self.exerciseDescription = exerciseDescription
        self.progressionId = progressionId
        self.difficulty = difficulty
        self.isActiveProgression = isActiveProgression
        self.nextVariations = nextVariations
        self.tips = tips
        self.instructions = instructions
        self.equipment = equipment
        self.movementType = movementType
        self.attachment = attachment
        self.createdAt = createdAt
        self.updatedAt = updatedAt
        self.deletedAt = deletedAt
    }
}

@Model
public final class WorkoutRecord {
    @Attribute(.unique) public var id: String
    public var name: String
    public var sortOrder: Int?
    public var createdAt: Date
    public var updatedAt: Date
    public var deletedAt: Date?

    public init(
        id: String = UUID().uuidString,
        name: String,
        sortOrder: Int? = nil,
        createdAt: Date = .now,
        updatedAt: Date = .now,
        deletedAt: Date? = nil
    ) {
        self.id = id
        self.name = name
        self.sortOrder = sortOrder
        self.createdAt = createdAt
        self.updatedAt = updatedAt
        self.deletedAt = deletedAt
    }
}

@Model
public final class WorkoutLogRecord {
    @Attribute(.unique) public var id: String
    public var workoutDate: Date
    public var workoutName: String
    public var duration: Int // seconds
    public var note: String?
    public var createdAt: Date
    public var imageUrls: [String]

    // HealthKit / GPS metrics
    public var healthkitUuid: String? // dedupe key for HealthKit-imported (Apple Watch) workouts
    public var avgHeartRate: Double?
    public var maxHeartRate: Double?
    public var calories: Double?
    public var distance: Double?
    public var elevationGain: Double?
    public var route: [RoutePoint]?
    public var metricsSource: String? // "healthkit" | "gps"

    @Relationship(deleteRule: .cascade, inverse: \SetLogRecord.workoutLog)
    public var sets: [SetLogRecord] = []

    public init(
        id: String = UUID().uuidString,
        workoutDate: Date = .now,
        workoutName: String,
        duration: Int = 0,
        note: String? = nil,
        createdAt: Date = .now,
        imageUrls: [String] = [],
        healthkitUuid: String? = nil,
        avgHeartRate: Double? = nil,
        maxHeartRate: Double? = nil,
        calories: Double? = nil,
        distance: Double? = nil,
        elevationGain: Double? = nil,
        route: [RoutePoint]? = nil,
        metricsSource: String? = nil
    ) {
        self.id = id
        self.workoutDate = workoutDate
        self.workoutName = workoutName
        self.duration = duration
        self.note = note
        self.createdAt = createdAt
        self.imageUrls = imageUrls
        self.healthkitUuid = healthkitUuid
        self.avgHeartRate = avgHeartRate
        self.maxHeartRate = maxHeartRate
        self.calories = calories
        self.distance = distance
        self.elevationGain = elevationGain
        self.route = route
        self.metricsSource = metricsSource
    }
}

public struct RoutePoint: Codable, Hashable {
    public var latitude: Double
    public var longitude: Double
    public var timestamp: Date

    public init(latitude: Double, longitude: Double, timestamp: Date) {
        self.latitude = latitude
        self.longitude = longitude
        self.timestamp = timestamp
    }
}

@Model
public final class SetLogRecord {
    @Attribute(.unique) public var id: String
    public var exerciseId: String
    public var exerciseName: String // denormalized snapshot
    public var weight: Double? // lb, canonical unit
    public var reps: Int?
    public var repsLeft: Int?
    public var repsRight: Int?
    public var distance: Double?
    public var duration: Int? // seconds
    public var bodyweight: Double? // effective bodyweight baseline for this set — see WorkoutLogic.effectiveSetWeight
    public var rpe: Double?
    public var equipment: String?
    public var attachment: String?
    public var createdAt: Date

    public var workoutLog: WorkoutLogRecord?

    public init(
        id: String = UUID().uuidString,
        exerciseId: String,
        exerciseName: String,
        weight: Double? = nil,
        reps: Int? = nil,
        repsLeft: Int? = nil,
        repsRight: Int? = nil,
        distance: Double? = nil,
        duration: Int? = nil,
        bodyweight: Double? = nil,
        rpe: Double? = nil,
        equipment: String? = nil,
        attachment: String? = nil,
        createdAt: Date = .now
    ) {
        self.id = id
        self.exerciseId = exerciseId
        self.exerciseName = exerciseName
        self.weight = weight
        self.reps = reps
        self.repsLeft = repsLeft
        self.repsRight = repsRight
        self.distance = distance
        self.duration = duration
        self.bodyweight = bodyweight
        self.rpe = rpe
        self.equipment = equipment
        self.attachment = attachment
        self.createdAt = createdAt
    }
}

@Model
public final class BodyMeasurementRecord {
    @Attribute(.unique) public var id: String
    public var weight: Double
    public var date: Date
    public var createdAt: Date
    public var updatedAt: Date

    public init(
        id: String = UUID().uuidString,
        weight: Double,
        date: Date = .now,
        createdAt: Date = .now,
        updatedAt: Date = .now
    ) {
        self.id = id
        self.weight = weight
        self.date = date
        self.createdAt = createdAt
        self.updatedAt = updatedAt
    }
}

@Model
public final class ProgressPictureRecord {
    @Attribute(.unique) public var id: String
    public var imageUri: String
    public var date: Date
    public var notes: String
    public var primaryMuscles: [String]?
    public var secondaryMuscles: [String]?
    public var muscleGroupConfidence: Double?
    public var muscleGroupSource: String? // "local" | "cloud"
    public var createdAt: Date
    public var updatedAt: Date

    public init(
        id: String = UUID().uuidString,
        imageUri: String,
        date: Date = .now,
        notes: String = "",
        primaryMuscles: [String]? = nil,
        secondaryMuscles: [String]? = nil,
        muscleGroupConfidence: Double? = nil,
        muscleGroupSource: String? = nil,
        createdAt: Date = .now,
        updatedAt: Date = .now
    ) {
        self.id = id
        self.imageUri = imageUri
        self.date = date
        self.notes = notes
        self.primaryMuscles = primaryMuscles
        self.secondaryMuscles = secondaryMuscles
        self.muscleGroupConfidence = muscleGroupConfidence
        self.muscleGroupSource = muscleGroupSource
        self.createdAt = createdAt
        self.updatedAt = updatedAt
    }
}

public enum MyHealthSchema {
    public static var models: [any PersistentModel.Type] {
        [
            ExerciseRecord.self,
            WorkoutRecord.self,
            WorkoutLogRecord.self,
            SetLogRecord.self,
            BodyMeasurementRecord.self,
            ProgressPictureRecord.self,
        ]
    }
}
