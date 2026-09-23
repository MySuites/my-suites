import Foundation

// Parses the RN app's "Export Data" JSON (apps/myhealth/utils/exportUserData.ts)
// for Settings > Import Data, as a fallback when the file isn't already in
// this app's own UserDataExport shape (see WorkoutRepository.importUserData).
//
// This is a *different* migration path than LegacyImportService, which reads
// the RN app's SQLite database directly on first launch after an in-place
// update. This one handles a JSON file the user picked by hand - e.g.
// exported on one device and imported on another, or kept around from before
// the in-place update ran. Ground truth for the shapes below is the same as
// LegacyImportService: apps/myhealth/utils/db/database.ts's columns (most
// fields are that row spread verbatim into JSON, plus a few camelCase
// duplicates DataRepository.tsx's read paths add - see each type's fields).
//
// The RN app never validated numeric text fields on saved workout templates
// (never-logged, so never coerced to numbers either), so those specific
// fields can show up as JSON strings ("25") as often as numbers - see
// FlexibleInt/FlexibleDouble. Everything that has actually been logged
// (workoutHistory, bodyWeightHistory) is consistently numeric.
public enum LegacyJSONImport {
    // Public (and its 4 count-relevant properties below) so SettingsView,
    // in the MyHealth app target, can preview counts before the user
    // confirms an import - see its handleImportPick. Everything else in
    // this file stays internal; only WorkoutRepository (same module) needs
    // the conversion details.
    public struct Bundle: Decodable {
        public var savedWorkouts: [LegacyWorkout]
        public var workoutHistory: [LegacyHistoryLog]
        public var exercises: [LegacyExercise]
        public var bodyWeightHistory: [LegacyBodyWeight]
        // progressPictures intentionally not imported here either - same as
        // WorkoutRepository's own UserDataExport, the picture file itself
        // isn't portable across app sandboxes.

        func toUserDataExport() -> WorkoutRepository.UserDataExport {
            WorkoutRepository.UserDataExport(
                savedWorkouts: savedWorkouts.map(\.asDTO),
                workoutHistory: workoutHistory.map(\.asDTO),
                exercises: exercises.map(\.asDTO),
                bodyWeightHistory: bodyWeightHistory.map(\.asDTO),
                progressPictures: [],
                exportedAt: .now
            )
        }
    }

    // MARK: - Saved workouts (templates)

    public struct LegacyWorkout: Decodable {
        var id: String
        var name: String
        var exercises: [LegacyWorkoutExercise]
        var created_at: String?
        var createdAt: String?

        var asDTO: WorkoutRecord.ExportDTO {
            WorkoutRecord.ExportDTO(
                id: id,
                name: name,
                exercises: exercises.map(\.asTemplate),
                createdAt: LegacyImportService.parseDate(createdAt ?? created_at) ?? .now
            )
        }
    }

    struct LegacyWorkoutExercise: Decodable {
        var id: String?
        var name: String?
        var sets: Int?
        var reps: FlexibleInt?
        var properties: [String]?
        var setTargets: [LegacyWorkoutSetTarget]?
        var restTime: Int?
        var equipment: String?
        var attachment: String?
        var movementType: String?

        var asTemplate: WorkoutExerciseTemplate {
            WorkoutExerciseTemplate(
                id: id ?? UUID().uuidString,
                name: name ?? "Exercise",
                sets: sets ?? 1,
                reps: reps?.value ?? 1,
                properties: properties ?? [],
                setTargets: (setTargets ?? []).map(\.asSetTarget),
                restTime: restTime,
                equipment: equipment,
                attachment: attachment,
                movementType: movementType
            )
        }
    }

    struct LegacyWorkoutSetTarget: Decodable {
        var weight: FlexibleDouble?
        var reps: FlexibleInt?
        var reps_left: FlexibleInt?
        var reps_right: FlexibleInt?
        var duration: FlexibleInt?
        var distance: FlexibleDouble?
        var rpe: FlexibleDouble?

        var asSetTarget: SetTarget {
            SetTarget(
                weight: weight?.value,
                reps: reps?.value,
                repsLeft: reps_left?.value,
                repsRight: reps_right?.value,
                duration: duration?.value,
                distance: distance?.value,
                rpe: rpe?.value
            )
        }
    }

    // MARK: - Workout history (performed logs)

    public struct LegacyHistoryLog: Decodable {
        var id: String
        var date: String?
        var workoutDate: String?
        var name: String?
        var workoutName: String?
        var duration: Int?
        var note: String?
        var notes: String?
        var exercises: [LegacyHistoryExercise]?
        var avgHeartRate: Double?
        var maxHeartRate: Double?
        var calories: Double?
        var distance: Double?

        var asDTO: WorkoutLogRecord.ExportDTO {
            let sets: [SetLogRecord.ExportDTO] = (exercises ?? []).flatMap { ex in
                (ex.logs ?? []).map { $0.asDTO(exerciseId: ex.id ?? "unknown", exerciseName: ex.name ?? "Unknown Exercise") }
            }
            return WorkoutLogRecord.ExportDTO(
                id: id,
                workoutDate: LegacyImportService.parseDate(workoutDate ?? date) ?? .now,
                workoutName: workoutName ?? name ?? "Workout",
                duration: duration ?? 0,
                note: note ?? notes,
                sets: sets,
                avgHeartRate: avgHeartRate,
                maxHeartRate: maxHeartRate,
                calories: calories,
                distance: distance
            )
        }
    }

    struct LegacyHistoryExercise: Decodable {
        var id: String?
        var name: String?
        var logs: [LegacySetLog]?
    }

    struct LegacySetLog: Decodable {
        var weight: Double?
        var reps: Int?
        var reps_left: Int?
        var reps_right: Int?
        var distance: Double?
        var duration: Int?
        var rpe: Double?

        func asDTO(exerciseId: String, exerciseName: String) -> SetLogRecord.ExportDTO {
            SetLogRecord.ExportDTO(
                exerciseId: exerciseId,
                exerciseName: exerciseName,
                weight: weight,
                reps: reps,
                repsLeft: reps_left,
                repsRight: reps_right,
                distance: distance,
                duration: duration,
                rpe: rpe
            )
        }
    }

    // MARK: - Exercise library

    public struct LegacyExercise: Decodable {
        var id: String
        var name: String
        var muscle_groups: [String]?
        var properties: [String]?
        var description: String?
        var instructions: [String]?

        var asDTO: ExerciseRecord.ExportDTO {
            ExerciseRecord.ExportDTO(
                id: id,
                name: name,
                muscleGroups: muscle_groups ?? [],
                properties: properties ?? [],
                description: description,
                instructions: instructions ?? []
            )
        }
    }

    // MARK: - Body weight history

    public struct LegacyBodyWeight: Decodable {
        var weight: Double
        var date: String

        var asDTO: BodyMeasurementRecord.ExportDTO {
            BodyMeasurementRecord.ExportDTO(weight: weight, date: LegacyImportService.parseDate(date) ?? .now)
        }
    }

    // MARK: - Flexible numeric decoding

    // Saved-workout templates are edited via free-text fields and never
    // coerced to numbers until actually logged, so their JSON can hold
    // "25" as easily as 25. Everything else in this file is decoded with
    // plain Int?/Double? because the exporter's other tables are always
    // properly typed.
    struct FlexibleInt: Decodable {
        let value: Int?
        init(from decoder: Decoder) throws {
            let container = try decoder.singleValueContainer()
            if container.decodeNil() { value = nil; return }
            if let i = try? container.decode(Int.self) { value = i; return }
            if let d = try? container.decode(Double.self) { value = Int(d); return }
            if let s = try? container.decode(String.self) { value = Int(s) ?? Double(s).map { Int($0) }; return }
            value = nil
        }
    }

    struct FlexibleDouble: Decodable {
        let value: Double?
        init(from decoder: Decoder) throws {
            let container = try decoder.singleValueContainer()
            if container.decodeNil() { value = nil; return }
            if let d = try? container.decode(Double.self) { value = d; return }
            if let s = try? container.decode(String.self) { value = Double(s); return }
            value = nil
        }
    }
}
