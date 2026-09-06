import MyHealthKit
import SwiftUI

// Ported from apps/myhealth/app/(tabs)/saved.tsx — the full saved-workouts
// list as its own screen/tab, distinct from WorkoutsHomeView's "Dashboard"
// tab (which shows the same list inline as a preview, matching the RN
// workout.tsx home screen). This is the tab you go to specifically to
// browse/start/edit/delete every saved workout template.
struct SavedWorkoutsView: View {
    @Environment(ActiveWorkoutStore.self) private var activeWorkout
    @Environment(WorkoutManagerStore.self) private var workoutManager

    @State private var showActiveWorkout = false
    @State private var showCreateNew = false
    @State private var editingWorkout: WorkoutRecord?
    @State private var replaceConfirmWorkout: WorkoutRecord?
    @State private var isSwitcherRevealed = false
    @State private var switcherHeight: CGFloat = 132

    var body: some View {
        NavigationStack {
            Group {
                if workoutManager.savedWorkouts.isEmpty {
                    VStack(spacing: 0) {
                        // Nothing to scroll here, so no reveal mechanic —
                        // just show it plainly.
                        PillarSwitcherRow()
                        ContentUnavailableView(
                            "No Saved Workouts",
                            systemImage: "list.bullet.clipboard",
                            description: Text("Create a workout to save your favorite exercises and sets.")
                        )
                    }
                    .background(Color(.systemBackground))
                } else {
                    VStack(spacing: 0) {
                        HStack {
                            Text("Saved Workouts").font(.largeTitle.weight(.bold))
                            Spacer()
                            Button {
                                showCreateNew = true
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
                            VStack(alignment: .leading, spacing: 16) {
                                ForEach(workoutManager.savedWorkouts) { workout in
                                    Button {
                                        startSavedWorkout(workout)
                                    } label: {
                                        VStack(alignment: .leading, spacing: 2) {
                                            Text(workout.name).font(.body.weight(.semibold)).foregroundStyle(.primary)
                                            Text("\(workout.exercises.count) exercises")
                                                .font(.caption)
                                                .foregroundStyle(.secondary)
                                        }
                                        .padding(16)
                                        .frame(maxWidth: .infinity, alignment: .leading)
                                        .background(Color(.secondarySystemBackground), in: RoundedRectangle(cornerRadius: 16))
                                    }
                                    .buttonStyle(.plain)
                                    .contextMenu {
                                        Button("Edit") { editingWorkout = workout }
                                        Button("Delete", role: .destructive) {
                                            workoutManager.deleteSavedWorkout(id: workout.id)
                                        }
                                    }
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
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar(.hidden, for: .navigationBar)
            .fullScreenCover(isPresented: $showActiveWorkout) {
                ActiveWorkoutView()
            }
            .sheet(isPresented: $showCreateNew) {
                SavedWorkoutEditorView(workout: nil)
            }
            .sheet(item: $editingWorkout) { workout in
                SavedWorkoutEditorView(workout: workout)
            }
            .alert("Active Workout", isPresented: Binding(get: { replaceConfirmWorkout != nil }, set: { if !$0 { replaceConfirmWorkout = nil } })) {
                Button("Cancel", role: .cancel) { replaceConfirmWorkout = nil }
                Button("Stop Current") {
                    activeWorkout.finishWorkout()
                    replaceConfirmWorkout = nil
                }
                Button("Replace", role: .destructive) {
                    activeWorkout.cancelWorkout()
                    if let workout = replaceConfirmWorkout {
                        activeWorkout.startWorkout(exercises: workout.exercises, name: workout.name, sourceWorkoutId: workout.id)
                    }
                    showActiveWorkout = true
                    replaceConfirmWorkout = nil
                }
            } message: {
                Text("You have an active workout. What would you like to do?")
            }
        }
    }

    private func startSavedWorkout(_ workout: WorkoutRecord) {
        if activeWorkout.hasActiveSession {
            replaceConfirmWorkout = workout
        } else {
            activeWorkout.startWorkout(exercises: workout.exercises, name: workout.name, sourceWorkoutId: workout.id)
            showActiveWorkout = true
        }
    }
}
