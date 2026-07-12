import ActivityKit
import ExpoModulesCore

public class LiveActivityModule: Module {
    @available(iOS 16.2, *)
    private var currentState: WorkoutActivityAttributes.ContentState? {
        get { _currentState as? WorkoutActivityAttributes.ContentState }
        set { _currentState = newValue }
    }
    private var _currentState: Any?

    public func definition() -> ModuleDefinition {
        Name("LiveActivity")

        AsyncFunction("areActivitiesEnabled") { () -> Bool in
            if #available(iOS 16.2, *) {
                return ActivityAuthorizationInfo().areActivitiesEnabled
            }
            return false
        }

        AsyncFunction("startActivity") { (options: LiveActivityStartOptions) in
            guard #available(iOS 16.2, *) else { return }
            guard ActivityAuthorizationInfo().areActivitiesEnabled else { return }

            await self.endCurrentActivity()

            let state = WorkoutActivityAttributes.ContentState(
                workoutName: options.workoutName,
                exerciseName: options.exerciseName,
                setProgress: options.setProgress,
                startedAt: Date(timeIntervalSince1970: options.startedAtMs / 1000),
                isPaused: options.isPaused,
                isResting: false,
                restEndsAt: nil
            )
            self.currentState = state

            do {
                _ = try Activity<WorkoutActivityAttributes>.request(
                    attributes: WorkoutActivityAttributes(),
                    content: .init(state: state, staleDate: nil),
                    pushType: nil
                )
            } catch {
                self.currentState = nil
            }
        }

        AsyncFunction("updateActivity") { (options: LiveActivityUpdateOptions) in
            guard #available(iOS 16.2, *) else { return }
            guard var state = self.currentState,
                  let activity = Activity<WorkoutActivityAttributes>.activities.first else { return }

            if let exerciseName = options.exerciseName {
                state.exerciseName = exerciseName
            }
            if let setProgress = options.setProgress {
                state.setProgress = setProgress
            }
            if let isPaused = options.isPaused {
                state.isPaused = isPaused
            }
            if let startedAtMs = options.startedAtMs {
                state.startedAt = Date(timeIntervalSince1970: startedAtMs / 1000)
            }
            if let isResting = options.isResting {
                state.isResting = isResting
                if !isResting {
                    state.restEndsAt = nil
                }
            }
            if let restEndsAtMs = options.restEndsAtMs {
                state.restEndsAt = Date(timeIntervalSince1970: restEndsAtMs / 1000)
            }

            self.currentState = state
            await activity.update(.init(state: state, staleDate: nil))
        }

        AsyncFunction("endActivity") {
            guard #available(iOS 16.2, *) else { return }
            await self.endCurrentActivity()
        }
    }

    @available(iOS 16.2, *)
    private func endCurrentActivity() async {
        for activity in Activity<WorkoutActivityAttributes>.activities {
            await activity.end(nil, dismissalPolicy: .immediate)
        }
        currentState = nil
    }
}
