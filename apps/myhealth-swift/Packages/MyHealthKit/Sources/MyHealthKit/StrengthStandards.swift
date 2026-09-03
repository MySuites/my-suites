import Foundation

// Ported from apps/myhealth/utils/strengthStandards.ts — see
// SWIFT_MIGRATION_PLAN.md "Domain Logic Reference".
//
// Bodyweight-relative estimated-1RM standards for the "big three" compound
// lifts — the only lifts with widely-agreed public strength norms, which is
// why ranking stops here instead of covering every exercise. Ratios are
// community-consensus ballpark figures (informal, not any single proprietary
// source) for estimated-1RM ÷ bodyweight.

public enum StrengthSex: String {
    case male
    case female
}

public enum StrengthTier: String, CaseIterable {
    case beginner = "Beginner"
    case novice = "Novice"
    case intermediate = "Intermediate"
    case advanced = "Advanced"
    case elite = "Elite"
}

public let rankingSexStorageKey = "strength_ranking_sex"
public let defaultRankingSex: StrengthSex = .male

public struct RankedLift {
    public var exerciseId: String
    public var name: String
    // Push/Pull/Legs — a display grouping only, not a composite score. Each
    // lift is still ranked independently against its own standard.
    public var category: String
}

public let rankedLifts: [RankedLift] = [
    RankedLift(exerciseId: "bench_press", name: "Bench Press", category: "Push"),
    RankedLift(exerciseId: "weighted_squat", name: "Squat", category: "Legs"),
    RankedLift(exerciseId: "deadlift", name: "Deadlift", category: "Pull"),
]

private let tiers = StrengthTier.allCases

// [Beginner, Novice, Intermediate, Advanced, Elite] bodyweight-multiple thresholds.
private let standards: [StrengthSex: [String: [Double]]] = [
    .male: [
        "bench_press": [0.5, 0.75, 1.0, 1.5, 2.0],
        "weighted_squat": [0.5, 0.75, 1.25, 1.75, 2.25],
        "deadlift": [0.75, 1.0, 1.5, 2.0, 2.5],
    ],
    .female: [
        "bench_press": [0.3, 0.45, 0.65, 1.0, 1.35],
        "weighted_squat": [0.35, 0.5, 0.85, 1.2, 1.6],
        "deadlift": [0.5, 0.7, 1.0, 1.4, 1.9],
    ],
]

public struct StrengthRankResult {
    public var ratio: Double
    public var tier: StrengthTier? // nil = below Beginner threshold
    public var nextTier: StrengthTier?
    public var progressToNextTier: Double? // 0-1, nil if no next tier
}

// Reference height each sex's standards table is implicitly calibrated
// against (population-average adult height). Not itself a cited standard —
// published bodyweight-relative tables don't publish a height baseline, so
// this uses the population average as the most defensible zero-point.
private let referenceHeightInches: [StrengthSex: Double] = [
    .male: 69,   // ~175cm
    .female: 64, // ~163cm
]

// Percent the required ratio shifts per inch of height difference from the
// reference. Taller lifters move the bar/torso further per rep (longer
// ROM, worse leverage), so the same tier should require a slightly lower
// ratio the taller you are, and a slightly higher one the shorter you are.
// Squat and deadlift are more ROM-sensitive to height (leg/torso length)
// than bench (mostly arm length), hence the smaller bench coefficient.
// These are a simplifying heuristic, not a peer-reviewed formula — same
// caveat as the base ratio tables above.
private let heightAdjustmentPerInch: [String: Double] = [
    "bench_press": 0.004,     // 0.4%/inch
    "weighted_squat": 0.006,  // 0.6%/inch
    "deadlift": 0.006,        // 0.6%/inch
]

// Cap total adjustment so extreme heights can't push thresholds to
// implausible values.
private let maxHeightAdjustment = 0.15 // ±15%

private func heightAdjustmentFactor(exerciseId: String, sex: StrengthSex, heightInches: Double?) -> Double {
    guard let heightInches, heightInches > 0 else { return 1 }
    guard let perInch = heightAdjustmentPerInch[exerciseId] else { return 1 }
    let diff = heightInches - (referenceHeightInches[sex] ?? 0)
    let adjustment = max(-maxHeightAdjustment, min(maxHeightAdjustment, perInch * diff))
    return 1 - adjustment
}

public func strengthRank(
    exerciseId: String,
    estimatedOneRepMax: Double,
    bodyweight: Double,
    sex: StrengthSex,
    heightInches: Double? = nil
) -> StrengthRankResult? {
    guard bodyweight > 0, estimatedOneRepMax > 0 else { return nil }
    guard let baseThresholds = standards[sex]?[exerciseId] else { return nil }

    let factor = heightAdjustmentFactor(exerciseId: exerciseId, sex: sex, heightInches: heightInches)
    let thresholds = baseThresholds.map { $0 * factor }

    let ratio = estimatedOneRepMax / bodyweight

    var tierIndex = -1
    for i in 0..<thresholds.count where ratio >= thresholds[i] {
        tierIndex = i
    }

    let tier = tierIndex >= 0 ? tiers[tierIndex] : nil
    let nextTierIndex = tierIndex + 1
    let hasNext = nextTierIndex < tiers.count
    let nextTier = hasNext ? tiers[nextTierIndex] : nil

    var progressToNextTier: Double? = nil
    if hasNext {
        let lowerBound = tierIndex >= 0 ? thresholds[tierIndex] : 0
        let upperBound = thresholds[nextTierIndex]
        progressToNextTier = max(0, min(1, (ratio - lowerBound) / (upperBound - lowerBound)))
    }

    return StrengthRankResult(ratio: ratio, tier: tier, nextTier: nextTier, progressToNextTier: progressToNextTier)
}
