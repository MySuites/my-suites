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
    @State private var expandedGroupIds: Set<String> = []

    var body: some View {
        NavigationStack {
            List(displayItems) { item in
                switch item {
                case .single(let exercise):
                    exerciseRow(exercise)
                case .group(let group):
                    groupRow(group)
                    if expandedGroupIds.contains(group.id) {
                        ForEach(group.variations) { exercise in
                            exerciseRow(exercise)
                                .padding(.leading, 20)
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
                if #available(iOS 26.0, *) {
                    ToolbarSpacer(.fixed, placement: .primaryAction)
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

    // Grouping (variation families collapsed into one row) only applies to
    // the unfiltered browse list — while searching, matches can be buried
    // inside a collapsed group, so search instead flattens to individual
    // exercises.
    private var displayItems: [ExerciseListItem] {
        searchText.isEmpty ? groupExercisesForDisplay(exercises) : filteredExercises.map { .single($0) }
    }

    private func exerciseRow(_ exercise: ExerciseRecord) -> some View {
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
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }

    private func groupRow(_ group: ExerciseGroup) -> some View {
        HStack {
            Button {
                if selectedIds.contains(group.representative.id) {
                    selectedIds.remove(group.representative.id)
                } else {
                    selectedIds.insert(group.representative.id)
                }
            } label: {
                VStack(alignment: .leading, spacing: 2) {
                    Text(group.name).foregroundStyle(.primary)
                    Text(group.subtitle)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .contentShape(Rectangle())
            }
            .buttonStyle(.plain)

            if selectedIds.contains(group.representative.id) {
                Image(systemName: "checkmark.circle.fill").foregroundStyle(.tint)
            }

            Button {
                withAnimation {
                    if expandedGroupIds.contains(group.id) {
                        expandedGroupIds.remove(group.id)
                    } else {
                        expandedGroupIds.insert(group.id)
                    }
                }
            } label: {
                Image(systemName: expandedGroupIds.contains(group.id) ? "chevron.up" : "chevron.down")
                    .foregroundStyle(.secondary)
            }
            .buttonStyle(.plain)
        }
    }
}
