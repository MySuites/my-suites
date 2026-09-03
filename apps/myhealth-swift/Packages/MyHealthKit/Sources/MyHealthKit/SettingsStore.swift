import Foundation
import Observation

// Ported from the settings slice of apps/myhealth/providers/WorkoutManagerProvider.tsx.
// UserDefaults replaces the RN app's `utils/storage.ts` (AsyncStorage wrapper).
@Observable
@MainActor
public final class SettingsStore {
    private let defaults: UserDefaults

    public var isRpeEnabled: Bool {
        didSet { defaults.set(isRpeEnabled, forKey: Keys.rpeEnabled) }
    }
    public var isHapticsEnabled: Bool {
        didSet { defaults.set(isHapticsEnabled, forKey: Keys.hapticsEnabled) }
    }
    public var isSoundEnabled: Bool {
        didSet { defaults.set(isSoundEnabled, forKey: Keys.soundEnabled) }
    }
    public var isProgressiveOverloadEnabled: Bool {
        didSet { defaults.set(isProgressiveOverloadEnabled, forKey: Keys.progressiveOverloadEnabled) }
    }
    public var progressiveOverloadRepCeiling: Int {
        didSet { defaults.set(progressiveOverloadRepCeiling, forKey: Keys.repCeiling) }
    }
    public var isLiveActivitiesEnabled: Bool {
        didSet { defaults.set(isLiveActivitiesEnabled, forKey: Keys.liveActivitiesEnabled) }
    }
    public var weeklyGoal: Int {
        didSet { defaults.set(weeklyGoal, forKey: weeklyGoalStorageKey) }
    }

    private enum Keys {
        static let rpeEnabled = "setting.workout.isRpeEnabled"
        static let hapticsEnabled = "setting.workout.isHapticsEnabled"
        static let soundEnabled = "setting.workout.isSoundEnabled"
        static let progressiveOverloadEnabled = "setting.workout.isProgressiveOverloadEnabled"
        static let repCeiling = "setting.workout.progressiveOverloadRepCeiling"
        static let liveActivitiesEnabled = "setting.workout.isLiveActivitiesEnabled"
    }

    public init(defaults: UserDefaults = .standard) {
        self.defaults = defaults
        // Matches the RN provider's load defaults: haptics/sound/progressive
        // overload/live activities default to true when unset, rpe defaults
        // to false, rep ceiling defaults to DEFAULT_REP_CEILING.
        isRpeEnabled = defaults.object(forKey: Keys.rpeEnabled) as? Bool ?? false
        isHapticsEnabled = defaults.object(forKey: Keys.hapticsEnabled) as? Bool ?? true
        isSoundEnabled = defaults.object(forKey: Keys.soundEnabled) as? Bool ?? true
        isProgressiveOverloadEnabled = defaults.object(forKey: Keys.progressiveOverloadEnabled) as? Bool ?? true
        progressiveOverloadRepCeiling = defaults.object(forKey: Keys.repCeiling) as? Int ?? defaultRepCeiling
        isLiveActivitiesEnabled = defaults.object(forKey: Keys.liveActivitiesEnabled) as? Bool ?? true
        weeklyGoal = defaults.object(forKey: weeklyGoalStorageKey) as? Int ?? defaultWeeklyGoal
    }
}
