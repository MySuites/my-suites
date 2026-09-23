import Foundation

// Ported from apps/myhealth/assets/data/default-exercises.ts's
// groupExercisesForDisplay/getCollapsedGroupDetails — collapses related
// default-exercise variations (linked via ExerciseRecord.nextVariations)
// into a single group entry for list display, so a long progression chain
// (Wall Push-up -> Incline Push-up -> ... -> Pseudo Planche Push-up) shows
// as one "Push-up" row instead of cluttering the list. Custom exercises
// (not in the seeded default set) are left ungrouped, matching the RN
// original.
public enum ExerciseListItem: Identifiable {
    case single(ExerciseRecord)
    case group(ExerciseGroup)

    public var id: String {
        switch self {
        case .single(let exercise): return exercise.id
        case .group(let group): return group.id
        }
    }

    public var displayName: String {
        switch self {
        case .single(let exercise): return exercise.name
        case .group(let group): return group.name
        }
    }
}

public struct ExerciseGroup: Identifiable {
    public let id: String
    public let name: String
    public let subtitle: String
    public let representative: ExerciseRecord
    public let variations: [ExerciseRecord]
    public let muscleGroups: [String]
}

private let defaultExerciseIds: Set<String> = Set(loadDefaultExercises().map(\.id))

public func groupExercisesForDisplay(_ exercises: [ExerciseRecord]) -> [ExerciseListItem] {
    let defaultExercises = exercises.filter { defaultExerciseIds.contains($0.id) }
    let customExercises = exercises.filter { !defaultExerciseIds.contains($0.id) }
    let byId = Dictionary(uniqueKeysWithValues: defaultExercises.map { ($0.id, $0) })

    var adjacency: [String: Set<String>] = [:]
    for exercise in defaultExercises {
        adjacency[exercise.id, default: []].formUnion([])
        for childId in exercise.nextVariations {
            adjacency[exercise.id, default: []].insert(childId)
            adjacency[childId, default: []].insert(exercise.id)
        }
    }

    var visited: Set<String> = []
    var result: [ExerciseListItem] = []

    for exercise in defaultExercises where !visited.contains(exercise.id) {
        var component: [ExerciseRecord] = []
        var queue = [exercise.id]
        visited.insert(exercise.id)

        while !queue.isEmpty {
            let currentId = queue.removeFirst()
            if let current = byId[currentId] {
                component.append(current)
            }
            for neighborId in adjacency[currentId] ?? [] where !visited.contains(neighborId) {
                visited.insert(neighborId)
                queue.append(neighborId)
            }
        }

        if component.count > 1 {
            // BFS visits neighbors via Set iteration, which has no defined
            // order — sort by difficulty (easiest first) so the expanded
            // list reads as a stable progression instead of shuffling.
            let sortedComponent = component.sorted {
                ($0.difficulty ?? 0, $0.name) < ($1.difficulty ?? 0, $1.name)
            }
            let details = collapsedGroupDetails(for: sortedComponent)
            let representative = sortedComponent.first { $0.id == details.representativeId } ?? sortedComponent[0]
            result.append(.group(ExerciseGroup(
                id: "group_\(details.name.lowercased().replacingOccurrences(of: " ", with: "_"))",
                name: details.name,
                subtitle: details.subtitle,
                representative: representative,
                variations: sortedComponent,
                muscleGroups: Array(Set(sortedComponent.flatMap(\.muscleGroups))).sorted()
            )))
        } else if let only = component.first {
            result.append(.single(only))
        }
    }

    let merged = mergeGroupsSharingAnId(result)
    let combined = merged + customExercises.map { ExerciseListItem.single($0) }
    return combined.sorted { $0.displayName.localizedCaseInsensitiveCompare($1.displayName) == .orderedAscending }
}

// getCollapsedGroupDetails names a component purely by matching substrings
// in its member ids (e.g. anything containing "handstand"), so two BFS
// components that are NOT actually connected by nextVariations — like the
// big frog-stand-to-handstand chain and the separate, disconnected
// wall_straddle_handstand_press -> straddle_handstand_press island — can
// still both land on the same group name/id. Left alone that renders as two
// visually identical "duplicate" rows; merge them into one instead.
private func mergeGroupsSharingAnId(_ items: [ExerciseListItem]) -> [ExerciseListItem] {
    var order: [String] = []
    var groupsById: [String: ExerciseGroup] = [:]
    var singles: [ExerciseListItem] = []

    for item in items {
        switch item {
        case .single:
            singles.append(item)
        case .group(let group):
            if let existing = groupsById[group.id] {
                let mergedVariations = (existing.variations + group.variations)
                    .reduce(into: [ExerciseRecord]()) { acc, exercise in
                        if !acc.contains(where: { $0.id == exercise.id }) { acc.append(exercise) }
                    }
                    .sorted { ($0.difficulty ?? 0, $0.name) < ($1.difficulty ?? 0, $1.name) }
                groupsById[group.id] = ExerciseGroup(
                    id: existing.id,
                    name: existing.name,
                    subtitle: "\(mergedVariations.count) variations",
                    representative: existing.representative,
                    variations: mergedVariations,
                    muscleGroups: Array(Set(existing.muscleGroups + group.muscleGroups)).sorted()
                )
            } else {
                groupsById[group.id] = group
                order.append(group.id)
            }
        }
    }

    return singles + order.compactMap { groupsById[$0] }.map { .group($0) }
}

private func collapsedGroupDetails(for component: [ExerciseRecord]) -> (name: String, representativeId: String, subtitle: String) {
    let ids = component.map(\.id)
    let count = component.count

    func has(_ substrings: String...) -> Bool {
        ids.contains { id in substrings.contains { id.contains($0) } }
    }
    func exact(_ candidates: String...) -> Bool {
        ids.contains { candidates.contains($0) }
    }

    if has("split_squat", "bulgarian") {
        return ("Split Squat", "split_squat", "\(count) variations (Bodyweight, Bulgarian...)")
    }
    if has("lunge") {
        return ("Lunge", "lunges", "\(count) variations (Bodyweight, Weighted...)")
    }
    if exact("push_up", "pushup") {
        return ("Push-up", "push_up", "\(count) variations (Wall, Incline, Knee, Decline...)")
    }
    if exact("weighted_squat", "barbell_squat") {
        return ("Weighted Squat", "weighted_squat", "\(count) variations (Goblet, Barbell, Hack, Pendulum...)")
    }
    if has("squat") {
        return ("Squat", "bodyweight_squat", "\(count) variations (Bodyweight, Sissy, Shrimp, Pistol...)")
    }
    if has("tricep", "skullcrusher") {
        return ("Tricep Extension / Pushdown", "cable_tricep_pushdown", "\(count) variations (Cable, Dumbbell, Overhead, Kickbacks...)")
    }
    if has("lateral_raise", "delt_raise") {
        return ("Lateral Raise", "lateral_raise", "\(count) variations (Dumbbell, Cable, Machine...)")
    }
    if has("shoulder_press", "overhead_press", "arnold_press") {
        return ("Shoulder Press", "shoulder_press", "\(count) variations (Dumbbell, Barbell, Machine, Arnold...)")
    }
    if has("deadlift") {
        return ("Deadlift", "deadlift", "\(count) variations (Standard, Romanian...)")
    }
    if has("calf_raise") {
        return ("Calf Raise", "calf_raise", "\(count) variations (Bodyweight, Dumbbell, Machine...)")
    }
    if has("leg_curl") {
        return ("Leg Curl", "seated_leg_curl", "\(count) variations (Seated, Lying...)")
    }
    if has("leg_press") {
        return ("Leg Press", "leg_press", "\(count) variations (Standard, Horizontal...)")
    }
    if has("plank") {
        return ("Plank", "plank", "\(count) variations (Standard, Side, Weighted...)")
    }
    if exact("pull_up", "pullup") {
        return ("Pull-up", "pull_up", "\(count) variations (Standard, Weighted...)")
    }
    if exact("chin_up", "chinup") {
        return ("Chin-up", "chin_up", "\(count) variations (Standard, Weighted...)")
    }
    if has("handstand", "crow_pose", "frog_stand") {
        return ("Handstand / Balance", "handstand", "\(count) variations (Frog Stand, Crow, Wall, Freestanding...)")
    }
    if has("planche") {
        return ("Planche", "tuck_planche", "\(count) variations (Pseudo Planche, Tuck, Straddle, Full...)")
    }
    if has("front_lever") {
        return ("Front Lever", "tuck_front_lever", "\(count) variations (Tuck, Straddle, Full...)")
    }
    if has("back_lever") {
        return ("Back Lever", "tuck_back_lever", "\(count) variations (Tuck, Straddle, Full...)")
    }

    let sorted = component.sorted { ($0.difficulty ?? 0) < ($1.difficulty ?? 0) }
    let rep = sorted[0]
    return (rep.name, rep.id, "\(count) variations")
}
