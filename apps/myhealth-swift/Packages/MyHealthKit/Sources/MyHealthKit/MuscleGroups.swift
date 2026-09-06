import Foundation

// Ported from apps/myhealth/assets/data/muscle-groups.ts.
public let muscleGroups: [String] = [
    "Abdominals", "Abductors", "Adductors", "Biceps", "Calves", "Chest",
    "Forearms", "Glutes", "Hamstrings", "Lats", "Lower back", "Other",
    "Quadriceps", "Shoulders", "Tibialis", "Traps", "Triceps",
]

public enum ExerciseProperty: String, CaseIterable {
    case weighted = "Weighted"
    case bodyweight = "Bodyweight"
    case reps = "Reps"
    case duration = "Duration"
    case distance = "Distance"
}
