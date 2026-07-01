import * as Notifications from 'expo-notifications';

export const NotificationService = {
  /**
   * Register the notification handler for foreground notifications.
   */
  registerForegroundHandler() {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  },

  /**
   * Check if the notification permission is granted.
   */
  async getPermissions(): Promise<boolean> {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Failed to get notification permissions:', error);
      return false;
    }
  },

  /**
   * Request notification permission from the user.
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Failed to request notification permissions:', error);
      return false;
    }
  },

  /**
   * Schedule a daily repeating reminder notification.
   */
  async scheduleDailyReminder(hour: number, minute: number): Promise<string | null> {
    try {
      // First clear any previously scheduled reminders to avoid duplicates.
      await this.cancelAllReminders();

      // Check permission before scheduling
      const hasPermission = await this.getPermissions();
      if (!hasPermission) {
        console.warn('Cannot schedule notification: permission not granted');
        return null;
      }

      // Schedule the new daily notification
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🏋️ Daily Workout Reminder',
          body: 'Time to log your workouts and keep your streak alive!',
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
        } as any, // Cast trigger configuration to prevent strict type compiler errors in some environments
      });

      console.log(`Daily reminder scheduled successfully for ${hour}:${minute.toString().padStart(2, '0')} with ID: ${identifier}`);
      return identifier;
    } catch (error) {
      console.error('Failed to schedule daily reminder:', error);
      return null;
    }
  },

  /**
   * Cancel all scheduled notifications.
   */
  async cancelAllReminders(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('All scheduled notifications cancelled successfully');
    } catch (error) {
      console.error('Failed to cancel scheduled notifications:', error);
    }
  }
};
