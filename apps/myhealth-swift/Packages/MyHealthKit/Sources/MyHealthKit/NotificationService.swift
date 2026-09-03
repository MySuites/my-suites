import Foundation
import UserNotifications

// Ported from apps/myhealth/services/NotificationService.ts — UNUserNotificationCenter
// replaces expo-notifications directly, same capability, no bridge needed.
public enum NotificationService {
    private static let workoutTimeoutReminderId = "active-workout-reminder"

    public static func getPermissions() async -> Bool {
        let settings = await UNUserNotificationCenter.current().notificationSettings()
        return settings.authorizationStatus == .authorized
    }

    @discardableResult
    public static func requestPermissions() async -> Bool {
        do {
            return try await UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge])
        } catch {
            return false
        }
    }

    public static func scheduleDailyReminder(hour: Int, minute: Int) async -> String? {
        await cancelAllReminders()
        guard await getPermissions() else { return nil }

        let content = UNMutableNotificationContent()
        content.title = "🏋️ Daily Workout Reminder"
        content.body = "Time to log your workouts and keep your streak alive!"
        content.sound = .default

        var dateComponents = DateComponents()
        dateComponents.hour = hour
        dateComponents.minute = minute
        let trigger = UNCalendarNotificationTrigger(dateMatching: dateComponents, repeats: true)

        let identifier = UUID().uuidString
        let request = UNNotificationRequest(identifier: identifier, content: content, trigger: trigger)
        do {
            try await UNUserNotificationCenter.current().add(request)
            return identifier
        } catch {
            return nil
        }
    }

    public static func cancelAllReminders() async {
        UNUserNotificationCenter.current().removeAllPendingNotificationRequests()
    }

    public static func scheduleWorkoutTimeoutReminder() async {
        await cancelWorkoutTimeoutReminder()
        guard await getPermissions() else { return }

        let content = UNMutableNotificationContent()
        content.title = "Still Working Out? 🏋️"
        content.body = "Your workout has been running for over 3 hours. Don't forget to log your sets and finish your session!"
        content.sound = .default

        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 3 * 60 * 60, repeats: false)
        let request = UNNotificationRequest(identifier: workoutTimeoutReminderId, content: content, trigger: trigger)
        try? await UNUserNotificationCenter.current().add(request)
    }

    public static func cancelWorkoutTimeoutReminder() async {
        UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: [workoutTimeoutReminderId])
    }
}
