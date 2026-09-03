import Foundation

// Ported from apps/myhealth/utils/progressiveOverload.ts — see
// SWIFT_MIGRATION_PLAN.md "Domain Logic Reference".
//
// Double progression: at a given weight, add a rep each session until
// hitting the rep ceiling (top of a normal working-set range), then reset
// reps back to the floor and bump the weight. This is the standard,
// exercise-agnostic progressive-overload scheme — safer than a flat linear
// weight increase (which stalls on harder lifts) and simpler than %-of-1RM
// programming (which needs a reliable e1RM history to be accurate).
//
// When recent RPE history is available (RPE tracking enabled), it adjusts
// how aggressively to progress: sets that have felt easy get pushed harder,
// sets that have felt near-max get held steady instead of piled on.

public let defaultRepCeiling = 12
public let repCeilingMin = 6
public let repCeilingMax = 30
public let weightIncrementLb = 5.0
public let weightIncrementLbAggressive = 10.0
public let rpeEasyThreshold = 6.0
public let rpeHardThreshold = 9.0

public struct PreviousSetLog {
    public var weight: Double?
    public var reps: Int?
    public var repsLeft: Int?
    public var repsRight: Int?
    public var duration: Int?

    public init(weight: Double? = nil, reps: Int? = nil, repsLeft: Int? = nil, repsRight: Int? = nil, duration: Int? = nil) {
        self.weight = weight
        self.reps = reps
        self.repsLeft = repsLeft
        self.repsRight = repsRight
        self.duration = duration
    }
}

public struct SuggestedGoal {
    // Weight is always in lb (canonical storage unit) — convert for display
    // at the call site, same as everywhere else weight is shown.
    public var weight: Double
    public var reps: Int
}

// Recent sets have been near-max effort — hold steady rather than pile on.
private func isHardRpe(_ avgRpe: Double?) -> Bool {
    guard let avgRpe else { return false }
    return avgRpe >= rpeHardThreshold
}

// Recent sets have felt easy — push harder than the standard increment.
private func isEasyRpe(_ avgRpe: Double?) -> Bool {
    guard let avgRpe else { return false }
    return avgRpe <= rpeEasyThreshold
}

// Single-limb (or bilateral) suggestion from a previous weight/reps pair,
// optionally weighted by recent average RPE for this set. The floor (where
// reps reset to after a weight bump) scales with the ceiling, keeping the
// same 4-rep working range as the 8-12 default regardless of what ceiling
// the user configures.
private func suggestFromPair(prevWeight: Double?, prevReps: Int?, avgRpe: Double?, repCeiling: Int) -> SuggestedGoal? {
    guard let prevWeight, let prevReps else { return nil }
    let repFloor = max(1, repCeiling - 4)

    if isHardRpe(avgRpe) {
        return SuggestedGoal(weight: prevWeight, reps: prevReps)
    }

    let isEasy = isEasyRpe(avgRpe)

    if prevReps >= repCeiling {
        return SuggestedGoal(
            weight: prevWeight + (isEasy ? weightIncrementLbAggressive : weightIncrementLb),
            reps: repFloor
        )
    }
    return SuggestedGoal(weight: prevWeight, reps: min(repCeiling, prevReps + (isEasy ? 2 : 1)))
}

public func suggestedGoal(prev: PreviousSetLog?, avgRpe: Double? = nil, repCeiling: Int = defaultRepCeiling) -> SuggestedGoal? {
    guard let prev else { return nil }
    return suggestFromPair(prevWeight: prev.weight, prevReps: prev.reps, avgRpe: avgRpe, repCeiling: repCeiling)
}

// Unilateral suggestion uses the weaker (lower-rep) side to drive the
// weight/rep bump, so the suggestion never asks the weaker side to jump
// straight to a rep count it hasn't proven it can hit.
public func suggestedUnilateralGoal(prev: PreviousSetLog?, avgRpe: Double? = nil, repCeiling: Int = defaultRepCeiling) -> SuggestedGoal? {
    guard let prev else { return nil }
    let left = prev.repsLeft ?? prev.reps
    let right = prev.repsRight ?? prev.reps
    guard let left, let right, let prevWeight = prev.weight else { return nil }
    return suggestFromPair(prevWeight: prevWeight, prevReps: min(left, right), avgRpe: avgRpe, repCeiling: repCeiling)
}

// Same double-progression idea applied to timed holds (planks, dead hangs,
// etc.): add seconds each session until a duration ceiling, then — for
// weighted holds — reset the timer and add load, same as the rep version.
// For bodyweight-only holds (no weight to add), just keep extending past the
// ceiling since there's no natural "reset point" without added resistance.
public let defaultDurationCeilingSec = 60
public let durationCeilingMinSec = 15
public let durationCeilingMaxSec = 300
public let durationIncrementSec = 5
public let durationIncrementSecAggressive = 10

public struct SuggestedDurationGoal {
    // Present only if the exercise also tracks weight (e.g. weighted plank).
    public var weight: Double?
    public var duration: Int
}

public func suggestedDurationGoal(prev: PreviousSetLog?, avgRpe: Double? = nil, durationCeiling: Int = defaultDurationCeilingSec) -> SuggestedDurationGoal? {
    guard let prev, let prevDuration = prev.duration else { return nil }
    let prevWeight = prev.weight
    let hasWeight = prevWeight != nil
    let durationFloor = max(5, durationCeiling - 20)

    if isHardRpe(avgRpe) {
        return hasWeight
            ? SuggestedDurationGoal(weight: prevWeight, duration: prevDuration)
            : SuggestedDurationGoal(weight: nil, duration: prevDuration)
    }

    let isEasy = isEasyRpe(avgRpe)
    let increment = isEasy ? durationIncrementSecAggressive : durationIncrementSec

    if prevDuration >= durationCeiling {
        if hasWeight {
            return SuggestedDurationGoal(
                weight: prevWeight! + (isEasy ? weightIncrementLbAggressive : weightIncrementLb),
                duration: durationFloor
            )
        }
        // No load to add — keep extending the hold past the ceiling.
        return SuggestedDurationGoal(weight: nil, duration: prevDuration + increment)
    }

    let nextDuration = hasWeight ? min(durationCeiling, prevDuration + increment) : prevDuration + increment
    return SuggestedDurationGoal(weight: hasWeight ? prevWeight : nil, duration: nextDuration)
}
