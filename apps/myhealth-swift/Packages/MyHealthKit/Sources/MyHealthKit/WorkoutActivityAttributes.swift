#if canImport(ActivityKit)
import ActivityKit
import Foundation

// Ported unchanged from apps/myhealth/targets/live-activity/WorkoutActivityAttributes.swift.
// Lives in the shared package so both the app target (which starts/updates
// the activity) and the widget extension (which renders it) see the same type.
// ActivityKit doesn't exist on watchOS, hence the #if canImport guard —
// this whole file compiles out of the watchOS build of MyHealthKit.
public struct WorkoutActivityAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        public var workoutName: String
        public var exerciseName: String
        public var setProgress: String
        public var startedAt: Date
        public var isPaused: Bool
        public var isResting: Bool
        public var restEndsAt: Date?

        public init(
            workoutName: String,
            exerciseName: String,
            setProgress: String,
            startedAt: Date,
            isPaused: Bool,
            isResting: Bool,
            restEndsAt: Date?
        ) {
            self.workoutName = workoutName
            self.exerciseName = exerciseName
            self.setProgress = setProgress
            self.startedAt = startedAt
            self.isPaused = isPaused
            self.isResting = isResting
            self.restEndsAt = restEndsAt
        }
    }

    public init() {}
}
#endif
