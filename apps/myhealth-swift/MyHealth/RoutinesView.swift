import MyHealthKit
import SwiftUI

// Ported from apps/myhealth/app/(tabs)/saved.tsx — the full routines list
// as its own screen/tab, distinct from WorkoutsHomeView's "Dashboard" tab
// (which shows the same list inline as a preview, matching the RN
// workout.tsx home screen). This is the tab you go to specifically to
// browse/start/edit/delete every routine template.
struct RoutinesView: View {
    @Environment(ActiveWorkoutStore.self) private var activeWorkout
    @Environment(WorkoutManagerStore.self) private var workoutManager

    @Binding var showCreateNew: Bool
    @Binding var startEmptyWorkoutTick: Int
    @Binding var scrollToTopTick: Int

    @State private var showActiveWorkout = false
    @State private var editingWorkout: WorkoutRecord?
    @State private var replaceConfirmWorkout: WorkoutRecord?

    var body: some View {
        NavigationStack {
                VStack(spacing: 0) {
                    ZStack {
                        Text("Routines")
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

                    if workoutManager.routines.isEmpty {
                        ContentUnavailableView(
                            "No Routines",
                            systemImage: "list.bullet.clipboard",
                            description: Text("Create a routine to save your favorite exercises and sets.")
                        )
                        .frame(maxHeight: .infinity)
                    } else {
                        ScrollViewReader { proxy in
                            ScrollView {
                                Color.clear.frame(height: 1).id("top")
                                VStack(alignment: .leading, spacing: 16) {
                                    ForEach(workoutManager.routines) { workout in
                                        Button {
                                            startRoutine(workout)
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
                                                workoutManager.deleteRoutine(id: workout.id)
                                            }
                                        }
                                    }
                                }
                                .padding(16)
                            }
                            .onChange(of: scrollToTopTick) {
                                withAnimation { proxy.scrollTo("top", anchor: .top) }
                            }
                        }
                    }
                }
                .background(Color(.systemBackground))
            .background(Color(.systemBackground))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar(.hidden, for: .navigationBar)
            .fullScreenCover(isPresented: $showActiveWorkout) {
                ActiveWorkoutView()
            }
            .sheet(isPresented: $showCreateNew) {
                RoutineEditorView(workout: nil)
            }
            .sheet(item: $editingWorkout) { workout in
                RoutineEditorView(workout: workout)
            }
            .onChange(of: startEmptyWorkoutTick) {
                startEmptyWorkout()
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

    private func startRoutine(_ workout: WorkoutRecord) {
        if activeWorkout.hasActiveSession {
            replaceConfirmWorkout = workout
        } else {
            activeWorkout.startWorkout(exercises: workout.exercises, name: workout.name, sourceWorkoutId: workout.id)
            showActiveWorkout = true
        }
    }
}
