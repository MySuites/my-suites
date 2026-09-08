import MyHealthKit
import SwiftUI

// The read-only "isLogView" mode of apps/myhealth/app/workouts/details.tsx —
// viewing a completed workout from History. The editable-template mode is
// RoutineEditorView; WorkoutOverviewChart's per-exercise performance
// tab isn't ported (a chart of one already-finished log's own sets isn't a
// trend), only the Details tab's stats + set list.
struct WorkoutLogDetailView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(WorkoutManagerStore.self) private var workoutManager
    let log: WorkoutLogRecord

    @State private var showDeleteConfirm = false

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    LabeledContent("Date", value: log.workoutDate.formatted(date: .abbreviated, time: .omitted))
                    LabeledContent("Duration", value: formatSeconds(log.duration))
                    if let distance = log.distance {
                        LabeledContent("Distance", value: String(format: "%.2f mi", distance / 1609.34))
                    }
                    if let calories = log.calories {
                        LabeledContent("Calories", value: "\(Int(calories)) kcal")
                    }
                }

                if let note = log.note, !note.isEmpty {
                    Section("Notes") { Text(note) }
                }

                if !log.imageUrls.isEmpty {
                    Section("Progress Photos") {
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 8) {
                                ForEach(log.imageUrls, id: \.self) { uri in
                                    LogImage(uri: uri)
                                        .frame(width: 90, height: 90)
                                        .clipShape(RoundedRectangle(cornerRadius: 10))
                                }
                            }
                        }
                    }
                }

                Section("Exercises") {
                    ForEach(groupedSets, id: \.exerciseName) { group in
                        VStack(alignment: .leading, spacing: 4) {
                            Text(group.exerciseName).font(.subheadline.weight(.semibold))
                            ForEach(Array(group.sets.enumerated()), id: \.offset) { index, set in
                                Text("Set \(index + 1): \(setSummary(set))")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                        }
                        .padding(.vertical, 2)
                    }
                }
            }
            .navigationTitle(log.workoutName)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Close") { dismiss() }
                }
                ToolbarItem(placement: .destructiveAction) {
                    Button(role: .destructive) { showDeleteConfirm = true } label: {
                        Image(systemName: "trash.fill")
                    }
                }
            }
            .alert("Delete Workout Log", isPresented: $showDeleteConfirm) {
                Button("Cancel", role: .cancel) {}
                Button("Delete", role: .destructive) {
                    workoutManager.deleteWorkoutLog(id: log.id)
                    dismiss()
                }
            } message: {
                Text("Are you sure you want to delete this workout from your history? This action cannot be undone.")
            }
        }
    }

    private struct SetGroup {
        var exerciseName: String
        var sets: [SetLogRecord]
    }

    private var groupedSets: [SetGroup] {
        var order: [String] = []
        var byName: [String: [SetLogRecord]] = [:]
        for set in log.sets.sorted(by: { $0.createdAt < $1.createdAt }) {
            if byName[set.exerciseName] == nil { order.append(set.exerciseName) }
            byName[set.exerciseName, default: []].append(set)
        }
        return order.map { SetGroup(exerciseName: $0, sets: byName[$0] ?? []) }
    }

    private func setSummary(_ set: SetLogRecord) -> String {
        var parts: [String] = []
        if let weight = set.weight { parts.append("\(Int(weight)) lb") }
        if let reps = set.reps { parts.append("\(reps) reps") }
        if let duration = set.duration { parts.append("\(duration)s") }
        if let distance = set.distance { parts.append(String(format: "%.1f mi", distance)) }
        return parts.isEmpty ? "—" : parts.joined(separator: " · ")
    }
}

private struct LogImage: View {
    let uri: String
    var body: some View {
        if let url = URL(string: uri), let data = try? Data(contentsOf: url), let uiImage = UIImage(data: data) {
            Image(uiImage: uiImage).resizable()
        } else {
            Rectangle().fill(.quaternary).overlay(Image(systemName: "photo"))
        }
    }
}
