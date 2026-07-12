import ActivityKit
import Foundation

// Must stay identical to targets/live-activity/WorkoutActivityAttributes.swift —
// both the widget extension and this native module need the same ActivityAttributes type.
// This file compiles as part of the main app target (deployment target 15.1), while
// ActivityAttributes itself requires iOS 16.1+, so the type must be availability-gated.
@available(iOS 16.2, *)
struct WorkoutActivityAttributes: ActivityAttributes {
    struct ContentState: Codable, Hashable {
        var workoutName: String
        var exerciseName: String
        var setProgress: String
        var startedAt: Date
        var isPaused: Bool
        var isResting: Bool
        var restEndsAt: Date?
    }
}
