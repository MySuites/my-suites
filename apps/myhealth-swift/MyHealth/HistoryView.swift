import MyHealthKit
import SwiftUI

// Ported from apps/myhealth/app/history/index.tsx.
struct HistoryView: View {
    @Environment(WorkoutManagerStore.self) private var workoutManager
    @State private var selectedLog: WorkoutLogRecord?
    @State private var exportedFile: ExportedCsv?

    private struct ExportedCsv: Identifiable {
        let url: URL
        var id: URL { url }
    }

    var body: some View {
        NavigationStack {
            Group {
                if workoutManager.workoutHistory.isEmpty {
                    ContentUnavailableView(
                        "No Workout History",
                        systemImage: "clock.arrow.circlepath",
                        description: Text("There are currently no past workouts, start and finish a workout first.")
                    )
                } else {
                    List {
                        ForEach(workoutManager.workoutHistory) { log in
                            Button {
                                selectedLog = log
                            } label: {
                                VStack(alignment: .leading, spacing: 4) {
                                    HStack {
                                        Text(log.workoutName).font(.body.weight(.semibold))
                                        Spacer()
                                        Text(log.workoutDate.formatted(date: .abbreviated, time: .omitted))
                                            .font(.caption)
                                            .foregroundStyle(.secondary)
                                    }
                                    if let note = log.note, !note.isEmpty {
                                        Text(note).font(.caption).foregroundStyle(.secondary).lineLimit(1)
                                    }
                                }
                            }
                            .foregroundStyle(.primary)
                            .swipeActions(edge: .trailing) {
                                Button("Delete", role: .destructive) {
                                    workoutManager.deleteWorkoutLog(id: log.id)
                                }
                            }
                        }
                    }
                }
            }
            .navigationTitle("Workout History")
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button {
                        exportCsv()
                    } label: {
                        Image(systemName: "square.and.arrow.down")
                    }
                    .disabled(workoutManager.workoutHistory.isEmpty)
                }
            }
            .sheet(item: $selectedLog) { log in
                WorkoutLogDetailView(log: log)
            }
            .sheet(item: $exportedFile) { file in
                ActivityShareSheet(activityItems: [file.url])
            }
        }
    }

    private func exportCsv() {
        let csv = buildWorkoutHistoryCsv(workoutManager.workoutHistory)
        let url = FileManager.default.temporaryDirectory
            .appendingPathComponent("workout_history_\(Int(Date().timeIntervalSince1970))")
            .appendingPathExtension("csv")
        try? csv.write(to: url, atomically: true, encoding: .utf8)
        exportedFile = ExportedCsv(url: url)
    }
}

// Ported from apps/myhealth/utils/exportWorkoutHistory.ts. One row per
// logged set — the most granular record available.
private func buildWorkoutHistoryCsv(_ history: [WorkoutLogRecord]) -> String {
    func escape(_ value: String) -> String {
        value.contains(where: { ",\"\n".contains($0) }) ? "\"\(value.replacingOccurrences(of: "\"", with: "\"\""))\"" : value
    }
    func row(_ fields: [String]) -> String {
        var escaped: [String] = []
        for field in fields { escaped.append(escape(field)) }
        return escaped.joined(separator: ",")
    }

    var rows = ["Date,Workout Name,Exercise,Set,Reps,Weight (lb),Duration (s),Distance,RPE,Notes"]
    for log in history {
        let dateStr: String = log.workoutDate.formatted(date: .numeric, time: .omitted)
        let note: String = log.note ?? ""
        let sets = log.sets.sorted { $0.createdAt < $1.createdAt }
        if sets.isEmpty {
            rows.append(row([dateStr, log.workoutName, "", "", "", "", "", "", "", note]))
            continue
        }
        var perExerciseIndex: [String: Int] = [:]
        for set in sets {
            let count = (perExerciseIndex[set.exerciseName] ?? 0) + 1
            perExerciseIndex[set.exerciseName] = count

            let repsStr: String = set.reps.map(String.init) ?? ""
            let weightStr: String = set.weight.map { String(Int($0)) } ?? ""
            let durationStr: String = set.duration.map(String.init) ?? ""
            let distanceStr: String = set.distance.map { String(format: "%.2f", $0) } ?? ""
            let rpeStr: String = set.rpe.map { String(format: "%.1f", $0) } ?? ""

            rows.append(row([dateStr, log.workoutName, set.exerciseName, "\(count)", repsStr, weightStr, durationStr, distanceStr, rpeStr, note]))
        }
    }
    return rows.joined(separator: "\n")
}

#if os(iOS)
import UIKit

private struct ActivityShareSheet: UIViewControllerRepresentable {
    let activityItems: [Any]
    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: activityItems, applicationActivities: nil)
    }
    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}
#endif
