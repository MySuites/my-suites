import { useState, useEffect, useCallback } from 'react';
import { View, Text, Alert, ScrollView, InteractionManager, TouchableOpacity, Platform, TextInput } from 'react-native';
import { useUITheme, ThemeToggle, IconSymbol, useToast } from '@mysuite/ui';

import { DataRepository } from '../../providers/DataRepository';
import { useThemePreference } from '../../providers/AppThemeProvider';
import { useWorkoutManager } from '../../providers/WorkoutManagerProvider';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { BackButton } from '../../components/ui/BackButton';
import { BodyWeightService } from '../../services/BodyWeightService';
import { HealthKitService } from '../../services/HealthKitService';
import { WorkoutHealthKitSyncService } from '../../services/WorkoutHealthKitSyncService';
import { NotificationService } from '../../services/NotificationService';
import { storage } from '../../utils/storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as WebBrowser from 'expo-web-browser';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { router } from 'expo-router';
import * as Application from 'expo-application';
import { buildUserDataExport } from '../../utils/exportUserData';
import { WEEKLY_GOAL_STORAGE_KEY, DEFAULT_WEEKLY_GOAL } from '../../utils/weeklyGoal';
import { WorkoutLocationTrackingService } from '../../services/WorkoutLocationTrackingService';
import { REP_CEILING_MIN, REP_CEILING_MAX } from '../../utils/progressiveOverload';
import { useUnitPreference } from '../../providers/UnitPreferenceProvider';
import { HEIGHT_STORAGE_KEY, inchesToCm, cmToInches, feetInchesToTotalInches, totalInchesToFeetInches } from '../../utils/height';
import { SettingsSection } from '../../components/ui/SettingsSection';
import { SettingsToggleRow } from '../../components/ui/SettingsToggleRow';
import { SettingsLinkRow } from '../../components/ui/SettingsLinkRow';
import { SegmentedControl } from '../../components/ui/SegmentedControl';

const PRIVACY_POLICY_URL = 'https://mysuites.github.io/my-suites/privacy_policy.html';
const TERMS_OF_SERVICE_URL = 'https://mysuites.github.io/my-suites/tos.html';

const UNIT_SYSTEM_OPTIONS = [
  { label: 'Imperial', value: 'imperial' as const },
  { label: 'Metric', value: 'metric' as const },
];

export default function SettingsScreen() {
  const theme = useUITheme();
  const { preference, setPreference } = useThemePreference();
  const { showToast } = useToast();
  const {
    isRpeEnabled, setIsRpeEnabled,
    isHapticsEnabled, setIsHapticsEnabled,
    isSoundEnabled, setIsSoundEnabled,
    isProgressiveOverloadEnabled, setIsProgressiveOverloadEnabled,
    progressiveOverloadRepCeiling, setProgressiveOverloadRepCeiling,
  } = useWorkoutManager();
  const handleUpdateRepCeiling = async (ceiling: number) => {
    await setProgressiveOverloadRepCeiling(ceiling);
  };
  const { unitSystem, setUnitSystem } = useUnitPreference();
  const handleUpdateUnitSystem = async (system: 'imperial' | 'metric') => {
    await setUnitSystem(system);
    showToast({ message: `Weight units set to ${system === 'imperial' ? 'lb' : 'kg'}`, type: 'success' });
  };

  // Height is a single stored value (inches, canonical) — not a history log
  // like body weight, since it rarely changes for adults. Local input
  // strings are kept separate from the committed value so the user can
  // clear/retype a field without it snapping back mid-edit.
  const [heightInches, setHeightInches] = useState<number | null>(null);
  const [heightFeetInput, setHeightFeetInput] = useState('');
  const [heightInchesInput, setHeightInchesInput] = useState('');
  const [heightCmInput, setHeightCmInput] = useState('');

  const syncHeightInputs = (totalInches: number) => {
    const { feet, inches } = totalInchesToFeetInches(totalInches);
    setHeightFeetInput(String(feet));
    setHeightInchesInput(String(inches));
    setHeightCmInput(String(Math.round(inchesToCm(totalInches))));
  };

  const handleChangeHeightFeet = (t: string) => {
    if (t === '' || /^\d*$/.test(t)) setHeightFeetInput(t);
  };
  const handleChangeHeightInches = (t: string) => {
    if (t === '' || /^\d*$/.test(t)) setHeightInchesInput(t);
  };
  const handleChangeHeightCm = (t: string) => {
    if (t === '' || /^\d*$/.test(t)) setHeightCmInput(t);
  };

  const handleCommitHeight = async () => {
    let totalInches: number | null = null;
    if (unitSystem === 'imperial') {
      const feet = parseInt(heightFeetInput) || 0;
      const inches = parseInt(heightInchesInput) || 0;
      if (feet > 0 || inches > 0) totalInches = feetInchesToTotalInches(feet, inches);
    } else {
      const cm = parseFloat(heightCmInput);
      if (!isNaN(cm) && cm > 0) totalInches = cmToInches(cm);
    }
    if (totalInches === null) return;
    setHeightInches(totalInches);
    await storage.setItem(HEIGHT_STORAGE_KEY, totalInches);
    syncHeightInputs(totalInches);
  };
  const [isExportingData, setIsExportingData] = useState(false);
  const handleExportData = async () => {
    setIsExportingData(true);
    try {
        const [savedWorkouts, workoutHistory, exercises, bodyWeightHistory, progressPictures] = await Promise.all([
            DataRepository.getWorkouts(),
            DataRepository.getHistory(),
            DataRepository.getExercises(),
            DataRepository.getBodyWeightHistory(null),
            DataRepository.getProgressPictures(null),
        ]);

        const json = buildUserDataExport({
            savedWorkouts,
            workoutHistory,
            exercises,
            bodyWeightHistory,
            progressPictures,
        });

        const fileUri = `${FileSystem.cacheDirectory}myhealth_export_${Date.now()}.json`;
        await FileSystem.writeAsStringAsync(fileUri, json);

        if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(fileUri, {
                mimeType: 'application/json',
                dialogTitle: 'Export My Data',
                UTI: 'public.json',
            });
        } else {
            showToast({ message: 'Sharing is not available on this device', type: 'error' });
        }
    } catch (error) {
        console.error('Export data error:', error);
        showToast({ message: 'Failed to export data', type: 'error' });
    } finally {
        setIsExportingData(false);
    }
  };

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
  const [gpsTrackingEnabled, setGpsTrackingEnabled] = useState(false);
  const [longWorkoutDuration, setLongWorkoutDuration] = useState(90);
  const [weeklyGoal, setWeeklyGoal] = useState(DEFAULT_WEEKLY_GOAL);
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

  const handleToggleGpsTracking = async (value: boolean) => {
    if (value) {
      // Ask now (foreground, then background/"Always Allow") instead of
      // deferring to whenever the next outdoor exercise happens to start -
      // the toggle otherwise looked like it did nothing, since nothing
      // visibly prompted at the moment the user actually flipped it.
      const granted = await WorkoutLocationTrackingService.requestPermissions();
      if (!granted) {
        Alert.alert(
          "Permission Denied",
          "Please enable Location permissions for MyHealth in your system settings to track your route during outdoor workouts.",
          [{ text: "OK" }]
        );
        return;
      }
    }
    setGpsTrackingEnabled(value);
    await storage.setItem('gps_tracking_enabled', value);
    showToast({
      message: value ? "GPS route tracking enabled" : "GPS route tracking disabled",
      type: 'success'
    });
  };

  const handleUpdateLongWorkoutDuration = async (minutes: number) => {
    setLongWorkoutDuration(minutes);
    await storage.setItem('long_workout_duration', minutes);
  };

  const handleUpdateWeeklyGoal = async (goal: number) => {
    setWeeklyGoal(goal);
    await storage.setItem(WEEKLY_GOAL_STORAGE_KEY, goal);
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

      const gpsEnabled = await storage.getItem<boolean>('gps_tracking_enabled');
      setGpsTrackingEnabled(!!gpsEnabled);

      const goal = await storage.getItem<number>(WEEKLY_GOAL_STORAGE_KEY);
      if (goal !== null) setWeeklyGoal(goal);

      const height = await storage.getItem<number>(HEIGHT_STORAGE_KEY);
      if (height !== null) {
        setHeightInches(height);
        syncHeightInputs(height);
      }
    }
    loadPrefs();
  }, []);

  // Re-sync the display inputs (feet/in vs cm) when the unit system changes
  // elsewhere, so the height fields don't show stale values in the old unit.
  useEffect(() => {
    if (heightInches !== null) syncHeightInputs(heightInches);
  }, [unitSystem]);

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
            WorkoutHealthKitSyncService.syncWorkoutsFromHealthKit(null);
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
      await WorkoutHealthKitSyncService.syncWorkoutsFromHealthKit(null);
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
        
        <SettingsSection title="Appearance">
          <ThemeToggle preference={preference} setPreference={setPreference} />
        </SettingsSection>

        <SettingsSection title="General">
          <SettingsToggleRow
            testID="haptics-switch"
            label="Haptic (Vibration) Feedback"
            labelBold
            value={isHapticsEnabled}
            onValueChange={async (value) => {
              await setIsHapticsEnabled(value);
              showToast({
                message: value ? "Haptic feedback enabled" : "Haptic feedback disabled",
                type: 'success'
              });
            }}
          />
          <SettingsToggleRow
            testID="sound-switch"
            label="Allow Sound Effects"
            labelBold
            value={isSoundEnabled}
            onValueChange={async (value) => {
              await setIsSoundEnabled(value);
              showToast({
                message: value ? "Sound effects enabled" : "Sound effects disabled",
                type: 'success'
              });
            }}
          />
          <View className="flex-row justify-between items-center py-3">
            <Text className="text-base text-light dark:text-dark font-medium">Units</Text>
            <View style={{ width: 180 }}>
              <SegmentedControl
                options={UNIT_SYSTEM_OPTIONS}
                value={unitSystem}
                onChange={handleUpdateUnitSystem}
              />
            </View>
          </View>
        </SettingsSection>

        <SettingsSection title="Photos">
          <SettingsToggleRow
            label="Auto-Save Progress Photos to Library"
            value={autoSavePhotos}
            onValueChange={async (value) => {
              setAutoSavePhotos(value);
              await storage.setItem('auto_save_photos_to_gallery', value);
              showToast({
                message: value ? "Auto-save enabled" : "Auto-save disabled",
                type: 'success'
              });
            }}
          />
        </SettingsSection>

        <SettingsSection title="Body">
          <View className="flex-row justify-between items-center py-3">
            <Text className="text-base text-light dark:text-dark font-medium">Height</Text>
            {unitSystem === 'imperial' ? (
              <View className="flex-row items-center gap-2">
                <TextInput
                  testID="height-feet-input"
                  className="w-12 h-10 bg-light dark:bg-dark rounded-lg text-center text-base text-light dark:text-dark"
                  value={heightFeetInput}
                  onChangeText={handleChangeHeightFeet}
                  onBlur={handleCommitHeight}
                  keyboardType="numeric"
                  placeholder="-"
                  placeholderTextColor={theme.placeholder}
                  maxLength={1}
                />
                <Text className="text-light-muted dark:text-dark-muted">ft</Text>
                <TextInput
                  testID="height-inches-input"
                  className="w-12 h-10 bg-light dark:bg-dark rounded-lg text-center text-base text-light dark:text-dark"
                  value={heightInchesInput}
                  onChangeText={handleChangeHeightInches}
                  onBlur={handleCommitHeight}
                  keyboardType="numeric"
                  placeholder="-"
                  placeholderTextColor={theme.placeholder}
                  maxLength={2}
                />
                <Text className="text-light-muted dark:text-dark-muted">in</Text>
              </View>
            ) : (
              <View className="flex-row items-center gap-2">
                <TextInput
                  testID="height-cm-input"
                  className="w-16 h-10 bg-light dark:bg-dark rounded-lg text-center text-base text-light dark:text-dark"
                  value={heightCmInput}
                  onChangeText={handleChangeHeightCm}
                  onBlur={handleCommitHeight}
                  keyboardType="numeric"
                  placeholder="-"
                  placeholderTextColor={theme.placeholder}
                  maxLength={3}
                />
                <Text className="text-light-muted dark:text-dark-muted">cm</Text>
              </View>
            )}
          </View>
        </SettingsSection>

        <SettingsSection title="Integrations">
          <SettingsToggleRow
            label="Apple Health & Watch"
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
          />
          <SettingsToggleRow
            testID="gps-tracking-switch"
            label="Allow GPS Route Tracking"
            value={gpsTrackingEnabled}
            onValueChange={handleToggleGpsTracking}
          />
        </SettingsSection>

        <SettingsSection title="Notifications">
          <SettingsToggleRow
            testID="push-notifications-switch"
            label="Push Notifications"
            value={pushNotificationsEnabled}
            onValueChange={handleTogglePushNotifications}
          />
          <SettingsToggleRow
            testID="daily-reminder-switch"
            label="Daily Workout Reminder"
            indented
            value={notificationsEnabled}
            onValueChange={handleToggleNotifications}
            disabled={!pushNotificationsEnabled}
          />
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
          <SettingsToggleRow
            testID="long-workout-reminder-switch"
            label="Long Workout Reminder"
            indented
            value={longWorkoutReminderEnabled}
            onValueChange={handleToggleLongWorkoutReminder}
            disabled={!pushNotificationsEnabled}
          />
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
        </SettingsSection>

        <SettingsSection title="Workouts">
          <SettingsToggleRow
            label="Enable RPE Tracking"
            labelBold
            value={isRpeEnabled}
            onValueChange={async (value) => {
              await setIsRpeEnabled(value);
              showToast({
                message: value ? "RPE tracking enabled" : "RPE tracking disabled",
                type: 'success'
              });
            }}
          />
          <SettingsToggleRow
            testID="progressive-overload-switch"
            label="Progressive Overload Guide"
            labelBold
            value={isProgressiveOverloadEnabled}
            onValueChange={async (value) => {
              await setIsProgressiveOverloadEnabled(value);
              showToast({
                message: value ? "Progressive overload guide enabled" : "Progressive overload guide disabled",
                type: 'success'
              });
            }}
          />
          {isProgressiveOverloadEnabled && (
            <View className="flex-row justify-between items-center py-3 border-b border-light dark:border-dark pl-6">
              <Text className="text-base text-light dark:text-dark font-medium">Reps before Weight Increase</Text>
              <View className="flex-row items-center gap-2">
                <TouchableOpacity
                  testID="rep-ceiling-decrement"
                  onPress={() => handleUpdateRepCeiling(Math.max(REP_CEILING_MIN, progressiveOverloadRepCeiling - 1))}
                  className="px-3 py-1.5 bg-light dark:bg-dark rounded-lg"
                >
                  <Text className="text-base font-semibold" style={{ color: theme.primary }}>−</Text>
                </TouchableOpacity>
                <Text className="text-base text-light dark:text-dark font-medium w-12 text-center">
                  {progressiveOverloadRepCeiling}
                </Text>
                <TouchableOpacity
                  testID="rep-ceiling-increment"
                  onPress={() => handleUpdateRepCeiling(Math.min(REP_CEILING_MAX, progressiveOverloadRepCeiling + 1))}
                  className="px-3 py-1.5 bg-light dark:bg-dark rounded-lg"
                >
                  <Text className="text-base font-semibold" style={{ color: theme.primary }}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          <View className="flex-row justify-between items-center py-3">
            <Text className="text-base text-light dark:text-dark font-medium">Weekly Workout Goal</Text>
            <View className="flex-row items-center gap-2">
              <TouchableOpacity
                testID="weekly-goal-decrement"
                onPress={() => handleUpdateWeeklyGoal(Math.max(1, weeklyGoal - 1))}
                className="px-3 py-1.5 bg-light dark:bg-dark rounded-lg"
              >
                <Text className="text-base font-semibold" style={{ color: theme.primary }}>−</Text>
              </TouchableOpacity>
              <Text className="text-base text-light dark:text-dark font-medium w-12 text-center">
                {weeklyGoal}
              </Text>
              <TouchableOpacity
                testID="weekly-goal-increment"
                onPress={() => handleUpdateWeeklyGoal(Math.min(7, weeklyGoal + 1))}
                className="px-3 py-1.5 bg-light dark:bg-dark rounded-lg"
              >
                <Text className="text-base font-semibold" style={{ color: theme.primary }}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SettingsSection>

        <SettingsSection title="Legal">
          <SettingsLinkRow
            label="Privacy Policy"
            onPress={() => WebBrowser.openBrowserAsync(PRIVACY_POLICY_URL)}
          />
          <SettingsLinkRow
            label="Terms of Service"
            onPress={() => WebBrowser.openBrowserAsync(TERMS_OF_SERVICE_URL)}
          />
        </SettingsSection>

        <SettingsSection title="AI">
          <SettingsLinkRow
            label="Manage AI Models"
            onPress={() => router.push('/settings/ai-models' as any)}
          />
        </SettingsSection>

        <SettingsSection title="Developer">
          <SettingsToggleRow
            label="Developer Mode"
            value={developerMode}
            onValueChange={async (value) => {
              setDeveloperMode(value);
              await storage.setItem('developer_mode', value);
              showToast({
                message: value ? "Developer mode enabled" : "Developer mode disabled",
                type: 'success'
              });
            }}
          />
          {developerMode && (
            <SettingsLinkRow
              label="View SQLite Database"
              labelBold
              onPress={() => router.push('/settings/developer/database' as any)}
            />
          )}
        </SettingsSection>

        <SettingsSection title="Data">
          <SettingsLinkRow
            testID="export-data-btn"
            label={isExportingData ? "Exporting..." : "Export Data"}
            icon="square.and.arrow.down"
            onPress={handleExportData}
          />
          <SettingsLinkRow
            testID="delete-data-btn"
            label="Delete Data"
            danger
            icon="trash.fill"
            onPress={handleDeleteData}
          />
        </SettingsSection>
        
        <Text className="text-center text-xs text-gray-500 dark:text-gray-400 mt-6">
          Version {Application.nativeApplicationVersion ?? '—'}
          {Application.nativeBuildVersion ? ` (${Application.nativeBuildVersion})` : ''}
        </Text>
      </ScrollView>
    </View>
  );
}
