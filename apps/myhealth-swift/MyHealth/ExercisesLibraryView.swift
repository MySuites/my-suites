import MyHealthKit
import SwiftData
import SwiftUI

// Ported from apps/myhealth/app/(tabs)/exercises.tsx (browse mode only).
// Scoped down from the RN original for this pass:
// - No multi-select "add to workout" mode — that lands with the Workouts
//   screen, which is what actually drives it in the RN app.
struct ExercisesLibraryView: View {
    @Query(sort: \ExerciseRecord.name) private var exercises: [ExerciseRecord]

    @Binding var showAddExercise: Bool
    @Binding var scrollToTopTick: Int

    @State private var searchText = ""
    @State private var muscleFilter: String?
    @State private var detailExercise: ExerciseRecord?
    @State private var expandedGroupIds: Set<String> = []

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
                    }
                    .onChange(of: scrollToTopTick) {
                        withAnimation { proxy.scrollTo("top", anchor: .top) }
                    }
                    }
                }
                .background(Color(.systemBackground))
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
            detailExercise = exercise
        } label: {
            VStack(alignment: .leading, spacing: 2) {
                Text(exercise.name).font(.body.weight(.semibold)).foregroundStyle(.primary)
                if !exercise.muscleGroups.isEmpty {
                    Text(exercise.muscleGroups.joined(separator: ", "))
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
            .padding(16)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color(.secondarySystemBackground), in: RoundedRectangle(cornerRadius: 16))
        }
        .buttonStyle(.plain)
    }

    private func groupCard(_ group: ExerciseGroup) -> some View {
        HStack {
            Button {
                detailExercise = group.representative
            } label: {
                VStack(alignment: .leading, spacing: 2) {
                    Text(group.name).font(.body.weight(.semibold)).foregroundStyle(.primary)
                    Text(group.subtitle)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
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
    let exercise: ExerciseRecord

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
            }
            .navigationTitle(exercise.name)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Close") { dismiss() }
                }
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
