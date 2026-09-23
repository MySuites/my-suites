import Foundation
import Observation

// Ported from apps/myhealth/providers/WorkoutManagerProvider.tsx (the saved
// workouts / workout history slice — settings live in SettingsStore, and
// sync is dropped entirely per the plan since it was already dead code in
// the RN app).
@Observable
@MainActor
public final class WorkoutManagerStore {
    public private(set) var routines: [WorkoutRecord] = []
    public private(set) var workoutHistory: [WorkoutLogRecord] = []
    public private(set) var isLoading = true
    public private(set) var isSaving = false
    public var lastError: Error?

    private let repository: WorkoutRepository

    public init(repository: WorkoutRepository) {
        self.repository = repository
    }

    public func loadInitialData() {
        isLoading = true
        defer { isLoading = false }
        do {
            routines = try repository.fetchWorkouts()
            workoutHistory = try repository.fetchHistory()
        } catch {
            lastError = error
        }
    }

    public func saveWorkout(name: String, exercises: [WorkoutExerciseTemplate]) {
        let trimmed = name.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }

        isSaving = true
        defer { isSaving = false }
        do {
            try repository.saveWorkout(name: trimmed, exercises: exercises)
            routines = try repository.fetchWorkouts()
        } catch {
            lastError = error
        }
    }

    // Simplified relative to the RN original's updateRoutine: this
    // replaces the template's exercises/targets outright rather than
    // merging completed-set values back into the template on a
    // field-by-field basis. That merge behavior is UI-editing-flow specific
    // (values-only edits vs. full edits) — revisit when the workout editor
    // screen is built in Phase 3 and the exact UX is known.
    public func updateRoutine(id: String, name: String, exercises: [WorkoutExerciseTemplate]) {
        isSaving = true
        defer { isSaving = false }
        do {
            try repository.saveWorkout(id: id, name: name, exercises: exercises)
            routines = try repository.fetchWorkouts()
        } catch {
            lastError = error
        }
    }

    public func deleteRoutine(id: String) {
        do {
            try repository.deleteWorkout(id: id)
            routines.removeAll { $0.id == id }
        } catch {
            lastError = error
        }
    }

    public func reorderRoutines(_ newOrder: [WorkoutRecord]) {
        routines = newOrder
        do {
            try repository.updateWorkoutSortOrders(newOrder.enumerated().map { (id: $1.id, sortOrder: $0) })
        } catch {
            lastError = error
        }
    }

    @discardableResult
    public func saveCompletedWorkout(
        name: String,
        duration: Int,
        sets: [SetLogRecord],
        note: String? = nil,
        imageUrls: [String] = [],
        healthkitUuid: String? = nil,
        avgHeartRate: Double? = nil,
        maxHeartRate: Double? = nil,
        calories: Double? = nil,
        distance: Double? = nil,
        elevationGain: Double? = nil,
        route: [RoutePoint]? = nil,
        metricsSource: String? = nil
    ) -> WorkoutLogRecord? {
        isSaving = true
        defer { isSaving = false }
        do {
            let log = try repository.saveLog(
                workoutName: name,
                duration: duration,
                note: note,
                sets: sets,
                imageUrls: imageUrls,
                healthkitUuid: healthkitUuid,
                avgHeartRate: avgHeartRate,
                maxHeartRate: maxHeartRate,
                calories: calories,
                distance: distance,
                elevationGain: elevationGain,
                route: route,
                metricsSource: metricsSource
            )
            workoutHistory = try repository.fetchHistory()
            return log
        } catch {
            lastError = error
            return nil
        }
    }

    public func deleteWorkoutLog(id: String) {
        do {
            try repository.deleteHistory(id: id)
            workoutHistory.removeAll { $0.id == id }
        } catch {
            lastError = error
        }
    }
}
