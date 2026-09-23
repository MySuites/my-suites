import Foundation
import Observation

// One exercise within the in-progress session — distinct from
// WorkoutExerciseTemplate (the saved-workout shape): this carries live
// completion state (completedIndices, logs) on top of the template fields.
// Ported from the `Exercise` shape in workout-logic.ts as used by
// ActiveWorkoutProvider.tsx.
public struct ActiveExercise: Identifiable, Hashable {
    public var id: String
    public var name: String
    public var sets: Int
    public var reps: Int
    public var properties: [String]
    public var setTargets: [SetTarget]
    public var restTime: Int?
    public var equipment: String?
    public var attachment: String?
    public var movementType: String?
    public var completedIndices: [Int] = []
    public var logs: [Int: SetTarget] = [:]

    public var completedSets: Int { completedIndices.count }

    public init(
        id: String = UUID().uuidString,
        name: String,
        sets: Int,
        reps: Int,
        properties: [String] = [],
        setTargets: [SetTarget] = [],
        restTime: Int? = nil,
        equipment: String? = nil,
        attachment: String? = nil,
        movementType: String? = nil
    ) {
        self.id = id
        self.name = name
        self.sets = sets
        self.reps = reps
        self.properties = properties
        self.setTargets = setTargets
        self.restTime = restTime
        self.equipment = equipment
        self.attachment = attachment
        self.movementType = movementType
    }

    init(template: WorkoutExerciseTemplate) {
        self.init(
            id: template.id,
            name: template.name,
            sets: template.sets,
            reps: template.reps,
            properties: template.properties,
            setTargets: template.setTargets,
            restTime: template.restTime,
            equipment: template.equipment,
            attachment: template.attachment,
            movementType: template.movementType
        )
    }
}

// Ported from apps/myhealth/providers/ActiveWorkoutProvider.tsx — the core
// session state machine. Deferred to Phase 3 (needs the concrete screens to
// know the right UX): pre-filling `previousLog` from workout history,
// AI muscle-group analysis on saved progress pictures, and the
// completion-prompt Alert (exposed here as `isWorkoutComplete` instead, for
// the view layer to react to).
@Observable
@MainActor
public final class ActiveWorkoutStore {
    public private(set) var exercises: [ActiveExercise] = []
    public var currentIndex = 0
    public var workoutName = "Current Workout"
    public private(set) var sourceWorkoutId: String?
    public private(set) var hasActiveSession = false
    public var isExpanded = false

    public private(set) var isRunning = false
    public private(set) var workoutSeconds: Int = 0
    public private(set) var restSeconds: Int = 0
    public private(set) var isGpsTrackingActive = false

    public private(set) var latestBodyWeight: Double?

    public var isWorkoutComplete: Bool {
        guard hasActiveSession, !exercises.isEmpty else { return false }
        return exercises.allSatisfy { $0.completedSets >= $0.sets }
    }

    private let settings: SettingsStore
    private let workoutManager: WorkoutManagerStore
    private let repository: WorkoutRepository

    private var tickTask: Task<Void, Never>?
    private var startedAt: Date = .now
    private var restEndsAt: Date?

    public init(settings: SettingsStore, workoutManager: WorkoutManagerStore, repository: WorkoutRepository) {
        self.settings = settings
        self.workoutManager = workoutManager
        self.repository = repository
        self.latestBodyWeight = try? repository.latestBodyWeight()
    }

    // MARK: - Session lifecycle

    public func startWorkout(exercises exercisesToStart: [WorkoutExerciseTemplate]? = nil, name: String? = nil, sourceWorkoutId newSourceWorkoutId: String? = nil) {
        if let exercisesToStart {
            self.exercises = exercisesToStart.map { template in
                var ex = ActiveExercise(template: template)
                ex.setTargets = ex.setTargets.map { _ in SetTarget() } // clear prior values, keep count
                return ex
            }
            workoutName = name ?? "Current Workout"
            sourceWorkoutId = newSourceWorkoutId

            Task { await NotificationService.scheduleWorkoutTimeoutReminder() }

            #if canImport(ActivityKit)
            if settings.isLiveActivitiesEnabled {
                let first = self.exercises.first
                Task {
                    if #available(iOS 16.2, *) {
                        await LiveActivityService.shared.startActivity(
                            workoutName: workoutName,
                            exerciseName: first?.name ?? "",
                            setProgress: setProgressLabel(for: first),
                            startedAt: Date().addingTimeInterval(-Double(workoutSeconds)),
                            isPaused: false
                        )
                    }
                }
            }
            #endif

            #if os(iOS)
            if workoutHasOutdoorExercise(exercisesToStart.map { (id: $0.id, properties: $0.properties) }) {
                Task { await activateGpsTrackingIfNeeded() }
            }
            #endif
        } else {
            if let name { workoutName = name }
            if let newSourceWorkoutId { sourceWorkoutId = newSourceWorkoutId }
        }

        isRunning = true
        hasActiveSession = true
        isExpanded = true
        startedAt = Date().addingTimeInterval(-Double(workoutSeconds))
        startTicking()
    }

    public func resetWorkout() {
        isRunning = true
        hasActiveSession = true
        currentIndex = 0
        workoutSeconds = 0
        restSeconds = 0
        startedAt = .now
        exercises = exercises.map { ex in
            var copy = ex
            copy.completedIndices = []
            copy.logs = [:]
            return copy
        }
    }

    // MARK: - Exercise editing

    public func addExercise(_ template: WorkoutExerciseTemplate) {
        var ex = ActiveExercise(template: template)
        ex.setTargets = ex.setTargets.map { _ in SetTarget() }
        exercises.append(ex)
        #if os(iOS)
        if isOutdoorGpsExercise(id: template.id, properties: template.properties) {
            Task { await activateGpsTrackingIfNeeded() }
        }
        #endif
    }

    public func updateExercise(at index: Int, _ update: (inout ActiveExercise) -> Void) {
        guard exercises.indices.contains(index) else { return }
        update(&exercises[index])
    }

    public func removeExercise(at index: Int) {
        guard exercises.indices.contains(index) else { return }
        exercises.remove(at: index)
        if index <= currentIndex {
            currentIndex = max(0, currentIndex - 1)
        }
    }

    public func reorderExercises(from: Int, to: Int) {
        guard exercises.indices.contains(from), exercises.indices.contains(to) else { return }
        let item = exercises.remove(at: from)
        exercises.insert(item, at: to)
        if from == currentIndex {
            currentIndex = to
        } else if from < currentIndex, to >= currentIndex {
            currentIndex -= 1
        } else if from > currentIndex, to <= currentIndex {
            currentIndex += 1
        }
    }

    public func nextExercise() {
        currentIndex = min(exercises.count - 1, currentIndex + 1)
    }

    public func prevExercise() {
        currentIndex = max(0, currentIndex - 1)
    }

    // MARK: - Set completion

    public func toggleSetCompletion(exerciseIndex: Int, setIndex: Int, values: SetTarget = SetTarget()) {
        guard exercises.indices.contains(exerciseIndex) else { return }
        var ex = exercises[exerciseIndex]
        if let existingPosition = ex.completedIndices.firstIndex(of: setIndex) {
            ex.completedIndices.remove(at: existingPosition)
            ex.logs.removeValue(forKey: setIndex)
        } else {
            ex.completedIndices.append(setIndex)
            ex.logs[setIndex] = values
            let restTime = ex.restTime ?? 90
            startRestTimer(seconds: restTime)
        }
        exercises[exerciseIndex] = ex

        #if canImport(ActivityKit)
        if hasActiveSession, settings.isLiveActivitiesEnabled {
            let current = exercises[currentIndex]
            Task {
                if #available(iOS 16.2, *) {
                    await LiveActivityService.shared.updateActivity(
                        exerciseName: current.name,
                        setProgress: setProgressLabel(for: current)
                    )
                }
            }
        }
        #endif
    }

    public func removeSet(exerciseIndex: Int, setIndex: Int) {
        guard exercises.indices.contains(exerciseIndex) else { return }
        var ex = exercises[exerciseIndex]
        guard setIndex < ex.sets else { return }

        if setIndex < ex.setTargets.count {
            ex.setTargets.remove(at: setIndex)
        }
        ex.sets = max(0, ex.sets - 1)

        var newCompletedIndices: [Int] = []
        var newLogs: [Int: SetTarget] = [:]
        for oldIndex in ex.completedIndices where oldIndex != setIndex {
            let newIndex = oldIndex > setIndex ? oldIndex - 1 : oldIndex
            newCompletedIndices.append(newIndex)
        }
        for (oldIndex, value) in ex.logs where oldIndex != setIndex {
            let newIndex = oldIndex > setIndex ? oldIndex - 1 : oldIndex
            newLogs[newIndex] = value
        }
        ex.completedIndices = newCompletedIndices
        ex.logs = newLogs

        exercises[exerciseIndex] = ex
    }

    // MARK: - Finish / cancel

    public func finishWorkout(note: String? = nil, imageUrls: [String] = []) {
        var gpsData: (distance: Double, elevationGain: Double, route: [RoutePoint])?
        #if os(iOS)
        if isGpsTrackingActive {
            isGpsTrackingActive = false
            let points = LocationTrackingService.shared.stopTracking()
            if points.count >= 2 {
                let route = points.map { RoutePoint(latitude: $0.latitude, longitude: $0.longitude, timestamp: $0.timestamp) }
                gpsData = (distance: routeDistance(points), elevationGain: routeElevationGain(points), route: route)
            }
        }
        #endif

        let setRecords: [SetLogRecord] = exercises.flatMap { ex -> [SetLogRecord] in
            ex.completedIndices.sorted().compactMap { idx -> SetLogRecord? in
                guard let logged = ex.logs[idx] else { return nil }
                let bodyweight = ex.properties.contains("Bodyweight")
                    ? effectiveBodyweightLoad(exerciseId: ex.id, latestBodyWeight: latestBodyWeight)
                    : nil
                return SetLogRecord(
                    exerciseId: ex.id,
                    exerciseName: ex.name,
                    weight: logged.weight,
                    reps: logged.reps,
                    repsLeft: logged.repsLeft,
                    repsRight: logged.repsRight,
                    distance: logged.distance,
                    duration: logged.duration,
                    bodyweight: bodyweight,
                    rpe: logged.rpe,
                    equipment: ex.equipment,
                    attachment: ex.attachment
                )
            }
        }

        workoutManager.saveCompletedWorkout(
            name: workoutName,
            duration: workoutSeconds,
            sets: setRecords,
            note: note,
            imageUrls: imageUrls,
            distance: gpsData?.distance,
            elevationGain: gpsData?.elevationGain,
            route: gpsData?.route,
            metricsSource: gpsData != nil ? "gps" : nil
        )

        endSession()
    }

    public func cancelWorkout() {
        #if os(iOS)
        if isGpsTrackingActive {
            isGpsTrackingActive = false
            _ = LocationTrackingService.shared.stopTracking()
        }
        #endif
        endSession()
    }

    private func endSession() {
        isRunning = false
        stopTicking()
        currentIndex = 0
        workoutSeconds = 0
        restSeconds = 0
        exercises = []
        workoutName = "Current Workout"
        sourceWorkoutId = nil
        hasActiveSession = false
        isExpanded = false
        Task { await NotificationService.cancelWorkoutTimeoutReminder() }
        #if canImport(ActivityKit)
        Task { if #available(iOS 16.2, *) { await LiveActivityService.shared.endActivity() } }
        #endif
    }

    // MARK: - GPS gating

    #if os(iOS)
    public func activateGpsTrackingIfNeeded() async {
        guard !isGpsTrackingActive else { return }
        guard UserDefaults.standard.bool(forKey: "gps_tracking_enabled") else { return }
        guard await LocationTrackingService.shared.requestPermissions() else { return }
        LocationTrackingService.shared.startTracking()
        isGpsTrackingActive = true
    }
    #endif

    // MARK: - Timing

    private func startTicking() {
        stopTicking()
        tickTask = Task { [weak self] in
            while let self, !Task.isCancelled {
                try? await Task.sleep(nanoseconds: 1_000_000_000)
                await self.tick()
            }
        }
    }

    private func stopTicking() {
        tickTask?.cancel()
        tickTask = nil
    }

    private func tick() {
        if isRunning {
            workoutSeconds = max(0, Int(Date().timeIntervalSince(startedAt)))
        }
        if let restEndsAt {
            let remaining = Int(restEndsAt.timeIntervalSinceNow.rounded(.up))
            if remaining <= 0 {
                restSeconds = 0
                self.restEndsAt = nil
                #if canImport(ActivityKit)
                if hasActiveSession, settings.isLiveActivitiesEnabled {
                    Task { if #available(iOS 16.2, *) { await LiveActivityService.shared.updateActivity(isResting: false) } }
                }
                #endif
            } else {
                restSeconds = remaining
            }
        }
    }

    private func startRestTimer(seconds: Int) {
        restSeconds = seconds
        let endsAt = Date().addingTimeInterval(Double(seconds))
        restEndsAt = endsAt
        #if canImport(ActivityKit)
        if hasActiveSession, settings.isLiveActivitiesEnabled {
            Task { if #available(iOS 16.2, *) { await LiveActivityService.shared.updateActivity(isResting: true, restEndsAt: endsAt) } }
        }
        #endif
    }

    public func addRestTime(_ delta: Int) {
        guard let restEndsAt else { return }
        let endsAt = restEndsAt.addingTimeInterval(Double(delta))
        self.restEndsAt = endsAt
        restSeconds = max(0, Int(endsAt.timeIntervalSinceNow.rounded(.up)))
    }

    public func skipRest() {
        restEndsAt = nil
        restSeconds = 0
        #if canImport(ActivityKit)
        if hasActiveSession, settings.isLiveActivitiesEnabled {
            Task { if #available(iOS 16.2, *) { await LiveActivityService.shared.updateActivity(isResting: false) } }
        }
        #endif
    }
}

private func setProgressLabel(for exercise: ActiveExercise?) -> String {
    guard let exercise else { return "" }
    guard exercise.sets > 0 else { return "Set \(exercise.completedSets + 1)" }
    let current = min(exercise.completedSets + 1, exercise.sets)
    return "Set \(current) of \(exercise.sets)"
}

#if os(iOS)
public func routeDistance(_ points: [LocationTrackingService.TrackedRoutePoint]) -> Double {
    guard points.count >= 2 else { return 0 }
    var total = 0.0
    for i in 1..<points.count {
        total += haversineMeters(points[i - 1], points[i])
    }
    return total
}

private func routeElevationGain(_ points: [LocationTrackingService.TrackedRoutePoint]) -> Double {
    var gain = 0.0
    for i in 1..<points.count {
        guard let prevAlt = points[i - 1].altitude, let alt = points[i].altitude, alt > prevAlt else { continue }
        gain += alt - prevAlt
    }
    return gain
}

private func haversineMeters(_ a: LocationTrackingService.TrackedRoutePoint, _ b: LocationTrackingService.TrackedRoutePoint) -> Double {
    let earthRadius = 6_371_000.0
    let lat1 = a.latitude * .pi / 180
    let lat2 = b.latitude * .pi / 180
    let deltaLat = (b.latitude - a.latitude) * .pi / 180
    let deltaLon = (b.longitude - a.longitude) * .pi / 180
    let h = sin(deltaLat / 2) * sin(deltaLat / 2) + cos(lat1) * cos(lat2) * sin(deltaLon / 2) * sin(deltaLon / 2)
    return earthRadius * 2 * atan2(sqrt(h), sqrt(1 - h))
}
#endif
