#if canImport(ActivityKit)
import ActivityKit
import Foundation

// Ported from apps/myhealth/modules/live-activity/ios/LiveActivityModule.swift —
// the original was an Expo bridge module calling into ActivityKit; this is
// the same ActivityKit logic called directly, no JS bridge needed.
// ActivityKit doesn't exist on watchOS, hence the #if canImport guard —
// this whole file compiles out of the watchOS build of MyHealthKit.
@available(iOS 16.2, *)
public final class LiveActivityService {
    public static let shared = LiveActivityService()

    private var currentState: WorkoutActivityAttributes.ContentState?

    private init() {}

    public var areActivitiesEnabled: Bool {
        ActivityAuthorizationInfo().areActivitiesEnabled
    }

    public func startActivity(
        workoutName: String,
        exerciseName: String,
        setProgress: String,
        startedAt: Date,
        isPaused: Bool
    ) async {
        guard areActivitiesEnabled else { return }

        await endCurrentActivity()

        let state = WorkoutActivityAttributes.ContentState(
            workoutName: workoutName,
            exerciseName: exerciseName,
            setProgress: setProgress,
            startedAt: startedAt,
            isPaused: isPaused,
            isResting: false,
            restEndsAt: nil
        )
        currentState = state

        do {
            _ = try Activity<WorkoutActivityAttributes>.request(
                attributes: WorkoutActivityAttributes(),
                content: .init(state: state, staleDate: nil),
                pushType: nil
            )
        } catch {
            currentState = nil
        }
    }

    public func updateActivity(
        exerciseName: String? = nil,
        setProgress: String? = nil,
        isPaused: Bool? = nil,
        startedAt: Date? = nil,
        isResting: Bool? = nil,
        restEndsAt: Date? = nil
    ) async {
        guard var state = currentState,
              let activity = Activity<WorkoutActivityAttributes>.activities.first else { return }

        if let exerciseName { state.exerciseName = exerciseName }
        if let setProgress { state.setProgress = setProgress }
        if let isPaused { state.isPaused = isPaused }
        if let startedAt { state.startedAt = startedAt }
        if let isResting {
            state.isResting = isResting
            if !isResting { state.restEndsAt = nil }
        }
        if let restEndsAt { state.restEndsAt = restEndsAt }

        currentState = state
        await activity.update(.init(state: state, staleDate: nil))
    }

    public func endActivity() async {
        await endCurrentActivity()
    }

    private func endCurrentActivity() async {
        for activity in Activity<WorkoutActivityAttributes>.activities {
            await activity.end(nil, dismissalPolicy: .immediate)
        }
        currentState = nil
    }
}
#endif
