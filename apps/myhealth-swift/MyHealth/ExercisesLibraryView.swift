import MyHealthKit
import SwiftData
import SwiftUI

// Ported from apps/myhealth/app/(tabs)/exercises.tsx (browse mode only).
// Scoped down from the RN original for this pass:
// - No progression grouping/variation collapsing (groupExercisesForDisplay) —
//   this is a flat, searchable, muscle-group-filterable list.
// - No multi-select "add to workout" mode — that lands with the Workouts
//   screen, which is what actually drives it in the RN app.
struct ExercisesLibraryView: View {
    @Query(sort: \ExerciseRecord.name) private var exercises: [ExerciseRecord]

    @State private var searchText = ""
    @State private var muscleFilter: String?
    @State private var showAddExercise = false
    @State private var detailExercise: ExerciseRecord?
    @State private var isSwitcherRevealed = false
    @State private var switcherHeight: CGFloat = 132

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                HStack {
                    Text("Exercises").font(.largeTitle.weight(.bold))
                    Spacer()
                    Button {
                        showAddExercise = true
                    } label: {
                        Image(systemName: "square.and.pencil")
                            .font(.title3)
                            .foregroundStyle(.secondary)
                    }
                    .buttonStyle(.plain)
                }
                .padding(.horizontal, 16)
                .padding(.top, 16)
                .padding(.bottom, 8)
                .background(Color(.systemBackground))

                ZStack(alignment: .top) {
                    PillarSwitcherRow(onDismiss: { isSwitcherRevealed = false })
                        .measureHeight($switcherHeight)

                    VStack(spacing: 0) {
                    ScrollView {
                    PillarPullProbe(isRevealed: $isSwitcherRevealed)
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

                        ForEach(filteredExercises) { exercise in
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
                    .pillarSwitcherCoordinateSpace()
                    }
                    .background(Color(.systemBackground))
                    .offset(y: isSwitcherRevealed ? switcherHeight : 0)
                }
                .clipped()
            }
            .animation(.spring(response: 0.3, dampingFraction: 0.85), value: isSwitcherRevealed)
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

private struct ExerciseDetailView: View {
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

#Preview {
    ExercisesLibraryView()
        .modelContainer(for: MyHealthSchema.models, inMemory: true)
}
