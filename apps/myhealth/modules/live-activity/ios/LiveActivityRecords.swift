import ExpoModulesCore

internal struct LiveActivityStartOptions: Record {
    @Field
    var workoutName: String = ""

    @Field
    var exerciseName: String = ""

    @Field
    var setProgress: String = ""

    @Field
    var startedAtMs: Double = 0

    @Field
    var isPaused: Bool = false
}

internal struct LiveActivityUpdateOptions: Record {
    @Field
    var exerciseName: String?

    @Field
    var setProgress: String?

    @Field
    var isPaused: Bool?

    @Field
    var startedAtMs: Double?

    @Field
    var isResting: Bool?

    @Field
    var restEndsAtMs: Double?
}
