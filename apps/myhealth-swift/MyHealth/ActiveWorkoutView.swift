import MyHealthKit
import SwiftUI

// Ported from apps/myhealth/components/workouts/ActiveWorkoutDetailScreen.tsx
// (the "detail" — all exercises stacked and drag-to-reorder) — that RN app
// also has a one-exercise-at-a-time ActiveWorkoutScreen.tsx toggled from the
// same overlay, but this Swift port keeps only the always-visible stacked
// list. Outdoor GPS run panel (live map) is not ported — GPS tracking itself
// still runs via ActiveWorkoutStore, only its map visualization is skipped
// here.
// Aligns the header's title Text to the screen's true center while the
// timer sits to its left — a plain HStack centers the (timer + title) pair
// as a group, which drifts off-center as the timer's digit count changes.
private struct WorkoutTitleCenter: AlignmentID {
    static func defaultValue(in context: ViewDimensions) -> CGFloat {
        context[HorizontalAlignment.center]
    }
}

private extension HorizontalAlignment {
    static let workoutTitleCenter = HorizontalAlignment(WorkoutTitleCenter.self)
}

private extension Alignment {
    static let workoutTitleCenter = Alignment(horizontal: .workoutTitleCenter, vertical: .center)
}

struct ActiveWorkoutView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(ActiveWorkoutStore.self) private var store

    @State private var showAddExercise = false
    @State private var showFinish = false
    @State private var showCancelConfirm = false
    @State private var showResetConfirm = false
    @State private var showReorderSheet = false
    @State private var editingEquipmentIndex: Int?
    @State private var editingAttachmentIndex: Int?
    @State private var editingMovementIndex: Int?
    @State private var detailExerciseId: String?

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                header

                if store.exercises.isEmpty {
                    Spacer()
                    Text("No exercises yet. Add one to get started.")
                        .foregroundStyle(.secondary)
                    Spacer()
                } else {
                    exerciseList
                }

                Spacer(minLength: 0)
            }
            .overlay(alignment: .bottom) {
                if store.restSeconds > 0 {
                    RestTimerBar(seconds: store.restSeconds) {
                        store.addRestTime(-15)
                    } onAdd15: {
                        store.addRestTime(15)
                    } onSkip: {
                        store.skipRest()
                    }
                    .padding(.horizontal, 16)
                    .padding(.bottom, 76)
                }
            }
            .toolbar(.hidden)
            .alert("Reset Workout", isPresented: $showResetConfirm) {
                Button("Cancel", role: .cancel) {}
                Button("Reset", role: .destructive) { store.resetWorkout() }
            } message: {
                Text("This clears all logged sets and restarts the timer. Are you sure?")
            }
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
            .sheet(isPresented: $showReorderSheet) {
                ReorderExercisesSheet()
                    .presentationDetents([.medium, .large])
            }
            .sheet(item: Binding(
                get: { editingEquipmentIndex.map { EditDetailsTarget(index: $0) } },
                set: { editingEquipmentIndex = $0?.index }
            )) { target in
                OptionPickerSheet(
                    title: "Equipment",
                    options: equipmentOptions,
                    selected: store.exercises[target.index].equipment
                ) { selected in
                    store.updateExercise(at: target.index) { ex in ex.equipment = selected }
                }
                .presentationDetents([.medium, .large])
            }
            .sheet(item: Binding(
                get: { editingAttachmentIndex.map { EditDetailsTarget(index: $0) } },
                set: { editingAttachmentIndex = $0?.index }
            )) { target in
                OptionPickerSheet(
                    title: "Attachment",
                    options: attachmentOptions,
                    selected: store.exercises[target.index].attachment
                ) { selected in
                    store.updateExercise(at: target.index) { ex in ex.attachment = selected }
                }
                .presentationDetents([.medium, .large])
            }
            .sheet(item: Binding(
                get: { editingMovementIndex.map { EditDetailsTarget(index: $0) } },
                set: { editingMovementIndex = $0?.index }
            )) { target in
                OptionPickerSheet(
                    title: "Movement",
                    options: movementOptions,
                    selected: store.exercises[target.index].movementType.map { $0.capitalized }
                ) { selected in
                    store.updateExercise(at: target.index) { ex in ex.movementType = selected?.lowercased() }
                }
                .presentationDetents([.medium, .large])
            }
            .sheet(item: Binding(
                get: { detailExerciseId.map { ExerciseIdTarget(id: $0) } },
                set: { detailExerciseId = $0?.id }
            )) { target in
                ExerciseDetailLookupView(exerciseId: target.id)
            }
        }
    }

    private var header: some View {
        ZStack(alignment: .workoutTitleCenter) {
            Color.clear
                .frame(maxWidth: .infinity, maxHeight: 0)
                .alignmentGuide(.workoutTitleCenter) { $0[HorizontalAlignment.center] }

            Text(store.workoutName).font(.headline)
                .alignmentGuide(.workoutTitleCenter) { $0[HorizontalAlignment.center] }

            HStack {
            Button {
                dismiss()
            } label: {
                Image(systemName: "chevron.down")
                    .font(.title2)
            }
            TimerRunningIndicator()
            Text(formatSeconds(store.workoutSeconds)).font(.subheadline).foregroundStyle(.secondary)
            Spacer()
            Menu {
                Button {
                    showAddExercise = true
                } label: {
                    Label("Add Exercise", systemImage: "plus")
                }
                Button {
                    showReorderSheet = true
                } label: {
                    Label("Reorder Exercises", systemImage: "arrow.up.arrow.down")
                }
                Button {
                    showResetConfirm = true
                } label: {
                    Label("Reset Workout", systemImage: "arrow.counterclockwise")
                }
                Button(role: .destructive) {
                    showCancelConfirm = true
                } label: {
                    Label("Discard Workout", systemImage: "trash")
                }
            } label: {
                Image(systemName: "ellipsis.circle")
                    .font(.title2)
            }
            Button("Finish") { showFinish = true }
                .buttonStyle(.borderedProminent)
                .disabled(store.exercises.isEmpty)
            }
        }
        .padding()
    }

    // Ported from ActiveWorkoutDetailScreen.tsx's stacked-card list: every
    // exercise shown at once. Reordering lives in the header menu's
    // ReorderExercisesSheet, not inline here.
    private var exerciseList: some View {
        List {
            ForEach(Array(store.exercises.enumerated()), id: \.element.id) { index, exercise in
                Section {
                    ForEach(0..<exercise.sets, id: \.self) { setIndex in
                        CompactSetRowView(
                            setNumber: setIndex + 1,
                            isCompleted: exercise.completedIndices.contains(setIndex),
                            logged: exercise.logs[setIndex],
                            target: setIndex < exercise.setTargets.count ? exercise.setTargets[setIndex] : SetTarget(),
                            showsWeight: exercise.properties.contains("Weighted"),
                            showsDuration: exercise.properties.contains("Duration"),
                            showsDistance: exercise.properties.contains("Distance"),
                            onToggleComplete: {
                                store.toggleSetCompletion(exerciseIndex: index, setIndex: setIndex)
                            },
                            onLog: { values in
                                store.toggleSetCompletion(exerciseIndex: index, setIndex: setIndex, values: values)
                            }
                        )
                        .listRowSeparator(.hidden)
                        .listRowInsets(EdgeInsets(top: 2, leading: 16, bottom: 2, trailing: 16))
                        .listRowBackground(
                            exercise.completedIndices.contains(setIndex) ? Color.green.opacity(0.15) : nil
                        )
                        .swipeActions(edge: .trailing) {
                            Button("Delete", role: .destructive) {
                                store.removeSet(exerciseIndex: index, setIndex: setIndex)
                            }
                        }
                    }
                } header: {
                    VStack(alignment: .leading, spacing: 12) {
                        HStack {
                            ExerciseTitleButton(name: exercise.name) {
                                detailExerciseId = exercise.id
                            }
                            Spacer()
                            Menu {
                                Button {
                                    store.updateExercise(at: index) { ex in
                                        ex.setTargets.append(SetTarget())
                                    }
                                } label: {
                                    Label("Add Set", systemImage: "plus")
                                }
                                Button {
                                    editingEquipmentIndex = index
                                } label: {
                                    Label("Edit Equipment", systemImage: "dumbbell")
                                }
                                Button {
                                    editingAttachmentIndex = index
                                } label: {
                                    Label("Edit Attachment", systemImage: "link")
                                }
                                Button {
                                    editingMovementIndex = index
                                } label: {
                                    Label("Edit Movement", systemImage: "arrow.left.and.right")
                                }
                                Button(role: .destructive) {
                                    store.removeExercise(at: index)
                                } label: {
                                    Label("Remove Exercise", systemImage: "trash")
                                }
                            } label: {
                                Image(systemName: "ellipsis")
                                    .foregroundStyle(Color(.label))
                            }
                        }

                        if exercise.equipment != nil || exercise.attachment != nil || exercise.movementType != nil {
                            HStack(spacing: 6) {
                                if let equipment = exercise.equipment, !equipment.isEmpty {
                                    TagPill(text: equipment)
                                }
                                if let attachment = exercise.attachment, !attachment.isEmpty {
                                    TagPill(text: attachment)
                                }
                                if let movementType = exercise.movementType, !movementType.isEmpty {
                                    TagPill(text: movementType)
                                }
                            }
                        }

                        SetColumnHeader(
                            showsWeight: exercise.properties.contains("Weighted"),
                            showsDistance: exercise.properties.contains("Distance")
                        )
                    }
                    .textCase(nil)
                }
            }
        }
        .listStyle(.plain)
    }

    private let equipmentOptions = ["Barbell", "Dumbbell", "Cable", "Machine", "Kettlebell", "Resistance Band", "Smith Machine", "EZ Bar"]
    private let attachmentOptions = ["Lat Bar", "Rope", "Straight Bar", "V-Bar", "Close-Grip V-Bar", "D-Handle", "Ankle Strap", "EZ Bar"]
    private let movementOptions = ["Uniform", "Unilateral"]
}

private struct EditDetailsTarget: Identifiable {
    let index: Int
    var id: Int { index }
}

private struct ExerciseIdTarget: Identifiable {
    let id: String
}

// A plain Text+onTapGesture (not Button) opens the exercise detail sheet —
// a Button here gets its label color muted to secondary/gray by the List
// Section header's own styling regardless of an explicit foregroundStyle,
// while a bare Text respects it. Since there's no Button, press feedback is
// done by hand: a DragGesture(minimumDistance: 0) tracks finger-down/up to
// fade the title, matching what tapping a real button would feel like.
private struct ExerciseTitleButton: View {
    let name: String
    let onTap: () -> Void

    @State private var isPressed = false

    var body: some View {
        Text(name)
            .font(.title3.weight(.bold))
            .foregroundStyle(Color(.label))
            .opacity(isPressed ? 0.4 : 1)
            .animation(.easeOut(duration: 0.15), value: isPressed)
            .contentShape(Rectangle())
            .gesture(
                DragGesture(minimumDistance: 0)
                    .onChanged { _ in isPressed = true }
                    .onEnded { value in
                        isPressed = false
                        if abs(value.translation.width) < 10 && abs(value.translation.height) < 10 {
                            onTap()
                        }
                    }
            )
    }
}

// Darkens the checkmark on press so tapping a completed set gives a visibly
// stronger version of its persistent green highlight, rather than the flat
// default press-dimming Button applies.
private struct CheckmarkButtonStyle: ButtonStyle {
    let isCompleted: Bool

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .foregroundStyle(colorFor(pressed: configuration.isPressed))
    }

    private func colorFor(pressed: Bool) -> Color {
        if isCompleted {
            return pressed ? Color(red: 0, green: 0.45, blue: 0) : .green
        } else {
            return pressed ? .primary : .secondary
        }
    }
}

// Column labels shown once above set 1, mirroring CompactSetRowView's field
// layout (checkbox+number spacer, then weight/reps/distance/RPE).
private struct SetColumnHeader: View {
    let showsWeight: Bool
    let showsDistance: Bool

    var body: some View {
        HStack(spacing: 6) {
            Text("Set")
                .lineLimit(1)
                .fixedSize()
                .frame(width: 16, alignment: .leading)
            if showsWeight {
                Text("Weight").frame(maxWidth: .infinity)
            }
            Text("Reps").frame(maxWidth: .infinity)
            if showsDistance {
                Text("Dist").frame(maxWidth: .infinity)
            }
            Text("RPE").frame(maxWidth: .infinity)
            Color.clear.frame(width: 24, height: 1)
        }
        .font(.caption2.weight(.semibold))
        .foregroundStyle(.secondary)
    }
}

private struct TagPill: View {
    let text: String
    var body: some View {
        Text(text)
            .font(.caption2.weight(.medium))
            .padding(.horizontal, 8)
            .padding(.vertical, 3)
            .background(Color.accentColor.opacity(0.15), in: Capsule())
            .foregroundStyle(Color.accentColor)
    }
}

// Ported from ActiveWorkoutScreen.tsx's overflow menu equipment/attachment/
// movement-type pickers — each is its own bottom sheet with a selectable
// list, rather than one combined form.
// A native wheel Picker (same control iOS's own timer picker uses), rather
// than a hand-built scroller — it's UIKit-backed, so it doesn't inherit any
// of the gesture-recognition quirks a custom ScrollView-based wheel would.
private struct RPEWheelSheet: View {
    @Environment(\.dismiss) private var dismiss
    @State private var value: Double?
    let onSave: (Double?) -> Void

    init(value: Double?, onSave: @escaping (Double?) -> Void) {
        _value = State(initialValue: value)
        self.onSave = onSave
    }

    private static let values: [Double] = stride(from: 1.0, through: 10.0, by: 0.5).map { $0 }

    var body: some View {
        GeometryReader { outerGeo in
            NavigationStack {
                VStack(spacing: 8) {
                    Picker("RPE", selection: Binding(
                        get: { value ?? 8 },
                        set: { value = $0 }
                    )) {
                        ForEach(Self.values, id: \.self) { option in
                            Text(option.truncatingRemainder(dividingBy: 1) == 0 ? String(format: "%.0f", option) : String(format: "%.1f", option))
                                .tag(option)
                        }
                    }
                    .pickerStyle(.wheel)
                    .labelsHidden()
                    .padding(.top, 12)

                    Text("Reps/Secs in Reserve: \(rirText(for: value ?? 8))")
                        .font(.title3.weight(.semibold))
                        .foregroundStyle(.secondary)
                        .padding(.bottom, 12)

                    Button {
                        onSave(value)
                        dismiss()
                    } label: {
                        Text("Done")
                            .frame(width: outerGeo.size.width * 0.75)
                    }
                    .buttonStyle(.borderedProminent)
                    .controlSize(.large)
                    .padding(.bottom, 24)
                }
                .frame(maxWidth: .infinity)
                .navigationTitle("RPE")
                .navigationBarTitleDisplayMode(.inline)
            }
        }
    }

    private func rirText(for value: Double) -> String {
        let rir = 10 - value
        return rir.truncatingRemainder(dividingBy: 1) == 0 ? String(format: "%.0f", rir) : String(format: "%.1f", rir)
    }
}

private struct OptionPickerSheet: View {
    @Environment(\.dismiss) private var dismiss
    let title: String
    let options: [String]
    let selected: String?
    let onSelect: (String?) -> Void

    var body: some View {
        NavigationStack {
            List {
                Button {
                    onSelect(nil)
                    dismiss()
                } label: {
                    HStack {
                        Text("None")
                        Spacer()
                        if selected == nil {
                            Image(systemName: "checkmark").foregroundStyle(Color.accentColor)
                        }
                    }
                }
                .foregroundStyle(.primary)

                ForEach(options, id: \.self) { option in
                    Button {
                        onSelect(option)
                        dismiss()
                    } label: {
                        HStack {
                            Text(option)
                            Spacer()
                            if selected == option {
                                Image(systemName: "checkmark").foregroundStyle(Color.accentColor)
                            }
                        }
                    }
                    .foregroundStyle(.primary)
                }
            }
            .listStyle(.insetGrouped)
            .navigationTitle(title)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
            }
        }
    }
}

// Bottom-sheet reorder list, opened from the header's overflow menu — a
// dedicated drag-to-reorder surface distinct from the main exercise list.
private struct ReorderExercisesSheet: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(ActiveWorkoutStore.self) private var store

    var body: some View {
        NavigationStack {
            List {
                ForEach(Array(store.exercises.enumerated()), id: \.element.id) { _, exercise in
                    Text(exercise.name)
                }
                .onMove { source, destination in
                    guard let from = source.first else { return }
                    let to = destination > from ? destination - 1 : destination
                    store.reorderExercises(from: from, to: to)
                }
            }
            .listStyle(.insetGrouped)
            .environment(\.editMode, .constant(.active))
            .navigationTitle("Reorder Exercises")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") { dismiss() }
                }
            }
        }
    }
}

// Pulsing dot next to the header timer, signaling the workout clock is
// live (a recording-light convention) rather than static/frozen text.
private struct TimerRunningIndicator: View {
    @State private var isPulsing = false

    var body: some View {
        Circle()
            .fill(.red)
            .frame(width: 8, height: 8)
            .opacity(isPulsing ? 0.3 : 1)
            .animation(.easeInOut(duration: 0.8).repeatForever(autoreverses: true), value: isPulsing)
            .onAppear { isPulsing = true }
    }
}

private struct RestTimerBar: View {
    let seconds: Int
    let onSubtract15: () -> Void
    let onAdd15: () -> Void
    let onSkip: () -> Void

    init(seconds: Int, onSubtract15: @escaping () -> Void, onAdd15: @escaping () -> Void, onSkip: @escaping () -> Void) {
        self.seconds = seconds
        self.onSubtract15 = onSubtract15
        self.onAdd15 = onAdd15
        self.onSkip = onSkip
    }

    var body: some View {
        HStack {
            Button("-15s", action: onSubtract15)
            Text("Rest: \(formatSeconds(seconds))")
                .font(.headline)
                .frame(maxWidth: .infinity)
            Button("+15s", action: onAdd15)
            Button("Skip", action: onSkip)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 10)
        .background(.orange.opacity(0.9), in: RoundedRectangle(cornerRadius: 16))
        .foregroundStyle(.white)
        .tint(.white)
        .shadow(color: .black.opacity(0.2), radius: 10, x: 0, y: 4)
    }
}

// All fields for a set laid out in a single row.
private struct CompactSetRowView: View {
    let setNumber: Int
    let isCompleted: Bool
    let logged: SetTarget?
    let target: SetTarget
    let showsWeight: Bool
    let showsDuration: Bool
    let showsDistance: Bool
    let onToggleComplete: () -> Void
    let onLog: (SetTarget) -> Void

    @State private var weightText = ""
    @State private var repsText = ""
    @State private var durationText = ""
    @State private var distanceText = ""
    @State private var rpeValue: Double?

    @State private var isTimerRunning = false
    @State private var timerElapsed = 0
    @State private var showingRpeSheet = false

    var body: some View {
        // Duration-based sets (timed holds, outdoor runs) get a second row
        // for the stopwatch — more vertical space than a plain numeric
        // field, but lets the set be timed live instead of guessed after.
        VStack(alignment: .leading, spacing: showsDuration ? 8 : 0) {
            HStack(spacing: 6) {
                Text("\(setNumber)")
                    .font(.subheadline.weight(.medium))
                    .frame(width: 16, alignment: .leading)

                Group {
                    if showsWeight {
                        TextField(weightPlaceholder, text: $weightText)
                            #if os(iOS)
                            .keyboardType(.decimalPad)
                            #endif
                    }
                    TextField(repsPlaceholder, text: $repsText)
                        #if os(iOS)
                        .keyboardType(.numberPad)
                        #endif
                    if showsDistance {
                        TextField(distancePlaceholder, text: $distanceText)
                            #if os(iOS)
                            .keyboardType(.decimalPad)
                            #endif
                    }
                }
                .disabled(isCompleted)

                Button {
                    showingRpeSheet = true
                } label: {
                    Text(rpeValue.map { String(format: "%.1f", $0) } ?? rpePlaceholder)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 7)
                        .background(Color(.systemBackground), in: RoundedRectangle(cornerRadius: 8))
                        .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color(.separator)))
                        .foregroundStyle(rpeValue == nil ? .secondary : .primary)
                }
                .disabled(isCompleted)
                .sheet(isPresented: $showingRpeSheet) {
                    RPEWheelSheet(value: rpeValue) { newValue in
                        rpeValue = newValue
                    }
                    .presentationDetents([.height(380)])
                }

                Button(action: handleTap) {
                    Image(systemName: isCompleted ? "checkmark.circle.fill" : "circle")
                }
                .buttonStyle(CheckmarkButtonStyle(isCompleted: isCompleted))
            }
            .textFieldStyle(.roundedBorder)
            .multilineTextAlignment(.center)

            if showsDuration {
                HStack(spacing: 10) {
                    Button {
                        toggleTimer()
                    } label: {
                        Image(systemName: isTimerRunning ? "stop.circle.fill" : "play.circle.fill")
                            .font(.title3)
                    }
                    .buttonStyle(.plain)
                    .disabled(isCompleted)

                    Text(formatSeconds(timerElapsed))
                        .font(.subheadline.monospacedDigit())
                        .foregroundStyle(.secondary)

                    if !durationText.isEmpty {
                        Text("(\(durationText)s logged)")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
            }
        }
        .padding(10)
        .onAppear(perform: seedFromExisting)
        .onReceive(Timer.publish(every: 1, on: .main, in: .common).autoconnect()) { _ in
            guard isTimerRunning else { return }
            timerElapsed += 1
            durationText = String(timerElapsed)
        }
    }

    private func toggleTimer() {
        if isTimerRunning {
            isTimerRunning = false
        } else {
            timerElapsed = 0
            durationText = ""
            isTimerRunning = true
        }
    }

    // Placeholders show the exercise's previous/target value per field —
    // RN's "Previous" hint on CardWorkoutSet.tsx (session history-backed
    // previousLog isn't ported yet, see ActiveWorkoutStore.swift's Phase 3
    // note), reused here as the target carried over from the template.
    private var weightPlaceholder: String {
        target.weight.map { String(Int($0)) } ?? "-"
    }
    private var repsPlaceholder: String {
        target.reps.map { String($0) } ?? "-"
    }
    private var distancePlaceholder: String {
        target.distance.map { String(format: "%.1f", $0) } ?? "-"
    }
    private var rpePlaceholder: String {
        target.rpe.map { String(format: "%.1f", $0) } ?? "-"
    }

    private func handleTap() {
        if isCompleted {
            onToggleComplete()
        } else {
            isTimerRunning = false
            onLog(SetTarget(
                weight: Double(weightText),
                reps: Int(repsText),
                duration: Int(durationText),
                distance: Double(distanceText),
                rpe: rpeValue
            ))
        }
    }

    private func seedFromExisting() {
        guard let source = logged else { return }
        if let weight = source.weight { weightText = String(Int(weight)) }
        if let reps = source.reps { repsText = String(reps) }
        if let duration = source.duration {
            durationText = String(duration)
            timerElapsed = duration
        }
        if let distance = source.distance { distanceText = String(format: "%.1f", distance) }
        rpeValue = source.rpe
    }
}
