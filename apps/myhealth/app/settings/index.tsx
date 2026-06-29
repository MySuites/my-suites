import { useState, useEffect, useCallback } from 'react';
import { View, Text, Alert, ScrollView, Switch, InteractionManager, TouchableOpacity } from 'react-native';
import { useUITheme, ThemeToggle, IconSymbol, useToast, RaisedCard } from '@mysuite/ui';

import { DataRepository } from '../../providers/DataRepository';
import { useThemePreference } from '../../providers/AppThemeProvider';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { BackButton } from '../../components/ui/BackButton';
import { BodyWeightService } from '../../services/BodyWeightService';
import { HealthKitService } from '../../services/HealthKitService';
import { storage } from '../../utils/storage';
import * as WebBrowser from 'expo-web-browser';
import { router } from 'expo-router';

const PRIVACY_POLICY_URL = 'https://mysuites.github.io/myhealth-privacy_policy/';
const TERMS_OF_SERVICE_URL = 'https://mysuites.github.io/myhealth-terms_of_service/';

export default function SettingsScreen() {
  const theme = useUITheme();
  const { preference, setPreference } = useThemePreference();
  const { showToast } = useToast();
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

  useEffect(() => {
    async function loadPrefs() {
      const val = await storage.getItem<boolean>('auto_save_photos_to_gallery');
      setAutoSavePhotos(!!val);
      const devVal = await storage.getItem<boolean>('developer_mode');
      setDeveloperMode(!!devVal);
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
        
        <Text className="text-center text-xs text-gray-500 mt-6">Version 1.4.3
        </Text>
      </ScrollView>
    </View>
  );
}
