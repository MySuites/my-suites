import MyHealthKit
import SwiftData
import SwiftUI

// Ported from apps/myhealth/app/workouts/create.tsx and the editing half of
// apps/myhealth/app/workouts/details.tsx (the "isEditing" template-builder
// mode — the read-only workout-log-viewing mode is WorkoutLogDetailView).
// Scoped down: no drag-reorder (WorkoutDraftExerciseItem's onMove up/down
// buttons cover reordering instead), no per-set attachment/equipment/movement
// overrides — those are exercise-library metadata edits, not template
// authoring, and can be added if the workout-editing flow turns out to need
// them in practice.
struct SavedWorkoutEditorView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(WorkoutManagerStore.self) private var workoutManager

    let existingId: String?
    @State private var name: String
    @State private var exercises: [WorkoutExerciseTemplate]
    @State private var showAddExercise = false
    @State private var showDeleteConfirm = false

    init(workout: WorkoutRecord?) {
        existingId = workout?.id
        _name = State(initialValue: workout?.name ?? "")
        _exercises = State(initialValue: workout?.exercises ?? [])
    }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    TextField("Workout Name", text: $name)
                }

                Section("Exercises") {
                    if exercises.isEmpty {
                        Text("No exercises added yet").foregroundStyle(.secondary)
                    } else {
                        ForEach(Array(exercises.enumerated()), id: \.element.id) { index, exercise in
                            DraftExerciseRow(
                                exercise: Binding(
                                    get: { exercises[index] },
                                    set: { exercises[index] = $0 }
                                ),
                                onMoveUp: index > 0 ? { exercises.swapAt(index, index - 1) } : nil,
                                onMoveDown: index < exercises.count - 1 ? { exercises.swapAt(index, index + 1) } : nil,
                                onRemove: { exercises.remove(at: index) }
                            )
                        }
                    }
                    Button("Add Exercise") { showAddExercise = true }
                }

                if existingId != nil {
                    Section {
                        Button("Delete Workout", role: .destructive) { showDeleteConfirm = true }
                    }
                }
            }
            .navigationTitle(existingId == nil ? "Create Workout" : "Edit Workout")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save", action: save)
                        .disabled(name.trimmingCharacters(in: .whitespaces).isEmpty)
                }
            }
            .sheet(isPresented: $showAddExercise) {
                ExercisePickerView { picked in
                    for exercise in picked {
                        exercises.append(
                            WorkoutExerciseTemplate(
                                id: exercise.id,
                                name: exercise.name,
                                sets: 3,
                                reps: 10,
                                properties: exercise.properties,
                                setTargets: Array(repeating: SetTarget(), count: 3),
                                equipment: exercise.equipment,
                                attachment: exercise.attachment,
                                movementType: exercise.movementType
                            )
                        )
                    }
                }
            }
            .alert("Delete Workout", isPresented: $showDeleteConfirm) {
                Button("Cancel", role: .cancel) {}
                Button("Delete", role: .destructive) {
                    if let existingId {
                        workoutManager.deleteSavedWorkout(id: existingId)
                    }
                    dismiss()
                }
            } message: {
                Text("Are you sure?")
            }
        }
    }

    private func save() {
        let trimmed = name.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }
        if let existingId {
            workoutManager.updateSavedWorkout(id: existingId, name: trimmed, exercises: exercises)
        } else {
            workoutManager.saveWorkout(name: trimmed, exercises: exercises)
        }
        dismiss()
    }
}

private struct DraftExerciseRow: View {
    @Binding var exercise: WorkoutExerciseTemplate
    let onMoveUp: (() -> Void)?
    let onMoveDown: (() -> Void)?
    let onRemove: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(exercise.name).font(.body.weight(.semibold))
                Spacer()
                if let onMoveUp {
                    Button { onMoveUp() } label: { Image(systemName: "chevron.up") }.buttonStyle(.plain)
                }
                if let onMoveDown {
                    Button { onMoveDown() } label: { Image(systemName: "chevron.down") }.buttonStyle(.plain)
                }
                Button(role: .destructive) { onRemove() } label: { Image(systemName: "trash") }.buttonStyle(.plain)
            }
            HStack {
                Stepper("Sets: \(exercise.sets)", value: Binding(
                    get: { exercise.sets },
                    set: { newValue in
                        exercise.sets = newValue
                        let count = exercise.setTargets.count
                        if newValue > count {
                            exercise.setTargets.append(contentsOf: Array(repeating: SetTarget(), count: newValue - count))
                        } else if newValue < count {
                            exercise.setTargets.removeLast(count - newValue)
                        }
                    }
                ), in: 1...10)
            }
            Stepper("Reps: \(exercise.reps)", value: $exercise.reps, in: 1...50)
            Stepper("Rest: \(exercise.restTime ?? 90)s", value: Binding(
                get: { exercise.restTime ?? 90 },
                set: { exercise.restTime = $0 }
            ), in: 15...300, step: 15)
        }
        .padding(.vertical, 4)
    }
}

#Preview {
    SavedWorkoutEditorView(workout: nil)
        .environment(WorkoutManagerStore(repository: WorkoutRepository(context: try! ModelContainer(for: Schema(MyHealthSchema.models)).mainContext)))
}
