import MyHealthKit
import SwiftData
import SwiftUI

// The "select" mode of apps/myhealth/app/(tabs)/exercises.tsx — used when
// adding exercises to a workout template. Browse mode is ExercisesLibraryView;
// this is a separate, simpler multi-select list rather than a shared
// mode-flag on one view, since the two have different toolbars/actions.
struct ExercisePickerView: View {
    @Environment(\.dismiss) private var dismiss
    @Query(sort: \ExerciseRecord.name) private var exercises: [ExerciseRecord]

    let onConfirm: ([ExerciseRecord]) -> Void

    @State private var searchText = ""
    @State private var selectedIds: Set<String> = []
    @State private var showAddExercise = false

    var body: some View {
        NavigationStack {
            List(filteredExercises) { exercise in
                Button {
                    if selectedIds.contains(exercise.id) {
                        selectedIds.remove(exercise.id)
                    } else {
                        selectedIds.insert(exercise.id)
                    }
                } label: {
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(exercise.name).foregroundStyle(.primary)
                            if !exercise.muscleGroups.isEmpty {
                                Text(exercise.muscleGroups.joined(separator: ", "))
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                        }
                        Spacer()
                        if selectedIds.contains(exercise.id) {
                            Image(systemName: "checkmark.circle.fill").foregroundStyle(.tint)
                        }
                    }
                }
            }
            .searchable(text: $searchText, prompt: "Search exercises...")
            .navigationTitle("Add Exercise")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .primaryAction) {
                    Button {
                        showAddExercise = true
                    } label: {
                        Image(systemName: "square.and.pencil")
                    }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Add (\(selectedIds.count))") {
                        onConfirm(exercises.filter { selectedIds.contains($0.id) })
                        dismiss()
                    }
                    .disabled(selectedIds.isEmpty)
                }
            }
            .sheet(isPresented: $showAddExercise) {
                AddExerciseView()
            }
        }
    }

    private var filteredExercises: [ExerciseRecord] {
        guard !searchText.isEmpty else { return exercises }
        return exercises.filter { $0.name.localizedCaseInsensitiveContains(searchText) }
    }
}
