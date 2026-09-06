import MyHealthKit
import SwiftData
import SwiftUI

// Ported from apps/myhealth/app/settings/developer/database.tsx. That RN
// screen ran raw SQL against the SQLite file directly (`getAllAsync`,
// `PRAGMA table_info`) — SwiftData doesn't expose its underlying store that
// way, so this is a per-model-type browser over SwiftData's own queries
// instead of a SQL console. Custom SQL query input isn't ported for the
// same reason (no raw-SQL surface to run it against).
struct DeveloperDatabaseView: View {
    private enum Table: String, CaseIterable, Identifiable {
        case exercises = "Exercises"
        case workouts = "Workouts"
        case workoutLogs = "Workout Logs"
        case setLogs = "Set Logs"
        case bodyMeasurements = "Body Measurements"
        case progressPictures = "Progress Pictures"
        var id: String { rawValue }
    }

    @Environment(\.modelContext) private var modelContext
    @State private var selectedTable: Table = .exercises

    var body: some View {
        NavigationStack {
            VStack {
                Picker("Table", selection: $selectedTable) {
                    ForEach(Table.allCases) { table in
                        Text(table.rawValue).tag(table)
                    }
                }
                .pickerStyle(.segmented)
                .padding()

                List(rowsDescription, id: \.self) { row in
                    Text(row).font(.system(.caption, design: .monospaced))
                }
            }
            .navigationTitle("Database")
            .navigationBarTitleDisplayMode(.inline)
        }
    }

    private var rowsDescription: [String] {
        do {
            switch selectedTable {
            case .exercises:
                return try modelContext.fetch(FetchDescriptor<ExerciseRecord>(sortBy: [SortDescriptor(\.name)]))
                    .prefix(100)
                    .map { "\($0.id) · \($0.name) · \($0.muscleGroups.joined(separator: ","))" }
            case .workouts:
                return try modelContext.fetch(FetchDescriptor<WorkoutRecord>())
                    .prefix(100)
                    .map { "\($0.id) · \($0.name) · \($0.exercises.count) exercises" }
            case .workoutLogs:
                return try modelContext.fetch(FetchDescriptor<WorkoutLogRecord>(sortBy: [SortDescriptor(\.workoutDate, order: .reverse)]))
                    .prefix(100)
                    .map { "\($0.id) · \($0.workoutName) · \($0.workoutDate.formatted()) · \($0.duration)s" }
            case .setLogs:
                return try modelContext.fetch(FetchDescriptor<WorkoutLogRecord>(sortBy: [SortDescriptor(\.workoutDate, order: .reverse)]))
                    .prefix(20)
                    .flatMap(\.sets)
                    .map { "\($0.id) · \($0.exerciseName) · w:\($0.weight ?? 0) r:\($0.reps ?? 0)" }
            case .bodyMeasurements:
                return try modelContext.fetch(FetchDescriptor<BodyMeasurementRecord>(sortBy: [SortDescriptor(\.date, order: .reverse)]))
                    .prefix(100)
                    .map { "\($0.id) · \($0.weight) lb · \($0.date.formatted())" }
            case .progressPictures:
                return try modelContext.fetch(FetchDescriptor<ProgressPictureRecord>(sortBy: [SortDescriptor(\.date, order: .reverse)]))
                    .prefix(100)
                    .map { "\($0.id) · \($0.date.formatted()) · \($0.notes)" }
            }
        } catch {
            return ["Failed to load: \(error.localizedDescription)"]
        }
    }
}

#Preview {
    DeveloperDatabaseView()
        .modelContainer(for: MyHealthSchema.models, inMemory: true)
}
