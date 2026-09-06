import Foundation

// Ported from apps/myhealth/assets/data/default-exercises.ts —
// ALL_DEFAULT_EXERCISES (134 entries), extracted via a one-off Node script
// and normalized to match how DataRepository.seedDefaultExercises writes
// them into the `exercises` table: `muscleGroups` is muscle_group + the
// secondary_muscles array flattened together (matching the RN read path,
// which never distinguishes primary/secondary for this table), `properties`
// is the comma-joined `type` string split apart, and `equipment` keeps only
// the first listed option — this app tags equipment per logged set, not per
// exercise definition, so a single representative value is enough for
// browsing (see WorkoutExerciseTemplate.equipment).
public let defaultExerciseDataVersion = 58

private struct DefaultExerciseSeed: Decodable {
    let id: String
    let name: String
    let muscleGroups: [String]
    let properties: [String]
    let exerciseDescription: String?
    let difficulty: Double?
    let nextVariations: [String]
    let tips: [String]
    let instructions: [String]
    let equipment: String?
    let movementType: String?
    let attachment: String?
}

public func loadDefaultExercises() -> [ExerciseRecord] {
    guard let url = Bundle.module.url(forResource: "DefaultExercises", withExtension: "json"),
          let data = try? Data(contentsOf: url),
          let seeds = try? JSONDecoder().decode([DefaultExerciseSeed].self, from: data) else {
        return []
    }
    return seeds.map { seed in
        ExerciseRecord(
            id: seed.id,
            name: seed.name,
            muscleGroups: seed.muscleGroups,
            properties: seed.properties,
            exerciseDescription: seed.exerciseDescription,
            difficulty: seed.difficulty,
            nextVariations: seed.nextVariations,
            tips: seed.tips,
            instructions: seed.instructions,
            equipment: seed.equipment,
            movementType: seed.movementType,
            attachment: seed.attachment
        )
    }
}
