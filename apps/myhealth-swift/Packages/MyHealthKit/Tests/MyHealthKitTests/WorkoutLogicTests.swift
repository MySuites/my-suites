import XCTest
@testable import MyHealthKit

// Spot-checks against apps/myhealth/__tests__/workout.test.ts — full parity
// suite is Phase 2/3 work as more logic gets ported.
final class WorkoutLogicTests: XCTestCase {
    func testEffectiveSetWeightSumsBodyweightAndAssistance() {
        let assisted = SetLog(bodyweight: 150, weight: -20)
        XCTAssertEqual(effectiveSetWeight(assisted), 130)
    }

    func testEffectiveSetWeightFallsBackToWeightOnly() {
        let weighted = SetLog(bodyweight: nil, weight: 135)
        XCTAssertEqual(effectiveSetWeight(weighted), 135)
    }

    func testBodyweightLoadPercentageDefaultsToFull() {
        XCTAssertEqual(bodyweightLoadPercentage(forExerciseId: "unknown_id"), 1)
        XCTAssertEqual(bodyweightLoadPercentage(forExerciseId: "push_up"), 0.67)
    }

    func testIsOutdoorGpsExerciseChecksLocationProperty() {
        XCTAssertTrue(isOutdoorGpsExercise(id: "running", properties: nil))
        XCTAssertTrue(isOutdoorGpsExercise(id: "custom_walk", properties: ["Weighted", "Location"]))
        XCTAssertFalse(isOutdoorGpsExercise(id: "custom_walk", properties: ["Weighted"]))
    }
}

final class ProgressiveOverloadTests: XCTestCase {
    func testHardRpeHoldsSteady() {
        let prev = PreviousSetLog(weight: 100, reps: 10)
        let goal = suggestedGoal(prev: prev, avgRpe: 9.5)
        XCTAssertEqual(goal?.weight, 100)
        XCTAssertEqual(goal?.reps, 10)
    }

    func testAtCeilingBumpsWeightAndResetsToFloor() {
        let prev = PreviousSetLog(weight: 100, reps: 12)
        let goal = suggestedGoal(prev: prev)
        XCTAssertEqual(goal?.weight, 105)
        XCTAssertEqual(goal?.reps, 8)
    }

    func testUnilateralUsesWeakerSide() {
        let prev = PreviousSetLog(weight: 40, repsLeft: 8, repsRight: 12)
        let goal = suggestedUnilateralGoal(prev: prev)
        XCTAssertEqual(goal?.reps, 9)
    }
}

final class StrengthStandardsTests: XCTestCase {
    func testReturnsNilForUnrankedExercise() {
        XCTAssertNil(strengthRank(exerciseId: "curl", estimatedOneRepMax: 50, bodyweight: 180, sex: .male))
    }

    func testTiersAgainstBaseThresholds() {
        let result = strengthRank(exerciseId: "bench_press", estimatedOneRepMax: 180, bodyweight: 180, sex: .male)
        XCTAssertEqual(result?.tier, .intermediate)
    }
}
