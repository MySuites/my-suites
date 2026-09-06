import Foundation
import SQLite3
import SwiftData

// One-time importer: reads the RN app's expo-sqlite database
// (<Documents>/SQLite/myhealth.db) into the new SwiftData store. The new
// app ships under the same bundle id (com.mysuite.myhealth) as an in-place
// update over the RN app (see SWIFT_MIGRATION_PLAN.md's branch strategy),
// so the container — and this file — persists across the cutover; this
// just needs to run once on first launch after that update.
//
// Ground truth for the schema and its quirks is
// apps/myhealth/utils/db/database.ts (actual CREATE TABLE statements) and
// the read-mapping logic in providers/DataRepository.tsx (equipment/
// attachment's JSON-or-plain-string quirk, image_url's single-or-array
// quirk, etc — see the plan's "Frozen Data Schema" section). `sync_status`
// and `profiles` are dropped per that plan; soft-deleted rows
// (`deleted_at IS NOT NULL`) are skipped, matching every RN read path.
@MainActor
public enum LegacyImportService {
    private static let importedFlagKey = "legacy_sqlite_import_completed_v1"

    public static var hasImported: Bool {
        UserDefaults.standard.bool(forKey: importedFlagKey)
    }

    /// Best-effort and idempotent — safe to call on every launch. Returns
    /// `true` only if it actually imported rows. Leaves the completed flag
    /// unset on failure (open/read error, or save failure) so it retries on
    /// the next launch instead of silently giving up forever.
    @discardableResult
    public static func importIfNeeded(context: ModelContext) -> Bool {
        guard !hasImported else { return false }
        guard let path = legacyDatabasePath, FileManager.default.fileExists(atPath: path) else {
            // No legacy DB in this container — fresh install, not an
            // in-place update. Nothing to do, and nothing to retry either.
            UserDefaults.standard.set(true, forKey: importedFlagKey)
            return false
        }

        var db: OpaquePointer?
        guard sqlite3_open_v2(path, &db, SQLITE_OPEN_READONLY, nil) == SQLITE_OK, let db else {
            return false
        }
        defer { sqlite3_close(db) }

        let exerciseRows = readExercises(db)
        let workoutRows = readWorkouts(db)
        let logRows = readWorkoutLogs(db)
        // Must run before readSetLogs: the bodyweight-flag fallback there
        // reads `latestKnownBodyWeight`, populated by this pass.
        let bodyWeightRows = readBodyMeasurements(db)
        let setLogsByLogId = readSetLogs(db)
        let pictureRows = readProgressPictures(db)

        guard !(exerciseRows.isEmpty && workoutRows.isEmpty && logRows.isEmpty
            && bodyWeightRows.isEmpty && pictureRows.isEmpty) else {
            UserDefaults.standard.set(true, forKey: importedFlagKey)
            return false
        }

        for exercise in exerciseRows { context.insert(exercise) }
        for workout in workoutRows { context.insert(workout) }
        for measurement in bodyWeightRows { context.insert(measurement) }
        for picture in pictureRows { context.insert(picture) }
        for log in logRows {
            context.insert(log)
            for set in setLogsByLogId[log.id] ?? [] {
                set.workoutLog = log
                context.insert(set)
            }
        }

        do {
            try context.save()
            UserDefaults.standard.set(true, forKey: importedFlagKey)
            return true
        } catch {
            return false
        }
    }

    private static var legacyDatabasePath: String? {
        FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first?
            .appendingPathComponent("SQLite/myhealth.db").path
    }

    // MARK: - Exercises

    private static func readExercises(_ db: OpaquePointer) -> [ExerciseRecord] {
        let sql = """
            SELECT id, name, muscle_groups, properties, description, progression_id, difficulty,
                   is_active_progression, next_variations, tips, instructions, equipment,
                   movement_type, attachment, created_at, updated_at
            FROM exercises WHERE deleted_at IS NULL
            """
        var results: [ExerciseRecord] = []
        forEachRow(db, sql) { stmt in
            guard let id = string(stmt, 0), let name = string(stmt, 1) else { return }
            results.append(ExerciseRecord(
                id: id,
                name: name,
                muscleGroups: jsonStringArray(string(stmt, 2)),
                properties: (string(stmt, 3) ?? "").split(separator: ",").map { $0.trimmingCharacters(in: .whitespaces) }.filter { !$0.isEmpty },
                exerciseDescription: string(stmt, 4),
                progressionId: string(stmt, 5),
                difficulty: double(stmt, 6),
                isActiveProgression: int(stmt, 7) == 1,
                nextVariations: jsonStringArray(string(stmt, 8)),
                tips: jsonStringArray(string(stmt, 9)),
                instructions: jsonStringArray(string(stmt, 10)),
                equipment: normalizedLegacyString(string(stmt, 11)),
                movementType: string(stmt, 12),
                attachment: normalizedLegacyString(string(stmt, 13)),
                createdAt: parseDate(string(stmt, 14)) ?? .now,
                updatedAt: epochMs(int(stmt, 15)) ?? .now
            ))
        }
        return results
    }

    // MARK: - Workouts (templates)

    private static func readWorkouts(_ db: OpaquePointer) -> [WorkoutRecord] {
        let sql = "SELECT id, name, exercises, created_at, updated_at, sort_order FROM workouts WHERE deleted_at IS NULL"
        var results: [WorkoutRecord] = []
        forEachRow(db, sql) { stmt in
            guard let id = string(stmt, 0) else { return }
            let exercises = decodeExerciseTemplates(string(stmt, 2))
            results.append(WorkoutRecord(
                id: id,
                name: string(stmt, 1) ?? "",
                exercises: exercises,
                sortOrder: int(stmt, 5),
                createdAt: parseDate(string(stmt, 3)) ?? .now,
                updatedAt: epochMs(int(stmt, 4)) ?? .now
            ))
        }
        return results
    }

    // The `workouts.exercises` JSON blob — an array of RN `Exercise` objects
    // (utils/workout-logic.ts). Field names there are camelCase except
    // setTargets' `reps_left`/`reps_right`, which stay snake_case — hence
    // `.convertFromSnakeCase` below (harmless no-op on the pure-camelCase
    // fields, since it only rewrites keys that actually contain `_`).
    private static func decodeExerciseTemplates(_ json: String?) -> [WorkoutExerciseTemplate] {
        guard let json, let data = json.data(using: .utf8) else { return [] }
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        guard let legacy = try? decoder.decode([LegacyExerciseJSON].self, from: data) else { return [] }
        return legacy.map { $0.asTemplate }
    }

    // MARK: - Workout logs (history)

    private static func readWorkoutLogs(_ db: OpaquePointer) -> [WorkoutLogRecord] {
        let sql = """
            SELECT id, workout_date, workout_name, duration, note, created_at, image_url,
                   healthkit_uuid, avg_heart_rate, max_heart_rate, calories, distance,
                   elevation_gain, route, metrics_source
            FROM workout_logs WHERE deleted_at IS NULL
            """
        var results: [WorkoutLogRecord] = []
        forEachRow(db, sql) { stmt in
            guard let id = string(stmt, 0) else { return }
            results.append(WorkoutLogRecord(
                id: id,
                workoutDate: parseDate(string(stmt, 1)) ?? .now,
                workoutName: string(stmt, 2) ?? "Workout",
                duration: int(stmt, 3) ?? 0,
                note: string(stmt, 4),
                createdAt: parseDate(string(stmt, 5)) ?? .now,
                imageUrls: legacyImageUrls(string(stmt, 6)),
                healthkitUuid: string(stmt, 7),
                avgHeartRate: double(stmt, 8),
                maxHeartRate: double(stmt, 9),
                calories: double(stmt, 10),
                distance: double(stmt, 11),
                elevationGain: double(stmt, 12),
                route: legacyRoute(string(stmt, 13)),
                metricsSource: string(stmt, 14)
            ))
        }
        return results
    }

    // image_url is either a plain URI string or a JSON-array-encoded string
    // of URIs (see DataRepository.tsx's getHistory) — never JSON-decode
    // blindly without the `[` sniff, or a plain URI string starting with a
    // rogue `[` character would be misparsed (won't happen in practice, but
    // matches the RN guard exactly).
    private static func legacyImageUrls(_ raw: String?) -> [String] {
        guard let raw, !raw.isEmpty else { return [] }
        if raw.hasPrefix("["), let data = raw.data(using: .utf8),
           let parsed = try? JSONDecoder().decode([String].self, from: data) {
            return parsed
        }
        return [raw]
    }

    private struct LegacyRoutePoint: Decodable {
        let latitude: Double
        let longitude: Double
        let timestamp: Double // epoch ms, per RN's Date.now()-based route capture
    }

    private static func legacyRoute(_ raw: String?) -> [RoutePoint]? {
        guard let raw, let data = raw.data(using: .utf8),
              let points = try? JSONDecoder().decode([LegacyRoutePoint].self, from: data) else { return nil }
        return points.map { RoutePoint(latitude: $0.latitude, longitude: $0.longitude, timestamp: Date(timeIntervalSince1970: $0.timestamp / 1000)) }
    }

    // MARK: - Set logs

    private static func readSetLogs(_ db: OpaquePointer) -> [String: [SetLogRecord]] {
        let sql = """
            SELECT id, workout_log_id, exercise_id, exercise_name, weight, reps, reps_left,
                   reps_right, distance, duration, bodyweight, rpe, equipment, attachment, created_at
            FROM set_logs
            """
        var byLogId: [String: [SetLogRecord]] = [:]
        forEachRow(db, sql) { stmt in
            guard let id = string(stmt, 0), let logId = string(stmt, 1) else { return }
            let record = SetLogRecord(
                id: id,
                exerciseId: string(stmt, 2) ?? "unknown",
                exerciseName: string(stmt, 3) ?? "Unknown Exercise",
                weight: double(stmt, 4),
                reps: int(stmt, 5),
                repsLeft: int(stmt, 6),
                repsRight: int(stmt, 7),
                distance: double(stmt, 8),
                duration: int(stmt, 9),
                // `bodyweight` in set_logs is a 0/1 flag, not the baseline
                // value itself (see the plan's "Known data quirks") — the
                // actual number has to be derived, same as
                // ActiveWorkoutStore.finishWorkout does at log time. Best
                // effort here: the single latest known bodyweight, since
                // the historical per-date value isn't recoverable from this
                // table alone.
                bodyweight: bool(stmt, 10) ? effectiveBodyweightLoad(exerciseId: string(stmt, 2), latestBodyWeight: latestKnownBodyWeight) : nil,
                rpe: double(stmt, 11),
                equipment: normalizedLegacyString(string(stmt, 12)),
                attachment: normalizedLegacyString(string(stmt, 13)),
                createdAt: parseDate(string(stmt, 14)) ?? .now
            )
            byLogId[logId, default: []].append(record)
        }
        return byLogId
    }

    // Read once and cached for the bodyweight-flag fallback above — this
    // importer runs before any ModelContext body-weight rows exist, so it
    // has to go straight to the legacy `body_measurements` table itself.
    private static var latestKnownBodyWeight: Double?

    // MARK: - Body measurements

    private static func readBodyMeasurements(_ db: OpaquePointer) -> [BodyMeasurementRecord] {
        let sql = "SELECT id, weight, date, created_at, updated_at FROM body_measurements ORDER BY date ASC"
        var results: [BodyMeasurementRecord] = []
        forEachRow(db, sql) { stmt in
            guard let id = string(stmt, 0), let weight = double(stmt, 1) else { return }
            let date = parseDate(string(stmt, 2)) ?? .now
            results.append(BodyMeasurementRecord(
                id: id,
                weight: weight,
                date: date,
                createdAt: parseDate(string(stmt, 3)) ?? .now,
                updatedAt: epochMs(int(stmt, 4)) ?? .now
            ))
            latestKnownBodyWeight = weight
        }
        return results
    }

    // MARK: - Progress pictures

    private static func readProgressPictures(_ db: OpaquePointer) -> [ProgressPictureRecord] {
        let sql = "SELECT id, image_uri, date, notes, muscle_groups, created_at, updated_at FROM progress_pictures"
        var results: [ProgressPictureRecord] = []
        forEachRow(db, sql) { stmt in
            guard let id = string(stmt, 0), let imageUri = string(stmt, 1) else { return }
            let muscleGroups = legacyMuscleGroups(string(stmt, 4))
            results.append(ProgressPictureRecord(
                id: id,
                imageUri: resolvedImageUri(imageUri),
                date: parseDate(string(stmt, 2)) ?? .now,
                notes: string(stmt, 3) ?? "",
                primaryMuscles: muscleGroups?.primaryMuscles,
                secondaryMuscles: muscleGroups?.secondaryMuscles,
                muscleGroupConfidence: muscleGroups?.confidence,
                muscleGroupSource: muscleGroups?.source,
                createdAt: parseDate(string(stmt, 5)) ?? .now,
                updatedAt: epochMs(int(stmt, 6)) ?? .now
            ))
        }
        return results
    }

    private struct LegacyMuscleGroups: Decodable {
        let primaryMuscles: [String]?
        let secondaryMuscles: [String]?
        let confidence: Double?
        let source: String?
    }

    private static func legacyMuscleGroups(_ raw: String?) -> LegacyMuscleGroups? {
        guard let raw, let data = raw.data(using: .utf8) else { return nil }
        return try? JSONDecoder().decode(LegacyMuscleGroups.self, from: data)
    }

    // progress_pictures.image_uri is an absolute path under the RN app's own
    // Documents directory. Same bundle id + in-place update means the
    // container (and this absolute path) is normally still valid; this
    // falls back to resolving by filename under the new container's own
    // progress_pictures/ folder if the recorded path doesn't resolve
    // (e.g. testing via a fresh reinstall rather than a real update).
    private static func resolvedImageUri(_ raw: String) -> String {
        if FileManager.default.fileExists(atPath: raw) { return raw }
        guard let filename = raw.split(separator: "/").last,
              let documents = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first
        else { return raw }
        let candidate = documents.appendingPathComponent("progress_pictures").appendingPathComponent(String(filename))
        return FileManager.default.fileExists(atPath: candidate.path) ? candidate.absoluteString : raw
    }

    // MARK: - Shared JSON/string helpers

    private static func jsonStringArray(_ raw: String?) -> [String] {
        guard let raw, let data = raw.data(using: .utf8),
              let parsed = try? JSONDecoder().decode([String].self, from: data) else { return [] }
        return parsed
    }

    // equipment/attachment on both `exercises` and `set_logs` are
    // inconsistently JSON-array-encoded vs plain string (see the plan's
    // "Known data quirks") — mirrors DataRepository.tsx's read-path
    // unwrapping: a `[`-prefixed value is a JSON array (take the first
    // element), a `"`-prefixed value is a JSON-encoded plain string,
    // anything else is used as-is.
    private static func normalizedLegacyString(_ raw: String?) -> String? {
        guard var value = raw, !value.isEmpty else { return raw }
        if value.hasPrefix("["), let data = value.data(using: .utf8),
           let parsed = try? JSONDecoder().decode([String].self, from: data), let first = parsed.first {
            value = first
        } else if value.hasPrefix("\""), let data = value.data(using: .utf8),
                  let parsed = try? JSONDecoder().decode(String.self, from: data) {
            value = parsed
        }
        return value
    }

    // MARK: - Date parsing

    // created_at/workout_date/date are ISO 8601 strings (JS
    // `new Date().toISOString()`); updated_at/deleted_at are epoch
    // milliseconds. Tries with-fractional-seconds first since that's what
    // `toISOString()` actually produces, then falls back progressively
    // rather than losing the row entirely over a formatting edge case.
    private static func parseDate(_ raw: String?) -> Date? {
        guard let raw, !raw.isEmpty else { return nil }
        let withFractional = ISO8601DateFormatter()
        withFractional.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let date = withFractional.date(from: raw) { return date }
        let plain = ISO8601DateFormatter()
        if let date = plain.date(from: raw) { return date }
        let dateOnly = DateFormatter()
        dateOnly.dateFormat = "yyyy-MM-dd"
        dateOnly.timeZone = TimeZone(identifier: "UTC")
        return dateOnly.date(from: raw)
    }

    private static func epochMs(_ ms: Int?) -> Date? {
        guard let ms else { return nil }
        return Date(timeIntervalSince1970: Double(ms) / 1000)
    }

    // MARK: - SQLite column readers

    private static func forEachRow(_ db: OpaquePointer, _ sql: String, _ row: (OpaquePointer) -> Void) {
        var stmt: OpaquePointer?
        guard sqlite3_prepare_v2(db, sql, -1, &stmt, nil) == SQLITE_OK, let stmt else { return }
        defer { sqlite3_finalize(stmt) }
        while sqlite3_step(stmt) == SQLITE_ROW {
            row(stmt)
        }
    }

    private static func string(_ stmt: OpaquePointer, _ index: Int32) -> String? {
        guard sqlite3_column_type(stmt, index) != SQLITE_NULL, let cString = sqlite3_column_text(stmt, index) else { return nil }
        return String(cString: cString)
    }

    private static func double(_ stmt: OpaquePointer, _ index: Int32) -> Double? {
        guard sqlite3_column_type(stmt, index) != SQLITE_NULL else { return nil }
        return sqlite3_column_double(stmt, index)
    }

    private static func int(_ stmt: OpaquePointer, _ index: Int32) -> Int? {
        guard sqlite3_column_type(stmt, index) != SQLITE_NULL else { return nil }
        return Int(sqlite3_column_int64(stmt, index))
    }

    private static func bool(_ stmt: OpaquePointer, _ index: Int32) -> Bool {
        guard sqlite3_column_type(stmt, index) != SQLITE_NULL else { return false }
        return sqlite3_column_int64(stmt, index) != 0
    }
}

// MARK: - Legacy `workouts.exercises` JSON shape

private struct LegacySetTargetJSON: Decodable {
    let weight: Double?
    let reps: Int?
    let repsLeft: Int?
    let repsRight: Int?
    let duration: Int?
    let distance: Double?
    let rpe: Double?

    var asSetTarget: SetTarget {
        SetTarget(weight: weight, reps: reps, repsLeft: repsLeft, repsRight: repsRight, duration: duration, distance: distance, rpe: rpe)
    }
}

private struct LegacyExerciseJSON: Decodable {
    let id: String?
    let name: String?
    let sets: Int?
    let reps: Int?
    let properties: [String]?
    let setTargets: [LegacySetTargetJSON]?
    let restTime: Int?
    let equipment: String?
    let attachment: String?
    let movementType: String?

    var asTemplate: WorkoutExerciseTemplate {
        WorkoutExerciseTemplate(
            id: id ?? UUID().uuidString,
            name: name ?? "Exercise",
            sets: sets ?? 1,
            reps: reps ?? 1,
            properties: properties ?? [],
            setTargets: (setTargets ?? []).map(\.asSetTarget),
            restTime: restTime,
            equipment: equipment,
            attachment: attachment,
            movementType: movementType
        )
    }
}
