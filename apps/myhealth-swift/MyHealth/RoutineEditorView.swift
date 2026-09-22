import MyHealthKit
import SwiftData
import SwiftUI

// Ported from apps/myhealth/app/workouts/create.tsx and the editing half of
// apps/myhealth/app/workouts/details.tsx (the "isEditing" template-builder
// mode — the read-only workout-log-viewing mode is WorkoutLogDetailView).
// Scoped down: no drag-reorder (WorkoutDraftExerciseItem's onMove up/down
// buttons cover reordering instead).
struct RoutineEditorView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(WorkoutManagerStore.self) private var workoutManager

    let existingId: String?
    @State private var name: String
    @State private var exercises: [WorkoutExerciseTemplate]
    @State private var showAddExercise = false
    @State private var showDeleteConfirm = false
    @State private var editingEquipmentIndex: Int?
    @State private var editingAttachmentIndex: Int?
    @State private var editingMovementIndex: Int?

    private let equipmentOptions = ["Barbell", "Dumbbell", "Cable", "Machine", "Kettlebell", "Resistance Band", "Smith Machine", "EZ Bar"]
    private let attachmentOptions = ["Lat Bar", "Rope", "Straight Bar", "V-Bar", "Close-Grip V-Bar", "D-Handle", "Ankle Strap", "EZ Bar"]
    private let movementOptions = ["Uniform", "Unilateral"]

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
                                onRemove: { exercises.remove(at: index) },
                                onEditEquipment: { editingEquipmentIndex = index },
                                onEditAttachment: { editingAttachmentIndex = index },
                                onEditMovement: { editingMovementIndex = index }
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
                        workoutManager.deleteRoutine(id: existingId)
                    }
                    dismiss()
                }
            } message: {
                Text("Are you sure?")
            }
            .sheet(item: Binding(
                get: { editingEquipmentIndex.map { DraftEditTarget(index: $0) } },
                set: { editingEquipmentIndex = $0?.index }
            )) { target in
                OptionPickerSheet(
                    title: "Equipment",
                    options: equipmentOptions,
                    selected: exercises[target.index].equipment
                ) { selected in
                    exercises[target.index].equipment = selected
                }
                .presentationDetents([.medium, .large])
            }
            .sheet(item: Binding(
                get: { editingAttachmentIndex.map { DraftEditTarget(index: $0) } },
                set: { editingAttachmentIndex = $0?.index }
            )) { target in
                OptionPickerSheet(
                    title: "Attachment",
                    options: attachmentOptions,
                    selected: exercises[target.index].attachment
                ) { selected in
                    exercises[target.index].attachment = selected
                }
                .presentationDetents([.medium, .large])
            }
            .sheet(item: Binding(
                get: { editingMovementIndex.map { DraftEditTarget(index: $0) } },
                set: { editingMovementIndex = $0?.index }
            )) { target in
                OptionPickerSheet(
                    title: "Movement",
                    options: movementOptions,
                    selected: exercises[target.index].movementType.map { $0.capitalized }
                ) { selected in
                    exercises[target.index].movementType = selected?.lowercased()
                }
                .presentationDetents([.medium, .large])
            }
        }
    }

    private func save() {
        let trimmed = name.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }
        if let existingId {
            workoutManager.updateRoutine(id: existingId, name: trimmed, exercises: exercises)
        } else {
            workoutManager.saveWorkout(name: trimmed, exercises: exercises)
        }
        dismiss()
    }
}

private struct DraftEditTarget: Identifiable {
    let index: Int
    var id: Int { index }
}

private struct DraftExerciseRow: View {
    @Binding var exercise: WorkoutExerciseTemplate
    let onMoveUp: (() -> Void)?
    let onMoveDown: (() -> Void)?
    let onRemove: () -> Void
    let onEditEquipment: () -> Void
    let onEditAttachment: () -> Void
    let onEditMovement: () -> Void

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

            HStack(spacing: 8) {
                MetadataPill(label: "Equipment", value: exercise.equipment, action: onEditEquipment)
                MetadataPill(label: "Attachment", value: exercise.attachment, action: onEditAttachment)
                MetadataPill(label: "Movement", value: exercise.movementType?.capitalized, action: onEditMovement)
            }
        }
        .padding(.vertical, 4)
    }
}

// Same per-exercise equipment/attachment/movement overrides as the active
// session (ActiveWorkoutView's OptionPickerSheet edits) — a routine's own
// template used to only be editable there, so building a routine meant
// setting these later mid-workout instead of at creation time.
private struct MetadataPill: View {
    let label: String
    let value: String?
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(value ?? label)
                .font(.caption.weight(.medium))
                .padding(.horizontal, 10)
                .padding(.vertical, 5)
                .background(value == nil ? Color(.tertiarySystemFill) : Color.accentColor.opacity(0.15), in: Capsule())
                .foregroundStyle(value == nil ? .secondary : Color.accentColor)
        }
        .buttonStyle(.plain)
    }
}

#Preview {
    RoutineEditorView(workout: nil)
        .environment(WorkoutManagerStore(repository: WorkoutRepository(context: try! ModelContainer(for: Schema(MyHealthSchema.models)).mainContext)))
}
