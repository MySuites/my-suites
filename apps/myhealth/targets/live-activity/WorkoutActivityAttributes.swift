import ActivityKit
import Foundation

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
