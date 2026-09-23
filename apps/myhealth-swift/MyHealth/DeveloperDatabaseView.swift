import MyHealthKit
import SQLite3
import SwiftData
import SwiftUI

// Ported from apps/myhealth/app/settings/developer/database.tsx, including
// its raw-SQL console (`getAllAsync`, `PRAGMA table_info`). SwiftData itself
// exposes no query surface for that, but its default configuration is
// backed by a real SQLite file on disk (container.configurations.first?.url)
// — SQLQueryConsole below opens a *separate, read-only* sqlite3 connection
// straight to that file and runs whatever SELECT/PRAGMA the user types, same
// as the RN screen. Read-only is deliberate: this is a debug inspector, not
// a way to mutate data out from under SwiftData's own writes.
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

    private enum Mode: String, CaseIterable, Identifiable {
        case browser = "Browser", sql = "SQL Console"
        var id: String { rawValue }
    }

    @Environment(\.modelContext) private var modelContext
    @State private var mode: Mode = .browser
    @State private var selectedTable: Table = .exercises

    var body: some View {
        NavigationStack {
            VStack {
                Picker("Mode", selection: $mode) {
                    ForEach(Mode.allCases) { mode in
                        Text(mode.rawValue).tag(mode)
                    }
                }
                .pickerStyle(.segmented)
                .padding([.horizontal, .top])

                switch mode {
                case .browser:
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
                case .sql:
                    SQLQueryConsole(storeURL: modelContext.container.configurations.first?.url)
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

private struct SQLQueryConsole: View {
    let storeURL: URL?

    @State private var query = "SELECT name FROM sqlite_master WHERE type='table';"
    @State private var columns: [String] = []
    @State private var rows: [[String]] = []
    @State private var errorMessage: String?

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            TextEditor(text: $query)
                .font(.system(.body, design: .monospaced))
                .frame(height: 100)
                .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color(.separator)))
                .padding(.horizontal)

            HStack {
                Button("Run", action: run)
                    .buttonStyle(.borderedProminent)
                    .disabled(storeURL == nil || query.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                if storeURL == nil {
                    Text("No on-disk store for this container.")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                Spacer()
            }
            .padding(.horizontal)

            if let errorMessage {
                Text(errorMessage)
                    .font(.caption.monospaced())
                    .foregroundStyle(.red)
                    .padding(.horizontal)
            }

            ScrollView([.horizontal, .vertical]) {
                Grid(alignment: .leading) {
                    if !columns.isEmpty {
                        GridRow {
                            ForEach(columns, id: \.self) { col in
                                Text(col).font(.caption.weight(.bold)).padding(4)
                            }
                        }
                        Divider()
                    }
                    ForEach(Array(rows.enumerated()), id: \.offset) { _, row in
                        GridRow {
                            ForEach(Array(row.enumerated()), id: \.offset) { _, value in
                                Text(value).font(.system(.caption, design: .monospaced)).padding(4)
                            }
                        }
                    }
                }
                .padding(.horizontal)
            }
        }
        .padding(.top, 4)
    }

    // Read-only connection straight to SwiftData's own SQLite file — a
    // separate handle from the app's live SwiftData context, so a bad query
    // here can't corrupt or lock out the real store. SQLITE_OPEN_READONLY
    // enforces that at the sqlite3 level, not just by convention.
    private func run() {
        errorMessage = nil
        columns = []
        rows = []

        guard let storeURL else {
            errorMessage = "No on-disk store URL for this container."
            return
        }

        var db: OpaquePointer?
        guard sqlite3_open_v2(storeURL.path, &db, SQLITE_OPEN_READONLY, nil) == SQLITE_OK else {
            errorMessage = "Failed to open store: \(String(cString: sqlite3_errmsg(db)))"
            sqlite3_close(db)
            return
        }
        defer { sqlite3_close(db) }

        var statement: OpaquePointer?
        guard sqlite3_prepare_v2(db, query, -1, &statement, nil) == SQLITE_OK else {
            errorMessage = String(cString: sqlite3_errmsg(db))
            return
        }
        defer { sqlite3_finalize(statement) }

        let columnCount = sqlite3_column_count(statement)
        columns = (0..<columnCount).map { String(cString: sqlite3_column_name(statement, $0)) }

        var resultRows: [[String]] = []
        while sqlite3_step(statement) == SQLITE_ROW {
            let row = (0..<columnCount).map { index -> String in
                guard let text = sqlite3_column_text(statement, index) else { return "NULL" }
                return String(cString: text)
            }
            resultRows.append(row)
        }
        rows = resultRows

        if columns.isEmpty {
            errorMessage = "Query ran with no result columns (statement completed)."
        }
    }
}

#Preview {
    DeveloperDatabaseView()
        .modelContainer(for: MyHealthSchema.models, inMemory: true)
}
