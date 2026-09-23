import SQLite3
import SwiftData
import XCTest
@testable import MyHealthKit

// Exercises LegacyImportService end-to-end against a small synthetic
// database written at the exact path it reads (<Documents>/SQLite/
// myhealth.db) — the same layout expo-sqlite produces on-device, so this is
// the closest thing to a real fixture without a real device's exported .db.
@MainActor
final class LegacyImportServiceTests: XCTestCase {
    private let flagKey = "legacy_sqlite_import_completed_v1"

    private var legacyDatabaseURL: URL {
        FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("SQLite/myhealth.db")
    }

    override func setUpWithError() throws {
        UserDefaults.standard.removeObject(forKey: flagKey)
        try? FileManager.default.removeItem(at: legacyDatabaseURL)
        try FileManager.default.createDirectory(at: legacyDatabaseURL.deletingLastPathComponent(), withIntermediateDirectories: true)
    }

    override func tearDownWithError() throws {
        UserDefaults.standard.removeObject(forKey: flagKey)
        try? FileManager.default.removeItem(at: legacyDatabaseURL)
    }

    func testImportsLegacySqliteIntoSwiftData() throws {
        try writeFixtureDatabase()

        let config = ModelConfiguration(isStoredInMemoryOnly: true)
        let container = try ModelContainer(for: Schema(MyHealthSchema.models), configurations: config)
        let context = container.mainContext

        let didImport = LegacyImportService.importIfNeeded(context: context)
        XCTAssertTrue(didImport)
        XCTAssertTrue(LegacyImportService.hasImported)

        let exercises = try context.fetch(FetchDescriptor<ExerciseRecord>())
        XCTAssertEqual(exercises.count, 1)
        XCTAssertEqual(exercises.first?.name, "Bench Press")
        XCTAssertEqual(exercises.first?.muscleGroups, ["Chest", "Triceps"])
        XCTAssertEqual(exercises.first?.properties, ["Weighted", "Reps"])
        XCTAssertEqual(exercises.first?.equipment, "barbell") // unwrapped from `["barbell"]`

        let workouts = try context.fetch(FetchDescriptor<WorkoutRecord>())
        XCTAssertEqual(workouts.count, 1)
        XCTAssertEqual(workouts.first?.name, "Push Day")
        XCTAssertEqual(workouts.first?.exercises.first?.name, "Bench Press")
        XCTAssertEqual(workouts.first?.exercises.first?.setTargets.first?.repsLeft, nil)

        let logs = try context.fetch(FetchDescriptor<WorkoutLogRecord>())
        XCTAssertEqual(logs.count, 1)
        XCTAssertEqual(logs.first?.workoutName, "Morning Push")
        XCTAssertEqual(logs.first?.imageUrls, ["photo1.jpg", "photo2.jpg"]) // unwrapped from JSON array
        XCTAssertEqual(logs.first?.sets.count, 1)
        XCTAssertEqual(logs.first?.sets.first?.weight, 135)
        XCTAssertEqual(logs.first?.sets.first?.equipment, "barbell") // unwrapped from `"barbell"`

        let bodyWeights = try context.fetch(FetchDescriptor<BodyMeasurementRecord>())
        XCTAssertEqual(bodyWeights.count, 1)
        XCTAssertEqual(bodyWeights.first?.weight, 180.5)

        let pictures = try context.fetch(FetchDescriptor<ProgressPictureRecord>())
        XCTAssertEqual(pictures.count, 1)
        XCTAssertEqual(pictures.first?.notes, "Week 1")

        // Idempotent: calling again does nothing further.
        XCTAssertFalse(LegacyImportService.importIfNeeded(context: context))
        XCTAssertEqual(try context.fetch(FetchDescriptor<WorkoutRecord>()).count, 1)
    }

    func testNoLegacyDatabaseIsANoOpAndMarksCompleted() throws {
        let config = ModelConfiguration(isStoredInMemoryOnly: true)
        let container = try ModelContainer(for: Schema(MyHealthSchema.models), configurations: config)

        XCTAssertFalse(LegacyImportService.importIfNeeded(context: container.mainContext))
        XCTAssertTrue(LegacyImportService.hasImported)
    }

    // MARK: - Fixture

    private func writeFixtureDatabase() throws {
        var db: OpaquePointer?
        XCTAssertEqual(sqlite3_open(legacyDatabaseURL.path, &db), SQLITE_OK)
        defer { sqlite3_close(db) }

        let statements = """
            CREATE TABLE exercises (
                id TEXT PRIMARY KEY, name TEXT, muscle_groups TEXT, properties TEXT,
                description TEXT, progression_id TEXT, difficulty REAL, is_active_progression INTEGER,
                next_variations TEXT, tips TEXT, instructions TEXT, equipment TEXT, movement_type TEXT,
                attachment TEXT, created_at TEXT, updated_at INTEGER, deleted_at INTEGER
            );
            INSERT INTO exercises (id, name, muscle_groups, properties, equipment, attachment, created_at, updated_at, deleted_at)
            VALUES ('bench_press', 'Bench Press', '["Chest","Triceps"]', 'Weighted,Reps', '["barbell"]', '"Straight Bar"', '2024-01-01T00:00:00.000Z', 1704067200000, NULL);

            CREATE TABLE workouts (
                id TEXT PRIMARY KEY, user_id TEXT, name TEXT, exercises TEXT,
                created_at TEXT, updated_at INTEGER, deleted_at INTEGER, sync_status TEXT, sort_order INTEGER
            );
            INSERT INTO workouts (id, name, exercises, created_at, updated_at, deleted_at, sort_order)
            VALUES ('w1', 'Push Day', '[{"id":"bench_press","name":"Bench Press","sets":3,"reps":8,"properties":["Weighted"],"setTargets":[{"weight":135,"reps":8},{"weight":135,"reps":8},{"weight":135,"reps":8}],"restTime":90,"equipment":"barbell"}]', '2024-01-02T00:00:00.000Z', 1704153600000, NULL, 0);

            CREATE TABLE workout_logs (
                id TEXT PRIMARY KEY, user_id TEXT, workout_date TEXT, workout_name TEXT, duration INTEGER,
                note TEXT, created_at TEXT, updated_at INTEGER, deleted_at INTEGER, sync_status TEXT,
                image_url TEXT, healthkit_uuid TEXT, avg_heart_rate REAL, max_heart_rate REAL,
                calories REAL, distance REAL, elevation_gain REAL, route TEXT, metrics_source TEXT
            );
            INSERT INTO workout_logs (id, workout_date, workout_name, duration, note, created_at, image_url, deleted_at)
            VALUES ('log1', '2024-01-03T08:00:00.000Z', 'Morning Push', 1800, 'Felt strong', '2024-01-03T08:30:00.000Z', '["photo1.jpg","photo2.jpg"]', NULL);

            CREATE TABLE set_logs (
                id TEXT PRIMARY KEY, workout_log_id TEXT, exercise_id TEXT, exercise_name TEXT, weight REAL,
                reps INTEGER, reps_left INTEGER, reps_right INTEGER, distance REAL, duration INTEGER,
                bodyweight BOOLEAN, rpe REAL, equipment TEXT, attachment TEXT, created_at TEXT, sync_status TEXT
            );
            INSERT INTO set_logs (id, workout_log_id, exercise_id, exercise_name, weight, reps, bodyweight, equipment, attachment, created_at)
            VALUES ('s1', 'log1', 'bench_press', 'Bench Press', 135, 8, 0, '"barbell"', 'None', '2024-01-03T08:15:00.000Z');

            CREATE TABLE body_measurements (
                id TEXT PRIMARY KEY, user_id TEXT, weight REAL, date TEXT, created_at TEXT, updated_at INTEGER, sync_status TEXT
            );
            INSERT INTO body_measurements (id, weight, date, created_at, updated_at)
            VALUES ('bw1', 180.5, '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z', 1704067200000);

            CREATE TABLE progress_pictures (
                id TEXT PRIMARY KEY, user_id TEXT, image_uri TEXT, date TEXT, notes TEXT,
                muscle_groups TEXT, created_at TEXT, updated_at INTEGER, sync_status TEXT
            );
            INSERT INTO progress_pictures (id, image_uri, date, notes, created_at, updated_at)
            VALUES ('pic1', '/nonexistent/path/photo.jpg', '2024-01-01T00:00:00.000Z', 'Week 1', '2024-01-01T00:00:00.000Z', 1704067200000);
            """

        var errorMessage: UnsafeMutablePointer<CChar>?
        let result = sqlite3_exec(db, statements, nil, nil, &errorMessage)
        if let errorMessage {
            let message = String(cString: errorMessage)
            sqlite3_free(errorMessage)
            XCTFail("Failed to create fixture database: \(message)")
        }
        XCTAssertEqual(result, SQLITE_OK)
    }
}
