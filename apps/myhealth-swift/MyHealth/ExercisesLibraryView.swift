import Charts
import MyHealthKit
import SwiftData
import SwiftUI

// Ported from apps/myhealth/app/(tabs)/exercises.tsx — browse mode plus the
// same multi-select "add to workout" mode RN's mode='select' prop offers on
// this same screen (rather than a separate picker), reusing ActiveWorkoutStore
// directly since it's an app-wide environment object here too.
struct ExercisesLibraryView: View {
    @Environment(ActiveWorkoutStore.self) private var activeWorkout
    @Query(sort: \ExerciseRecord.name) private var exercises: [ExerciseRecord]

    @Binding var showAddExercise: Bool
    @Binding var scrollToTopTick: Int

    @State private var searchText = ""
    @State private var muscleFilter: String?
    @State private var detailExercise: ExerciseRecord?
    @State private var expandedGroupIds: Set<String> = []
    @State private var isSelecting = false
    @State private var selectedIds: Set<String> = []

    var body: some View {
        NavigationStack {
                VStack(spacing: 0) {
                ZStack {
                    Text("Exercises")
                        .font(.largeTitle.weight(.bold))
                        .frame(maxWidth: .infinity, alignment: .center)
                    HStack {
                        SidebarToggleButton()
                        Spacer()
                        if activeWorkout.hasActiveSession {
                            Button(isSelecting ? "Cancel" : "Select") {
                                isSelecting.toggle()
                                selectedIds.removeAll()
                            }
                            .font(.subheadline.weight(.semibold))
                        }
                    }
                }
                .padding(.horizontal, 16)
                .padding(.top, 16)
                .padding(.bottom, 8)
                .background(Color(.systemBackground))

                    ScrollViewReader { proxy in
                    ScrollView {
                    Color.clear.frame(height: 1).id("top")
                    VStack(alignment: .leading, spacing: 12) {
                        HStack(spacing: 8) {
                            Image(systemName: "magnifyingglass").foregroundStyle(.secondary)
                            TextField("Search exercises...", text: $searchText)
                            if !searchText.isEmpty {
                                Button {
                                    searchText = ""
                                } label: {
                                    Image(systemName: "xmark.circle.fill").foregroundStyle(.secondary)
                                }
                                .buttonStyle(.plain)
                            }
                        }
                        .padding(10)
                        .background(Color(.secondarySystemBackground), in: RoundedRectangle(cornerRadius: 12))

                        if !availableMuscleFilters.isEmpty {
                            ScrollView(.horizontal, showsIndicators: false) {
                                HStack(spacing: 8) {
                                    filterChip(label: "All", isSelected: muscleFilter == nil) { muscleFilter = nil }
                                    ForEach(availableMuscleFilters, id: \.self) { tag in
                                        filterChip(label: tag, isSelected: muscleFilter == tag) {
                                            muscleFilter = muscleFilter == tag ? nil : tag
                                        }
                                    }
                                }
                            }
                        }

                        ForEach(displayItems) { item in
                            switch item {
                            case .single(let exercise):
                                exerciseCard(exercise)
                            case .group(let group):
                                groupCard(group)
                                if expandedGroupIds.contains(group.id) {
                                    ForEach(group.variations) { exercise in
                                        exerciseCard(exercise)
                                            .padding(.leading, 20)
                                    }
                                }
                            }
                        }

                        if filteredExercises.isEmpty {
                            Text("No exercises found. Try a different search or create a new exercise!")
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                                .frame(maxWidth: .infinity, alignment: .center)
                                .padding()
                        }
                    }
                    .padding(16)
                    .padding(.bottom, isSelecting ? 70 : 0)
                    }
                    .onChange(of: scrollToTopTick) {
                        withAnimation { proxy.scrollTo("top", anchor: .top) }
                    }
                    }
                }
                .background(Color(.systemBackground))
                .overlay(alignment: .bottom) {
                    if isSelecting {
                        Button {
                            for id in selectedIds {
                                guard let exercise = exercises.first(where: { $0.id == id }) else { continue }
                                activeWorkout.addExercise(WorkoutExerciseTemplate(
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
                            isSelecting = false
                            selectedIds.removeAll()
                        } label: {
                            Text("Add to Workout (\(selectedIds.count))")
                                .font(.headline)
                                .foregroundStyle(.white)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 14)
                                .background(selectedIds.isEmpty ? Color.gray : Color.accentColor, in: RoundedRectangle(cornerRadius: 14))
                        }
                        .buttonStyle(.plain)
                        .disabled(selectedIds.isEmpty)
                        .padding(16)
                    }
                }
            .background(Color(.systemBackground))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar(.hidden, for: .navigationBar)
            .sheet(isPresented: $showAddExercise) {
                AddExerciseView()
            }
            .sheet(item: $detailExercise) { exercise in
                ExerciseDetailView(exercise: exercise)
            }
        }
    }

    private var availableMuscleFilters: [String] {
        Array(Set(exercises.flatMap(\.muscleGroups))).sorted()
    }

    private var filteredExercises: [ExerciseRecord] {
        exercises.filter { exercise in
            let matchesSearch = searchText.isEmpty || exercise.name.localizedCaseInsensitiveContains(searchText)
            let matchesMuscle = muscleFilter == nil || exercise.muscleGroups.contains(muscleFilter!)
            return matchesSearch && matchesMuscle
        }
    }

    // Variation-family grouping only applies to the unfiltered browse list —
    // an active search or muscle filter flattens back to individual
    // exercises so matches buried inside a collapsed group aren't hidden.
    private var displayItems: [ExerciseListItem] {
        searchText.isEmpty && muscleFilter == nil
            ? groupExercisesForDisplay(exercises)
            : filteredExercises.map { .single($0) }
    }

    private func exerciseCard(_ exercise: ExerciseRecord) -> some View {
        Button {
            if isSelecting {
                if selectedIds.contains(exercise.id) {
                    selectedIds.remove(exercise.id)
                } else {
                    selectedIds.insert(exercise.id)
                }
            } else {
                detailExercise = exercise
            }
        } label: {
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text(exercise.name).font(.body.weight(.semibold)).foregroundStyle(.primary)
                    if !exercise.muscleGroups.isEmpty {
                        Text(exercise.muscleGroups.joined(separator: ", "))
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                if isSelecting {
                    Image(systemName: selectedIds.contains(exercise.id) ? "checkmark.circle.fill" : "circle")
                        .foregroundStyle(selectedIds.contains(exercise.id) ? Color.accentColor : .secondary)
                }
            }
            .padding(16)
            .background(Color(.secondarySystemBackground), in: RoundedRectangle(cornerRadius: 16))
        }
        .buttonStyle(.plain)
    }

    private func groupCard(_ group: ExerciseGroup) -> some View {
        HStack {
            Button {
                if isSelecting {
                    if selectedIds.contains(group.representative.id) {
                        selectedIds.remove(group.representative.id)
                    } else {
                        selectedIds.insert(group.representative.id)
                    }
                } else {
                    detailExercise = group.representative
                }
            } label: {
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(group.name).font(.body.weight(.semibold)).foregroundStyle(.primary)
                        Text(group.subtitle)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    if isSelecting {
                        Image(systemName: selectedIds.contains(group.representative.id) ? "checkmark.circle.fill" : "circle")
                            .foregroundStyle(selectedIds.contains(group.representative.id) ? Color.accentColor : .secondary)
                    }
                }
            }
            .buttonStyle(.plain)

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
        .padding(16)
        .background(Color(.secondarySystemBackground), in: RoundedRectangle(cornerRadius: 16))
    }

    private func filterChip(label: String, isSelected: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(label)
                .font(.subheadline.weight(.semibold))
                .padding(.horizontal, 14)
                .padding(.vertical, 6)
                .background(isSelected ? Color.accentColor : Color(.secondarySystemBackground), in: Capsule())
                .foregroundStyle(isSelected ? .white : .primary)
        }
        .buttonStyle(.plain)
    }
}

struct ExerciseDetailView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(WorkoutManagerStore.self) private var workoutManager
    @Environment(SettingsStore.self) private var settings
    @Query(sort: \BodyMeasurementRecord.date) private var bodyWeights: [BodyMeasurementRecord]
    let exercise: ExerciseRecord

    @State private var editingEquipment = false
    @State private var editingAttachment = false
    @State private var editingMovement = false

    private let equipmentOptions = ["Barbell", "Dumbbell", "Cable", "Machine", "Kettlebell", "Resistance Band", "Smith Machine", "EZ Bar"]
    private let attachmentOptions = ["Lat Bar", "Rope", "Straight Bar", "V-Bar", "Close-Grip V-Bar", "D-Handle", "Ankle Strap", "EZ Bar"]
    private let movementOptions = ["Uniform", "Unilateral"]

    var body: some View {
        NavigationStack {
            Form {
                Section("Muscle Groups") {
                    Text(exercise.muscleGroups.isEmpty ? "—" : exercise.muscleGroups.joined(separator: ", "))
                }
                if !exercise.properties.isEmpty {
                    Section("Properties") {
                        Text(exercise.properties.joined(separator: ", "))
                    }
                }

                // Ported from app/exercises/details.tsx's equipment/attachment/
                // movement editors — default metadata for this exercise (distinct
                // from the per-set overrides in an active workout or routine).
                Section("Defaults") {
                    Button { editingEquipment = true } label: {
                        LabeledContent("Equipment", value: exercise.equipment ?? "None")
                    }
                    .foregroundStyle(.primary)
                    Button { editingAttachment = true } label: {
                        LabeledContent("Attachment", value: exercise.attachment ?? "None")
                    }
                    .foregroundStyle(.primary)
                    Button { editingMovement = true } label: {
                        LabeledContent("Movement", value: exercise.movementType?.capitalized ?? "None")
                    }
                    .foregroundStyle(.primary)
                }

                if let description = exercise.exerciseDescription, !description.isEmpty {
                    Section("Description") { Text(description) }
                }
                if !exercise.instructions.isEmpty {
                    Section("Instructions") {
                        ForEach(Array(exercise.instructions.enumerated()), id: \.offset) { index, step in
                            Text("\(index + 1). \(step)")
                        }
                    }
                }
                if !exercise.tips.isEmpty {
                    Section("Tips") {
                        ForEach(exercise.tips, id: \.self) { tip in
                            Text(tip)
                        }
                    }
                }

                Section("Performance") {
                    ExercisePerformanceChart(exercise: exercise, history: workoutManager.workoutHistory)
                }

                // Ported from ExerciseAdvancedSection.tsx — only shown for
                // Bodyweight-tagged exercises. The load fraction itself
                // (bodyweightLoadPercentage) was already ported for set
                // logging; this just surfaces it here too.
                if exercise.properties.contains("Bodyweight") {
                    Section("Advanced") {
                        bodyweightLoadRow
                    }
                }
            }
            .navigationTitle(exercise.name)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Close") { dismiss() }
                }
            }
            .sheet(isPresented: $editingEquipment) {
                OptionPickerSheet(title: "Equipment", options: equipmentOptions, selected: exercise.equipment) { selected in
                    exercise.equipment = selected
                }
                .presentationDetents([.medium, .large])
            }
            .sheet(isPresented: $editingAttachment) {
                OptionPickerSheet(title: "Attachment", options: attachmentOptions, selected: exercise.attachment) { selected in
                    exercise.attachment = selected
                }
                .presentationDetents([.medium, .large])
            }
            .sheet(isPresented: $editingMovement) {
                OptionPickerSheet(title: "Movement", options: movementOptions, selected: exercise.movementType.map { $0.capitalized }) { selected in
                    exercise.movementType = selected?.lowercased()
                }
                .presentationDetents([.medium, .large])
            }
        }
    }

    private var bodyweightLoadPercent: Int {
        Int((bodyweightLoadPercentage(forExerciseId: exercise.id) * 100).rounded())
    }

    @ViewBuilder
    private var bodyweightLoadRow: some View {
        let latestWeightLb = bodyWeights.last?.weight
        let effectiveLoadLb = effectiveBodyweightLoad(exerciseId: exercise.id, latestBodyWeight: latestWeightLb)

        if let effectiveLoadLb {
            let value = settings.unitSystem == .imperial ? effectiveLoadLb : effectiveLoadLb * 0.453592
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text("\(bodyweightLoadPercent)% of your bodyweight")
                    Text("Based on your latest logged weight")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                Spacer()
                Text(String(format: "%.1f %@", value, settings.unitSystem == .imperial ? "lb" : "kg"))
                    .font(.title3.weight(.bold))
                    .foregroundStyle(Color.accentColor)
            }
        } else {
            Text("This exercise loads \(bodyweightLoadPercent)% of your bodyweight. Log your bodyweight to see the estimated load.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
    }
}

// Ported from apps/myhealth/hooks/workouts/useExerciseStats.ts + the chart
// half of ExerciseChart.tsx — per-metric history for this exercise across
// every past logged set, range-filtered client-side isn't in the RN version
// (it shows full history), so this doesn't add one either. Metric
// availability mirrors useExerciseStats' derivation from the exercise's
// properties; volume/max/estimated-1RM only appear once both weight and
// reps are logged for it.
private struct ExercisePerformanceChart: View {
    let exercise: ExerciseRecord
    let history: [WorkoutLogRecord]

    private enum Metric: String, CaseIterable, Identifiable {
        case weight = "Weight", reps = "Reps", duration = "Duration", distance = "Distance"
        case volume = "Volume", maxVolume = "Max Volume", estimated1RM = "Est. 1RM"
        var id: String { rawValue }
    }

    @State private var selectedMetric: Metric?

    private var availableMetrics: [Metric] {
        var metrics: [Metric] = []
        let props = exercise.properties.map { $0.lowercased() }
        if props.contains(where: { $0.contains("weighted") || ($0.contains("weight") && !$0.contains("bodyweight")) }) { metrics.append(.weight) }
        if props.contains(where: { $0.contains("reps") }) { metrics.append(.reps) }
        if props.contains(where: { $0.contains("duration") }) { metrics.append(.duration) }
        if props.contains(where: { $0.contains("distance") }) { metrics.append(.distance) }
        if metrics.contains(.weight) && metrics.contains(.reps) {
            metrics.append(contentsOf: [.volume, .maxVolume, .estimated1RM])
        }
        return metrics
    }

    private struct Point: Identifiable {
        var date: Date
        var value: Double
        var id: Date { date }
    }

    private func points(for metric: Metric) -> [Point] {
        var byDay: [Date: (max: Double, total: Double)] = [:]
        let calendar = Calendar.current
        for log in history {
            let day = calendar.startOfDay(for: log.workoutDate)
            for set in log.sets where set.exerciseId == exercise.id {
                let raw: Double?
                switch metric {
                case .weight: raw = set.weight
                case .reps: raw = set.reps.map(Double.init)
                case .duration: raw = set.duration.map(Double.init)
                case .distance: raw = set.distance
                case .volume, .maxVolume:
                    raw = (set.weight ?? 0) * Double(set.reps ?? 0)
                case .estimated1RM:
                    raw = estimatedOneRepMax(weight: set.weight ?? 0, reps: set.reps ?? 0)
                }
                guard let val = raw else { continue }
                var entry = byDay[day] ?? (max: val, total: 0)
                entry.max = Swift.max(entry.max, val)
                entry.total += val
                byDay[day] = entry
            }
        }
        return byDay
            .map { day, entry in Point(date: day, value: metric == .volume ? entry.total : entry.max) }
            .sorted { $0.date < $1.date }
    }

    var body: some View {
        if availableMetrics.isEmpty {
            Text("No trackable metrics for this exercise.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
        } else {
            let metric = selectedMetric ?? availableMetrics[0]
            let data = points(for: metric)

            Picker("Metric", selection: Binding(
                get: { metric },
                set: { selectedMetric = $0 }
            )) {
                ForEach(availableMetrics) { m in
                    Text(m.rawValue).tag(m)
                }
            }
            .pickerStyle(.menu)

            if data.isEmpty {
                Text("No logged sets yet.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .frame(maxWidth: .infinity, minHeight: 120)
            } else {
                Chart(data) { point in
                    LineMark(
                        x: .value("Date", point.date, unit: .day),
                        y: .value(metric.rawValue, point.value)
                    )
                    PointMark(
                        x: .value("Date", point.date, unit: .day),
                        y: .value(metric.rawValue, point.value)
                    )
                }
                .frame(height: 160)
            }
        }
    }
}

// Looks an exercise up by library id and shows its detail sheet — for
// callers (like ActiveWorkoutView) that only hold onto an ActiveExercise's
// id/name, not the ExerciseRecord itself.
struct ExerciseDetailLookupView: View {
    @Environment(\.dismiss) private var dismiss
    let exerciseId: String
    @Query private var exercises: [ExerciseRecord]

    init(exerciseId: String) {
        self.exerciseId = exerciseId
        let predicate = #Predicate<ExerciseRecord> { $0.id == exerciseId }
        _exercises = Query(filter: predicate)
    }

    var body: some View {
        if let exercise = exercises.first {
            ExerciseDetailView(exercise: exercise)
        } else {
            NavigationStack {
                ContentUnavailableView("Exercise Not Found", systemImage: "questionmark.circle")
                    .toolbar {
                        ToolbarItem(placement: .cancellationAction) {
                            Button("Close") { dismiss() }
                        }
                    }
            }
        }
    }
}

#Preview {
    ExercisesLibraryView(showAddExercise: .constant(false), scrollToTopTick: .constant(0))
        .environment(NavSelection())
        .modelContainer(for: MyHealthSchema.models, inMemory: true)
}
