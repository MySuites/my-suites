import Foundation
import Observation
import SwiftUI

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

    // MARK: - Ported from apps/myhealth/app/settings/index.tsx local prefs
    // (previously plain utils/storage.ts keys, no dedicated provider on the RN side)

    public var unitSystem: UnitSystem {
        didSet { defaults.set(unitSystem.rawValue, forKey: Keys.unitSystem) }
    }
    /// Canonical height in inches. `nil` until the user enters one (RN: `HEIGHT_STORAGE_KEY`, unset key).
    public var heightInches: Double? {
        didSet { defaults.set(heightInches, forKey: Keys.heightInches) }
    }
    public var autoSavePhotosToGallery: Bool {
        didSet { defaults.set(autoSavePhotosToGallery, forKey: Keys.autoSavePhotos) }
    }
    public var developerMode: Bool {
        didSet { defaults.set(developerMode, forKey: Keys.developerMode) }
    }
    public var pushNotificationsEnabled: Bool {
        didSet { defaults.set(pushNotificationsEnabled, forKey: Keys.pushNotificationsEnabled) }
    }
    public var dailyReminderEnabled: Bool {
        didSet { defaults.set(dailyReminderEnabled, forKey: Keys.dailyReminderEnabled) }
    }
    public var reminderHour: Int {
        didSet { defaults.set(reminderHour, forKey: Keys.reminderHour) }
    }
    public var reminderMinute: Int {
        didSet { defaults.set(reminderMinute, forKey: Keys.reminderMinute) }
    }
    public var longWorkoutReminderEnabled: Bool {
        didSet { defaults.set(longWorkoutReminderEnabled, forKey: Keys.longWorkoutReminderEnabled) }
    }
    public var longWorkoutReminderMinutes: Int {
        didSet { defaults.set(longWorkoutReminderMinutes, forKey: Keys.longWorkoutReminderMinutes) }
    }
    public var gpsTrackingEnabled: Bool {
        didSet { defaults.set(gpsTrackingEnabled, forKey: Keys.gpsTrackingEnabled) }
    }

    public var appearance: Appearance {
        didSet { defaults.set(appearance.rawValue, forKey: Keys.appearance) }
    }

    public enum UnitSystem: String {
        case imperial, metric
    }

    // Ported from apps/myhealth/providers/AppThemeProvider.tsx's ThemePreference.
    public enum Appearance: String, CaseIterable {
        case system, light, dark

        public var colorScheme: ColorScheme? {
            switch self {
            case .system: return nil
            case .light: return .light
            case .dark: return .dark
            }
        }
    }

    private enum Keys {
        static let rpeEnabled = "setting.workout.isRpeEnabled"
        static let hapticsEnabled = "setting.workout.isHapticsEnabled"
        static let soundEnabled = "setting.workout.isSoundEnabled"
        static let progressiveOverloadEnabled = "setting.workout.isProgressiveOverloadEnabled"
        static let repCeiling = "setting.workout.progressiveOverloadRepCeiling"
        static let liveActivitiesEnabled = "setting.workout.isLiveActivitiesEnabled"
        static let unitSystem = "unit_preference_system"
        static let heightInches = "height_inches"
        static let autoSavePhotos = "auto_save_photos_to_gallery"
        static let developerMode = "developer_mode"
        static let pushNotificationsEnabled = "push_notifications_enabled"
        static let dailyReminderEnabled = "notifications_enabled"
        static let reminderHour = "notification_reminder_hour"
        static let reminderMinute = "notification_reminder_minute"
        static let longWorkoutReminderEnabled = "long_workout_reminder_enabled"
        static let longWorkoutReminderMinutes = "long_workout_duration"
        static let gpsTrackingEnabled = "gps_tracking_enabled"
        static let appearance = "theme_preference"
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

        unitSystem = UnitSystem(rawValue: defaults.string(forKey: Keys.unitSystem) ?? "") ?? .imperial
        heightInches = defaults.object(forKey: Keys.heightInches) as? Double
        autoSavePhotosToGallery = defaults.bool(forKey: Keys.autoSavePhotos)
        developerMode = defaults.bool(forKey: Keys.developerMode)
        pushNotificationsEnabled = defaults.bool(forKey: Keys.pushNotificationsEnabled)
        dailyReminderEnabled = defaults.bool(forKey: Keys.dailyReminderEnabled)
        reminderHour = defaults.object(forKey: Keys.reminderHour) as? Int ?? 9
        reminderMinute = defaults.object(forKey: Keys.reminderMinute) as? Int ?? 0
        longWorkoutReminderEnabled = defaults.bool(forKey: Keys.longWorkoutReminderEnabled)
        longWorkoutReminderMinutes = defaults.object(forKey: Keys.longWorkoutReminderMinutes) as? Int ?? 90
        gpsTrackingEnabled = defaults.bool(forKey: Keys.gpsTrackingEnabled)
        appearance = Appearance(rawValue: defaults.string(forKey: Keys.appearance) ?? "") ?? .system
    }
}

// MARK: - Height unit conversion (ported from apps/myhealth/utils/height.ts)

public func inchesToCm(_ inches: Double) -> Double { inches * 2.54 }
public func cmToInches(_ cm: Double) -> Double { cm / 2.54 }
public func feetInchesToTotalInches(_ feet: Int, _ inches: Int) -> Double { Double(feet * 12 + inches) }
public func totalInchesToFeetInches(_ totalInches: Double) -> (feet: Int, inches: Int) {
    let total = Int(totalInches.rounded())
    return (total / 12, total % 12)
}
