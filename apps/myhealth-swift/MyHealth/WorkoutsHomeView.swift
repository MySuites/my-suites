import MyHealthKit
import SwiftUI

// Ported from apps/myhealth/app/(tabs)/workout.tsx. Scoped down from the RN
// original: no 30-day calendar strip / day-detail modal (a visual nicety on
// top of the same workoutHistory data History already shows) — this keeps
// the active-session banner, start-empty-workout, and saved-workouts list,
// which is the actual navigation this screen exists for.
//
// Uses a plain ScrollView (not List) so the pillar-switcher reveal/collapse
// scroll-position tracking matches DashboardView's — List's cell-based
// virtualization reports overscroll position too inconsistently for the
// scroll-up-to-collapse gesture to work reliably. Cost: no native
// swipeActions, so saved-workout rows use a context menu (long-press) for
// edit/delete instead.
struct WorkoutsHomeView: View {
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
            VStack(spacing: 0) {
                HStack {
                    Text("Workout").font(.largeTitle.weight(.bold))
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
                            if activeWorkout.hasActiveSession {
                            Button {
                                showActiveWorkout = true
                            } label: {
                                ActiveSessionBanner()
                            }
                            .buttonStyle(.plain)
                        }

                        Button {
                            startEmptyWorkout()
                        } label: {
                            Text("Start Empty Workout")
                                .padding(16)
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .background(Color(.secondarySystemBackground), in: RoundedRectangle(cornerRadius: 16))
                        }
                        .buttonStyle(.plain)

                        VStack(alignment: .leading, spacing: 8) {
                            Text("Saved Workouts")
                                .font(.subheadline.weight(.semibold))
                                .foregroundStyle(.secondary)
                                .padding(.horizontal, 4)

                            if workoutManager.savedWorkouts.isEmpty {
                                Text("Create a workout to save your favorite exercises and sets.")
                                    .font(.subheadline)
                                    .foregroundStyle(.secondary)
                                    .padding(16)
                                    .frame(maxWidth: .infinity, alignment: .leading)
                                    .background(Color(.secondarySystemBackground), in: RoundedRectangle(cornerRadius: 16))
                            } else {
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
                        if workout.exercises.isEmpty && workout.name.isEmpty {
                            activeWorkout.startWorkout(exercises: [], name: "Empty Workout")
                        } else {
                            activeWorkout.startWorkout(exercises: workout.exercises, name: workout.name, sourceWorkoutId: workout.id)
                        }
                    }
                    showActiveWorkout = true
                    replaceConfirmWorkout = nil
                }
            } message: {
                Text("You have an active workout. What would you like to do?")
            }
        }
    }

    private func startEmptyWorkout() {
        if activeWorkout.hasActiveSession {
            replaceConfirmWorkout = WorkoutRecord(name: "")
        } else {
            activeWorkout.startWorkout(exercises: [], name: "Empty Workout")
            showActiveWorkout = true
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

private struct ActiveSessionBanner: View {
    @Environment(ActiveWorkoutStore.self) private var activeWorkout

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(activeWorkout.isRunning ? "IN PROGRESS" : "PAUSED")
                    .font(.caption.weight(.bold))
                    .foregroundStyle(.white.opacity(0.8))
                Text(activeWorkout.workoutName).font(.headline).foregroundStyle(.white)
                Text(formatSeconds(activeWorkout.workoutSeconds) + " · \(activeWorkout.exercises.count) exercises")
                    .font(.subheadline)
                    .foregroundStyle(.white.opacity(0.8))
            }
            Spacer()
            Image(systemName: "chevron.right").foregroundStyle(.white)
        }
        .padding()
        .background(Color.accentColor, in: RoundedRectangle(cornerRadius: 16))
    }
}

func formatSeconds(_ seconds: Int) -> String {
    let h = seconds / 3600
    let m = (seconds % 3600) / 60
    let s = seconds % 60
    return h > 0 ? String(format: "%d:%02d:%02d", h, m, s) : String(format: "%d:%02d", m, s)
}

#Preview {
    WorkoutsHomeView()
        .environment(SettingsStore())
        .environment(NavSelection())
        .modelContainer(for: MyHealthSchema.models, inMemory: true)
}
