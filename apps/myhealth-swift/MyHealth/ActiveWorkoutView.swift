import MyHealthKit
import SwiftUI

// Ported from apps/myhealth/components/workouts/ActiveWorkoutScreen.tsx (and
// CardWorkoutSet/InlineWorkoutSet/SetRow for the per-set rows). Scoped way
// down from the ~2000-line RN original for this pass: one exercise focused
// at a time with plain set rows and a numeric entry sheet, not the
// swipeable/expandable card carousel. Outdoor GPS run panel (live map) is
// not ported — GPS tracking itself still runs via ActiveWorkoutStore, only
// its map visualization is skipped here.
struct ActiveWorkoutView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(ActiveWorkoutStore.self) private var store

    @State private var showAddExercise = false
    @State private var showFinish = false
    @State private var showCancelConfirm = false
    @State private var loggingSetIndex: Int?

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                header

                if store.restSeconds > 0 {
                    RestTimerBanner(seconds: store.restSeconds)
                }

                if store.exercises.isEmpty {
                    Spacer()
                    Text("No exercises yet. Add one to get started.")
                        .foregroundStyle(.secondary)
                    Spacer()
                } else {
                    exercisePager
                    exerciseDetail
                }

                Spacer(minLength: 0)

                bottomBar
            }
            .toolbar(.hidden)
            .sheet(isPresented: $showAddExercise) {
                ExercisePickerView { picked in
                    for exercise in picked {
                        store.addExercise(WorkoutExerciseTemplate(
                            id: exercise.id,
                            name: exercise.name,
                            sets: 3,
                            reps: 10,
                            properties: exercise.properties,
                            setTargets: Array(repeating: SetTarget(), count: 3),
                            equipment: exercise.equipment,
                            attachment: exercise.attachment,
                            movementType: exercise.movementType
                        ))
                    }
                }
            }
            .fullScreenCover(isPresented: $showFinish) {
                WorkoutEndView { dismiss() }
            }
            .alert("Cancel Workout", isPresented: $showCancelConfirm) {
                Button("Keep Going", role: .cancel) {}
                Button("Discard", role: .destructive) {
                    store.cancelWorkout()
                    dismiss()
                }
            } message: {
                Text("This will discard your progress. Are you sure?")
            }
        }
    }

    private var header: some View {
        HStack {
            Button {
                showCancelConfirm = true
            } label: {
                Image(systemName: "xmark")
            }
            Spacer()
            VStack(spacing: 2) {
                Text(store.workoutName).font(.headline)
                Text(formatSeconds(store.workoutSeconds)).font(.subheadline).foregroundStyle(.secondary)
            }
            Spacer()
            Button {
                store.isRunning ? store.pauseWorkout() : store.resumeWorkout()
            } label: {
                Image(systemName: store.isRunning ? "pause.fill" : "play.fill")
            }
        }
        .padding()
    }

    private var exercisePager: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(Array(store.exercises.enumerated()), id: \.element.id) { index, exercise in
                    Button {
                        store.currentIndex = index
                    } label: {
                        VStack(spacing: 2) {
                            Text(exercise.name).font(.caption.weight(.semibold)).lineLimit(1)
                            Text("\(exercise.completedSets)/\(exercise.sets)").font(.caption2)
                        }
                        .padding(.horizontal, 12)
                        .padding(.vertical, 8)
                        .background(index == store.currentIndex ? Color.accentColor : Color(.secondarySystemBackground), in: Capsule())
                        .foregroundStyle(index == store.currentIndex ? .white : .primary)
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.horizontal)
        }
        .padding(.bottom, 8)
    }

    private var exerciseDetail: some View {
        let index = store.currentIndex
        let exercise = store.exercises[index]
        return ScrollView {
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    Button { store.prevExercise() } label: { Image(systemName: "chevron.left") }
                        .disabled(index == 0)
                    Spacer()
                    Text(exercise.name).font(.title3.weight(.bold))
                    Spacer()
                    Button { store.nextExercise() } label: { Image(systemName: "chevron.right") }
                        .disabled(index == store.exercises.count - 1)
                }

                ForEach(0..<exercise.sets, id: \.self) { setIndex in
                    SetRowView(
                        setNumber: setIndex + 1,
                        isCompleted: exercise.completedIndices.contains(setIndex),
                        logged: exercise.logs[setIndex],
                        target: setIndex < exercise.setTargets.count ? exercise.setTargets[setIndex] : SetTarget(),
                        showsWeight: exercise.properties.contains("Weighted"),
                        showsDuration: exercise.properties.contains("Duration"),
                        showsDistance: exercise.properties.contains("Distance")
                    ) {
                        if exercise.completedIndices.contains(setIndex) {
                            store.toggleSetCompletion(exerciseIndex: index, setIndex: setIndex)
                        } else {
                            loggingSetIndex = setIndex
                        }
                    }
                }

                Button {
                    store.updateExercise(at: index) { ex in
                        ex.setTargets.append(SetTarget())
                    }
                } label: {
                    Label("Add Set", systemImage: "plus")
                }
            }
            .padding()
        }
        .sheet(item: Binding(
            get: { loggingSetIndex.map { LogSheetTarget(setIndex: $0) } },
            set: { loggingSetIndex = $0?.setIndex }
        )) { target in
            LogSetSheet(exercise: exercise) { values in
                store.toggleSetCompletion(exerciseIndex: index, setIndex: target.setIndex, values: values)
            }
        }
    }

    private var bottomBar: some View {
        HStack(spacing: 12) {
            Button("Add Exercise") { showAddExercise = true }
                .buttonStyle(.bordered)
            Spacer()
            Button("Finish") { showFinish = true }
                .buttonStyle(.borderedProminent)
                .disabled(store.exercises.isEmpty)
        }
        .padding()
    }
}

private struct LogSheetTarget: Identifiable {
    let setIndex: Int
    var id: Int { setIndex }
}

private struct RestTimerBanner: View {
    let seconds: Int
    var body: some View {
        Text("Rest: \(formatSeconds(seconds))")
            .font(.headline)
            .frame(maxWidth: .infinity)
            .padding(8)
            .background(.orange.opacity(0.2))
    }
}

private struct SetRowView: View {
    let setNumber: Int
    let isCompleted: Bool
    let logged: SetTarget?
    let target: SetTarget
    let showsWeight: Bool
    let showsDuration: Bool
    let showsDistance: Bool
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            HStack {
                Image(systemName: isCompleted ? "checkmark.circle.fill" : "circle")
                    .foregroundStyle(isCompleted ? .green : .secondary)
                Text("Set \(setNumber)").font(.subheadline.weight(.medium))
                Spacer()
                Text(summary).font(.subheadline).foregroundStyle(.secondary)
            }
            .padding(10)
            .background(Color(.secondarySystemBackground), in: RoundedRectangle(cornerRadius: 10))
        }
        .buttonStyle(.plain)
        .foregroundStyle(.primary)
    }

    private var summary: String {
        let source = logged ?? target
        var parts: [String] = []
        if showsWeight, let weight = source.weight { parts.append("\(Int(weight)) lb") }
        if let reps = source.reps { parts.append("\(reps) reps") }
        if showsDuration, let duration = source.duration { parts.append("\(duration)s") }
        if showsDistance, let distance = source.distance { parts.append(String(format: "%.1f mi", distance)) }
        return parts.isEmpty ? "Tap to log" : parts.joined(separator: " · ")
    }
}

private struct LogSetSheet: View {
    @Environment(\.dismiss) private var dismiss
    let exercise: ActiveExercise
    let onSave: (SetTarget) -> Void

    @State private var weightText = ""
    @State private var repsText = ""
    @State private var durationText = ""
    @State private var distanceText = ""
    @State private var rpe: Double = 7

    var body: some View {
        NavigationStack {
            Form {
                if exercise.properties.contains("Weighted") || exercise.properties.contains("Bodyweight") {
                    TextField("Weight (lb)", text: $weightText)
                        #if os(iOS)
                        .keyboardType(.decimalPad)
                        #endif
                }
                if exercise.properties.contains("Reps") || exercise.properties.isEmpty {
                    TextField("Reps", text: $repsText)
                        #if os(iOS)
                        .keyboardType(.numberPad)
                        #endif
                }
                if exercise.properties.contains("Duration") {
                    TextField("Duration (s)", text: $durationText)
                        #if os(iOS)
                        .keyboardType(.numberPad)
                        #endif
                }
                if exercise.properties.contains("Distance") {
                    TextField("Distance (mi)", text: $distanceText)
                        #if os(iOS)
                        .keyboardType(.decimalPad)
                        #endif
                }
                Section("RPE") {
                    Slider(value: $rpe, in: 1...10, step: 0.5)
                    Text(String(format: "%.1f", rpe))
                }
            }
            .navigationTitle("Log Set")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") {
                        onSave(SetTarget(
                            weight: Double(weightText),
                            reps: Int(repsText),
                            duration: Int(durationText),
                            distance: Double(distanceText),
                            rpe: rpe
                        ))
                        dismiss()
                    }
                }
            }
        }
    }
}
