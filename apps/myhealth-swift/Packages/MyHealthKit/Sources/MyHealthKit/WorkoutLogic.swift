import Foundation

// Ported from apps/myhealth/utils/workout-logic.ts — see SWIFT_MIGRATION_PLAN.md
// "Domain Logic Reference" for the original RN source and rationale.

public struct SetLog {
    public var bodyweight: Double?
    public var weight: Double?

    public init(bodyweight: Double? = nil, weight: Double? = nil) {
        self.bodyweight = bodyweight
        self.weight = weight
    }
}

// Bodyweight sets carry a `bodyweight` baseline (the exercise-adjusted load
// estimate, see bodyweightLoadPercentage below) stamped by the active-workout
// state. Merged bodyweight+weighted exercises (e.g. pull_up) also carry an
// explicit `weight` on top of that baseline - negative for assistance,
// positive for added load - so both fields need to be summed, not treated as
// either/or. Sets logged before that merge only ever have one of the two
// fields set, so this still degrades correctly for old data.
// Epley formula — ported from apps/myhealth/utils/workout-api/exercises.ts's
// estimateOneRepMax. Most common e1RM estimate, accurate for the
// low-to-moderate rep ranges (roughly 1-12) that strength sets fall in.
public func estimatedOneRepMax(weight: Double, reps: Int) -> Double? {
    guard weight.isFinite, weight > 0, reps > 0 else { return nil }
    if reps == 1 { return weight }
    return weight * (1 + Double(reps) / 30)
}

public func effectiveSetWeight(_ set: SetLog) -> Double {
    if let bodyweight = set.bodyweight {
        return bodyweight + (set.weight ?? 0)
    }
    if let weight = set.weight {
        return weight
    }
    return 0
}

// Fraction of total bodyweight actually borne by the working limbs for a
// given bodyweight exercise (e.g. a push-up loads roughly two-thirds of
// bodyweight through the arms, not the full weight — the legs/toes bear the
// rest). Keyed by exercise id; only covers exercises with well-established
// figures. Anything not listed defaults to 1 (full bodyweight) - correct for
// movements that genuinely suspend/support the whole body through a single
// point of contact (pull-ups, dips, handstands, planche, front lever,
// L-sits, squats), but was previously also the silent fallback for
// variations that clearly don't (push-up progressions, planks, crunches,
// leg raises) since only the three base exercise ids had entries.
public let bodyweightLoadPercentage: [String: Double] = [
    // Push-up family - hand/foot elevation and lever length change the
    // fraction of bodyweight over the hands significantly.
    "wall_push_up": 0.10,
    "incline_push_up": 0.45,
    "knee_push_up": 0.52,
    "push_up": 0.67,
    "wide_push_up": 0.66,
    "military_push_up": 0.68,
    "diamond_push_up": 0.68,
    "pike_push_up": 0.65,
    "decline_push_up": 0.72,
    "pseudo_planche_push_up": 0.78,

    // Pull-up / row family - hanging/rowing bodyweight movements.
    // pull_up itself is a merged exercise (regular/assisted/weighted) whose
    // logged `weight` can be negative (band/machine assistance) or positive
    // (added load) - this percentage is just the bodyweight baseline before
    // that adjustment is added.
    "scapular_pull_up": 0.92,
    "negative_pull_up": 0.92,
    "chin_up": 0.92,
    "pull_up": 0.92,
    "wide_pull_up": 0.92,
    "archer_pull_up": 0.92,
    "typewriter_pull_up": 0.92,
    "explosive_pull_up": 0.92,
    "muscle_up": 0.95,
    "bodyweight_row": 0.70,

    // Core - none of these lift the whole body, only a segment of it
    // (torso, or legs, moving relative to a supported base).
    "crunch": 0.35,
    "russian_twist": 0.30,
    "leg_raise": 0.30,
    "hanging_leg_raise": 0.35,

    // Isometric core holds - multi-point support (forearms/hands + toes),
    // not fully suspended on one contact point.
    "plank": 0.75,
    "side_plank": 0.65,
]

public func bodyweightLoadPercentage(forExerciseId id: String?) -> Double {
    guard let id else { return 1 }
    return bodyweightLoadPercentage[id] ?? 1
}

// The user's bodyweight scaled down to what a given exercise actually loads
// (see bodyweightLoadPercentage). Passes a missing bodyweight through
// unchanged so callers can keep treating nil as "unknown".
public func effectiveBodyweightLoad(exerciseId: String?, latestBodyWeight: Double?) -> Double? {
    guard let latestBodyWeight else { return nil }
    return latestBodyWeight * bodyweightLoadPercentage(forExerciseId: exerciseId)
}

// Exercise ids (from the exercise library seed data) whose distance/route is
// meaningfully trackable via phone GPS. Extend this set as more outdoor
// exercise types are added.
public let outdoorGpsExerciseIds: Set<String> = ["running", "cycling"]

// Custom exercises opt into the same GPS-tracked run/stopwatch UI via the
// "Allow location tracking" toggle on the create-exercise screen, which
// stores a 'Location' entry in the comma-joined properties string (same
// convention as Weighted/Bodyweight/Reps/Duration/Distance).
public func isOutdoorGpsExercise(id: String, properties: [String]?) -> Bool {
    if outdoorGpsExerciseIds.contains(id) { return true }
    guard let properties else { return false }
    return properties.contains { $0.lowercased() == "location" }
}

public func workoutHasOutdoorExercise(_ exercises: [(id: String, properties: [String]?)]) -> Bool {
    exercises.contains { isOutdoorGpsExercise(id: $0.id, properties: $0.properties) }
}

public func isUnilateralExercise(name: String) -> Bool {
    guard !name.isEmpty else { return false }
    let lower = name.lowercased()
    let markers = [
        "single", "one-arm", "one arm", "one-leg", "one leg", "unilateral",
        "dumbbell row", "lunges", "lunge", "split squat",
    ]
    return markers.contains { lower.contains($0) }
}
