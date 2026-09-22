import MyHealthKit
import SwiftUI

// Ported from apps/myhealth/app/(tabs)/workout.tsx, now including the
// "Recent Activity" 30-day calendar strip + day-detail modal — tapping a
// filled day lists that day's completed workouts, tapping one opens its
// WorkoutLogDetailView.
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

    @Binding var showCreateNew: Bool
    @Binding var startEmptyWorkoutTick: Int
    @Binding var scrollToTopTick: Int

    @State private var showActiveWorkout = false
    @State private var editingWorkout: WorkoutRecord?
    @State private var replaceConfirmWorkout: WorkoutRecord?
    @State private var selectedDay: Date?

    var body: some View {
        NavigationStack {
                VStack(spacing: 0) {
                ZStack {
                    Text("Workout")
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
                        VStack(alignment: .leading, spacing: 16) {
                            if activeWorkout.hasActiveSession {
                            Button {
                                showActiveWorkout = true
                            } label: {
                                ActiveSessionBanner()
                            }
                            .buttonStyle(.plain)
                        }

                        RecentActivityCalendarCard(history: workoutManager.workoutHistory) { day in
                            selectedDay = day
                        }

                        if !activeWorkout.hasActiveSession {
                            Button {
                                startEmptyWorkout()
                            } label: {
                                Text("Start Empty Workout")
                                    .padding(16)
                                    .frame(maxWidth: .infinity, alignment: .leading)
                                    .background(Color(.secondarySystemBackground), in: RoundedRectangle(cornerRadius: 16))
                            }
                            .buttonStyle(.plain)
                        }

                        VStack(alignment: .leading, spacing: 8) {
                            Text("Routines")
                                .font(.subheadline.weight(.semibold))
                                .foregroundStyle(.secondary)
                                .padding(.horizontal, 4)

                            if workoutManager.routines.isEmpty {
                                Text("Create a workout routine to save your favorite exercises and sets.")
                                    .font(.subheadline)
                                    .foregroundStyle(.secondary)
                                    .padding(16)
                                    .frame(maxWidth: .infinity, alignment: .leading)
                                    .background(Color(.secondarySystemBackground), in: RoundedRectangle(cornerRadius: 16))
                            } else {
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
            .sheet(item: Binding(
                get: { selectedDay.map { DaySelection(date: $0) } },
                set: { selectedDay = $0?.date }
            )) { selection in
                DayDetailSheet(day: selection.date, history: workoutManager.workoutHistory)
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

// Ported from the "Recent Activity" calendar strip on
// apps/myhealth/app/(tabs)/workout.tsx — a 30-day horizontal strip, filled
// dot for any day with a completed workout, tapping a day opens the
// day-detail sheet below.
private struct RecentActivityCalendarCard: View {
    let history: [WorkoutLogRecord]
    let onSelectDay: (Date) -> Void

    private var last30Days: [Date] {
        let calendar = Calendar.current
        let today = calendar.startOfDay(for: .now)
        return (0..<30).reversed().compactMap { calendar.date(byAdding: .day, value: -$0, to: today) }
    }

    private var completedDays: Set<Date> {
        let calendar = Calendar.current
        return Set(history.map { calendar.startOfDay(for: $0.workoutDate) })
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Recent Activity")
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(.secondary)
                .padding(.horizontal, 4)

            ScrollViewReader { proxy in
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 16) {
                        ForEach(last30Days, id: \.self) { day in
                            dayButton(for: day)
                                .id(day)
                        }
                    }
                    .padding(.horizontal, 4)
                }
                .onAppear {
                    if let last = last30Days.last {
                        proxy.scrollTo(last, anchor: .trailing)
                    }
                }
            }
        }
        .padding(16)
        .background(Color(.secondarySystemBackground), in: RoundedRectangle(cornerRadius: 16))
    }

    private func dayButton(for day: Date) -> some View {
        let calendar = Calendar.current
        let isToday = calendar.isDateInToday(day)
        let isCompleted = completedDays.contains(day)

        return Button {
            onSelectDay(day)
        } label: {
            VStack(spacing: 6) {
                Text(day.formatted(.dateTime.weekday(.abbreviated)))
                    .font(.caption2.weight(.semibold))
                    .foregroundStyle(isToday ? .primary : .secondary)
                ZStack {
                    Circle()
                        .fill(isCompleted ? Color.accentColor : Color.clear)
                    Circle()
                        .stroke(isCompleted ? Color.clear : Color.accentColor, lineWidth: isToday ? 1 : 0)
                    Text("\(calendar.component(.day, from: day))")
                        .font(.subheadline.weight(isToday || isCompleted ? .bold : .regular))
                        .foregroundStyle(isCompleted ? .white : (isToday ? Color.accentColor : .primary))
                }
                .frame(width: 34, height: 34)
            }
            .frame(width: 34)
        }
        .buttonStyle(.plain)
    }
}

private struct DaySelection: Identifiable {
    let date: Date
    var id: Date { date }
}

private struct DayDetailSheet: View {
    @Environment(\.dismiss) private var dismiss
    let day: Date
    let history: [WorkoutLogRecord]

    @State private var detailLog: WorkoutLogRecord?

    private var logsOnDay: [WorkoutLogRecord] {
        let calendar = Calendar.current
        return history.filter { calendar.isDate($0.workoutDate, inSameDayAs: day) }
    }

    var body: some View {
        NavigationStack {
            Group {
                if logsOnDay.isEmpty {
                    ContentUnavailableView("No Workouts", systemImage: "calendar")
                } else {
                    List(logsOnDay) { log in
                        Button {
                            detailLog = log
                        } label: {
                            VStack(alignment: .leading, spacing: 2) {
                                Text(log.workoutName).font(.body.weight(.semibold)).foregroundStyle(.primary)
                                Text("\(formatSeconds(log.duration)) · \(log.sets.count) sets")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                        }
                    }
                    .listStyle(.plain)
                }
            }
            .navigationTitle(day.formatted(date: .abbreviated, time: .omitted))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Close") { dismiss() }
                }
            }
            .sheet(item: $detailLog) { log in
                WorkoutLogDetailView(log: log)
            }
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
    WorkoutsHomeView(showCreateNew: .constant(false), startEmptyWorkoutTick: .constant(0), scrollToTopTick: .constant(0))
        .environment(SettingsStore())
        .environment(NavSelection())
        .modelContainer(for: MyHealthSchema.models, inMemory: true)
}
