import { useState, useEffect, useCallback } from 'react';
import { View, Text, Alert, ScrollView, Switch, InteractionManager, TouchableOpacity, Platform } from 'react-native';
import { useUITheme, ThemeToggle, IconSymbol, useToast, RaisedCard } from '@mysuite/ui';

import { DataRepository } from '../../providers/DataRepository';
import { useThemePreference } from '../../providers/AppThemeProvider';
import { useWorkoutManager } from '../../providers/WorkoutManagerProvider';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { BackButton } from '../../components/ui/BackButton';
import { BodyWeightService } from '../../services/BodyWeightService';
import { HealthKitService } from '../../services/HealthKitService';
import { NotificationService } from '../../services/NotificationService';
import { storage } from '../../utils/storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as WebBrowser from 'expo-web-browser';
import { router } from 'expo-router';

const PRIVACY_POLICY_URL = 'https://mysuites.github.io/my-suites/privacy_policy.html';
const TERMS_OF_SERVICE_URL = 'https://mysuites.github.io/my-suites/tos.html';

export default function SettingsScreen() {
  const theme = useUITheme();
  const { preference, setPreference } = useThemePreference();
  const { showToast } = useToast();
  const { isRpeEnabled, setIsRpeEnabled } = useWorkoutManager();
  const handleDeleteData = () => {
    Alert.alert(
        "Delete All Data?",
        "This will permanently delete ALL workouts, logs, and measurements stored on this device. This action cannot be undone.",
        [
            { text: "Cancel", style: "cancel" },
            { 
                text: "Delete", 
                style: "destructive", 
                onPress: async () => {
                    try {
                        // 1. Delete Local Data
                        await DataRepository.clearAllLocalData();
                        
                        // 2. Reseed Default Data
                        await DataRepository.seedDefaultExercises();

                        // 3. Disable HealthKit Sync
                        await HealthKitService.disableSync();

                        // 4. Refresh State
                        await checkHealthStatus();
                        
                        showToast({ message: "All data reset and reseeded", type: 'success' });
                    } catch (error) {
                        console.error("Delete data error:", error);
                        Alert.alert("Error", "Failed to delete data.");
                    }
                }
            }
        ]
    );
  };

  const [isHealthConnected, setIsHealthConnected] = useState(false);
  const [autoSavePhotos, setAutoSavePhotos] = useState(false);
  const [developerMode, setDeveloperMode] = useState(false);
  const [pushNotificationsEnabled, setPushNotificationsEnabled] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [longWorkoutReminderEnabled, setLongWorkoutReminderEnabled] = useState(false);
  const [longWorkoutDuration, setLongWorkoutDuration] = useState(90);
  const [reminderHour, setReminderHour] = useState(9);
  const [reminderMinute, setReminderMinute] = useState(0);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const getReminderDate = (hour: number, minute: number) => {
    const d = new Date();
    d.setHours(hour);
    d.setMinutes(minute);
    d.setSeconds(0);
    return d;
  };

  const formatTime = (hour: number, minute: number) => {
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h = hour % 12 || 12;
    const m = minute.toString().padStart(2, '0');
    return `${h}:${m} ${ampm}`;
  };

  const handleToggleNotifications = async (value: boolean) => {
    if (value) {
      const granted = await NotificationService.requestPermissions();
      if (granted) {
        setNotificationsEnabled(true);
        await storage.setItem('notifications_enabled', true);
        await NotificationService.scheduleDailyReminder(reminderHour, reminderMinute);
        showToast({ message: "Daily reminder enabled", type: 'success' });
      } else {
        setNotificationsEnabled(false);
        await storage.setItem('notifications_enabled', false);
        Alert.alert(
          "Permission Denied",
          "Please enable notification permissions for MyHealth in your system settings to receive reminders.",
          [{ text: "OK" }]
        );
      }
    } else {
      setNotificationsEnabled(false);
      await storage.setItem('notifications_enabled', false);
      await NotificationService.cancelAllReminders();
      showToast({ message: "Daily reminder disabled", type: 'success' });
    }
  };

  const handleTogglePushNotifications = async (value: boolean) => {
    if (value) {
      const granted = await NotificationService.requestPermissions();
      if (granted) {
        setPushNotificationsEnabled(true);
        await storage.setItem('push_notifications_enabled', true);
        showToast({ message: "Push notifications enabled", type: 'success' });
      } else {
        setPushNotificationsEnabled(false);
        await storage.setItem('push_notifications_enabled', false);
        Alert.alert(
          "Permission Denied",
          "Please enable notification permissions for MyHealth in your system settings to receive push notifications.",
          [{ text: "OK" }]
        );
      }
    } else {
      setPushNotificationsEnabled(false);
      await storage.setItem('push_notifications_enabled', false);
      showToast({ message: "Push notifications disabled", type: 'success' });
    }
  };

  const handleToggleLongWorkoutReminder = async (value: boolean) => {
    setLongWorkoutReminderEnabled(value);
    await storage.setItem('long_workout_reminder_enabled', value);
    showToast({ 
      message: value ? "Long workout reminder enabled" : "Long workout reminder disabled", 
      type: 'success' 
    });
  };

  const handleUpdateLongWorkoutDuration = async (minutes: number) => {
    setLongWorkoutDuration(minutes);
    await storage.setItem('long_workout_duration', minutes);
  };

  const handleTimeChange = async (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (selectedDate) {
      const hour = selectedDate.getHours();
      const minute = selectedDate.getMinutes();
      setReminderHour(hour);
      setReminderMinute(minute);
      await storage.setItem('notification_reminder_hour', hour);
      await storage.setItem('notification_reminder_minute', minute);
      
      if (notificationsEnabled) {
        await NotificationService.scheduleDailyReminder(hour, minute);
        showToast({ message: `Reminder rescheduled to ${formatTime(hour, minute)}`, type: 'success' });
      }
    }
  };

  useEffect(() => {
    async function loadPrefs() {
      const val = await storage.getItem<boolean>('auto_save_photos_to_gallery');
      setAutoSavePhotos(!!val);
      const devVal = await storage.getItem<boolean>('developer_mode');
      setDeveloperMode(!!devVal);

      const pushNotifEnabled = await storage.getItem<boolean>('push_notifications_enabled');
      setPushNotificationsEnabled(!!pushNotifEnabled);

      const notifEnabled = await storage.getItem<boolean>('notifications_enabled');
      setNotificationsEnabled(!!notifEnabled);
      const hour = await storage.getItem<number>('notification_reminder_hour');
      const minute = await storage.getItem<number>('notification_reminder_minute');
      if (hour !== null) setReminderHour(hour);
      if (minute !== null) setReminderMinute(minute);

      const longWorkoutEnabled = await storage.getItem<boolean>('long_workout_reminder_enabled');
      setLongWorkoutReminderEnabled(!!longWorkoutEnabled);
      const duration = await storage.getItem<number>('long_workout_duration');
      if (duration !== null) setLongWorkoutDuration(duration);
    }
    loadPrefs();
  }, []);

  const checkHealthStatus = useCallback(async () => {
    const isAuth = await HealthKitService.isAuthorized();
    setIsHealthConnected(isAuth);
  }, []);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const task = InteractionManager.runAfterInteractions(() => {
        // Defer heavy bridge work (HealthKit APIs) until after the screen transition is fully settled
        timeout = setTimeout(() => {
            checkHealthStatus();
            BodyWeightService.syncWithHealthKit(null);
        }, 200);
    });
    return () => {
        task.cancel();
        if (timeout) clearTimeout(timeout);
    };
  }, [checkHealthStatus]);

  const handleConnectHealth = async () => {
    try {
      await HealthKitService.initHealthKit();
      await HealthKitService.enableSync();
      await BodyWeightService.syncWithHealthKit(null);
      showToast({ message: "HealthKit synced successfully", type: 'success' });
      await checkHealthStatus();
    } catch (error) {
      console.error("HealthKit init error:", error);
      showToast({ message: "Failed to sync HealthKit", type: 'error' });
    }
  };


  return (
    <View className="flex-1 bg-light dark:bg-dark">
      <ScreenHeader 
        title="Settings" 
        leftAction={<BackButton />} 
      />

      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 140 }}>
        
        <View className="mb-6">
          <Text className="text-sm font-semibold text-gray-500 mb-2 uppercase">Appearance</Text>
          <ThemeToggle preference={preference} setPreference={setPreference} />
        </View>

        <View className="mb-6">
          <Text className="text-sm font-semibold text-gray-500 mb-2 uppercase">Legal</Text>
          <View className="flex-row justify-between items-center py-3 border-b border-light dark:border-dark">
            <Text className="text-base text-light dark:text-dark">Privacy Policy</Text>
            <RaisedCard 
              onPress={() => WebBrowser.openBrowserAsync(PRIVACY_POLICY_URL)}
              className="w-10 h-10 active:h-9 p-0 rounded-full items-center justify-center"
              style={{ borderRadius: 9999 }}
            >
              <IconSymbol name="chevron.right" size={20} color={theme.primary} />
            </RaisedCard>
          </View>
          <View className="flex-row justify-between items-center py-3 border-b border-light dark:border-dark">
            <Text className="text-base text-light dark:text-dark">Terms of Service</Text>
            <RaisedCard 
              onPress={() => WebBrowser.openBrowserAsync(TERMS_OF_SERVICE_URL)}
              className="w-10 h-10 active:h-9 p-0 rounded-full items-center justify-center"
              style={{ borderRadius: 9999 }}
            >
              <IconSymbol name="chevron.right" size={20} color={theme.primary} />
            </RaisedCard>
          </View>
        </View>

        <View className="mb-6">
          <Text className="text-sm font-semibold text-gray-500 mb-2 uppercase">Photos</Text>
          <View className="flex-row justify-between items-center py-3 border-b border-light dark:border-dark">
            <Text className="text-base text-light dark:text-dark">Auto-Save Progress Photos</Text>
            <Switch
              value={autoSavePhotos}
              onValueChange={async (value) => {
                setAutoSavePhotos(value);
                await storage.setItem('auto_save_photos_to_gallery', value);
                showToast({ 
                  message: value ? "Auto-save enabled" : "Auto-save disabled", 
                  type: 'success' 
                });
              }}
              trackColor={{ false: theme.card, true: theme.primary }}
              thumbColor={autoSavePhotos ? "#ffffff" : "#f4f3f4"}
            />
          </View>
        </View>

        <View className="mb-6">
          <Text className="text-sm font-semibold text-gray-500 mb-2 uppercase">Integrations</Text>
          <View className="flex-row justify-between items-center py-3 border-b border-light dark:border-dark">
            <Text className="text-base text-light dark:text-dark">Apple Health</Text>
            <Switch
              value={isHealthConnected}
              onValueChange={async (value) => {
                if (value) {
                    await handleConnectHealth();
                } else {
                    await HealthKitService.disableSync();
                    await checkHealthStatus();
                    showToast({ message: "HealthKit sync stopped", type: 'success' });
                }
              }}
              trackColor={{ false: theme.card, true: theme.primary }}
              thumbColor={isHealthConnected ? "#ffffff" : "#f4f3f4"}
            />
          </View>
        </View>

        <View className="mb-6">
          <Text className="text-sm font-semibold text-gray-500 mb-2 uppercase">Notifications</Text>
          <View className="flex-row justify-between items-center py-3 border-b border-light dark:border-dark">
            <Text className="text-base text-light dark:text-dark">Push Notifications</Text>
            <Switch
              testID="push-notifications-switch"
              value={pushNotificationsEnabled}
              onValueChange={handleTogglePushNotifications}
              trackColor={{ false: theme.card, true: theme.primary }}
              thumbColor={pushNotificationsEnabled ? "#ffffff" : "#f4f3f4"}
            />
          </View>
          <View className="flex-row justify-between items-center py-3 border-b border-light dark:border-dark pl-6" style={{ opacity: pushNotificationsEnabled ? 1 : 0.5 }}>
            <Text className="text-base text-light dark:text-dark">Daily Workout Reminder</Text>
            <Switch
              testID="daily-reminder-switch"
              value={notificationsEnabled}
              onValueChange={handleToggleNotifications}
              disabled={!pushNotificationsEnabled}
              trackColor={{ false: theme.card, true: theme.primary }}
              thumbColor={notificationsEnabled ? "#ffffff" : "#f4f3f4"}
            />
          </View>
          {notificationsEnabled && pushNotificationsEnabled && (
            <>
              <View className="flex-row justify-between items-center py-3 border-b border-light dark:border-dark pl-6">
                <Text className="text-base text-light dark:text-dark font-medium">Reminder Time</Text>
                <TouchableOpacity 
                  onPress={() => setShowTimePicker(!showTimePicker)}
                  className="px-3 py-1.5 bg-light dark:bg-dark rounded-lg flex-row items-center"
                >
                  <Text className="text-base text-light dark:text-dark font-medium mr-1">
                    {formatTime(reminderHour, reminderMinute)}
                  </Text>
                  <IconSymbol name="chevron.down" size={16} color={theme.primary} />
                </TouchableOpacity>
              </View>
              {showTimePicker && (
                <View className="bg-light dark:bg-dark p-2 rounded-xl mt-1 ml-6">
                  <DateTimePicker
                    value={getReminderDate(reminderHour, reminderMinute)}
                    mode="time"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleTimeChange}
                  />
                  {Platform.OS === 'ios' && (
                    <TouchableOpacity 
                      onPress={() => setShowTimePicker(false)}
                      className="mt-2 px-4 py-2 bg-primary rounded-lg items-center"
                      style={{ backgroundColor: theme.primary }}
                    >
                      <Text className="text-white font-semibold">Done</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </>
          )}
          <View className="flex-row justify-between items-center py-3 border-b border-light dark:border-dark pl-6" style={{ opacity: pushNotificationsEnabled ? 1 : 0.5 }}>
            <Text className="text-base text-light dark:text-dark">Long Workout Reminder</Text>
            <Switch
              testID="long-workout-reminder-switch"
              value={longWorkoutReminderEnabled}
              onValueChange={handleToggleLongWorkoutReminder}
              disabled={!pushNotificationsEnabled}
              trackColor={{ false: theme.card, true: theme.primary }}
              thumbColor={longWorkoutReminderEnabled ? "#ffffff" : "#f4f3f4"}
            />
          </View>
          {longWorkoutReminderEnabled && pushNotificationsEnabled && (
            <View className="flex-row justify-between items-center py-3 border-b border-light dark:border-dark pl-12">
              <Text className="text-base text-light dark:text-dark font-medium">Duration (minutes)</Text>
              <View className="flex-row items-center gap-2">
                <TouchableOpacity 
                  onPress={() => handleUpdateLongWorkoutDuration(Math.max(30, longWorkoutDuration - 15))}
                  className="px-3 py-1.5 bg-light dark:bg-dark rounded-lg"
                >
                  <Text className="text-base font-semibold" style={{ color: theme.primary }}>−</Text>
                </TouchableOpacity>
                <Text className="text-base text-light dark:text-dark font-medium w-12 text-center">
                  {longWorkoutDuration}
                </Text>
                <TouchableOpacity 
                  onPress={() => handleUpdateLongWorkoutDuration(Math.min(180, longWorkoutDuration + 15))}
                  className="px-3 py-1.5 bg-light dark:bg-dark rounded-lg"
                >
                  <Text className="text-base font-semibold" style={{ color: theme.primary }}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        <View className="mb-6">
          <Text className="text-sm font-semibold text-gray-500 mb-2 uppercase">Workouts</Text>
          <View className="flex-row justify-between items-center py-3 border-b border-light dark:border-dark">
            <Text className="text-base text-light dark:text-dark font-medium">Enable RPE Tracking</Text>
            <Switch
              value={isRpeEnabled}
              onValueChange={async (value) => {
                await setIsRpeEnabled(value);
                showToast({ 
                  message: value ? "RPE tracking enabled" : "RPE tracking disabled", 
                  type: 'success' 
                });
              }}
              trackColor={{ false: theme.card, true: theme.primary }}
              thumbColor={isRpeEnabled ? "#ffffff" : "#f4f3f4"}
            />
          </View>
        </View>

        <View className="mb-6">
          <Text className="text-sm font-semibold text-gray-500 mb-2 uppercase">Developer</Text>
          <View className="flex-row justify-between items-center py-3 border-b border-light dark:border-dark">
            <Text className="text-base text-light dark:text-dark">Developer Mode</Text>
            <Switch
              value={developerMode}
              onValueChange={async (value) => {
                setDeveloperMode(value);
                await storage.setItem('developer_mode', value);
                showToast({ 
                  message: value ? "Developer mode enabled" : "Developer mode disabled", 
                  type: 'success' 
                });
              }}
              trackColor={{ false: theme.card, true: theme.primary }}
              thumbColor={developerMode ? "#ffffff" : "#f4f3f4"}
            />
          </View>
          {developerMode && (
            <View className="flex-row justify-between items-center py-3 border-b border-light dark:border-dark">
              <Text className="text-base text-light dark:text-dark font-medium">View SQLite Database</Text>
              <RaisedCard 
                onPress={() => router.push('/settings/developer/database' as any)}
                className="w-10 h-10 active:h-9 p-0 rounded-full items-center justify-center"
                style={{ borderRadius: 9999 }}
              >
                <IconSymbol name="chevron.right" size={20} color={theme.primary} />
              </RaisedCard>
            </View>
          )}
        </View>

        <View className="mb-6">
          <Text className="text-sm font-semibold text-gray-500 mb-2 uppercase">Data</Text>
          <View className="flex-row justify-between items-center py-3 border-b border-light dark:border-dark">
            <Text className="text-base text-danger">Delete Data</Text>
            <RaisedCard
              testID="delete-data-btn"
              onPress={handleDeleteData}
              className="w-10 h-10 p-0 rounded-full items-center justify-center"
              style={{ borderRadius: 9999 }}
            >
              <IconSymbol name="trash.fill" size={20} color={theme.danger} />
            </RaisedCard>
          </View>
        </View>
        
        <Text className="text-center text-xs text-gray-500 mt-6">Version 1.5.27
        </Text>
      </ScrollView>
    </View>
  );
}
