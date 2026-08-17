import '../global.css';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { initExecutorchForApp } from '../services/ai/executorchInit';
import { AuthProvider, useAuth } from '@mysuite/auth';
import { AppThemeProvider } from '../providers/AppThemeProvider';
import { UnitPreferenceProvider } from '../providers/UnitPreferenceProvider';
import { useColorScheme } from '../hooks/ui/use-color-scheme';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { initDatabase } from '../utils/db/database';
import { ActiveWorkoutProvider } from '../providers/ActiveWorkoutProvider';
import { WorkoutManagerProvider } from '../providers/WorkoutManagerProvider';
import { ToastProvider } from '@mysuite/ui';
import { DataRepository } from '../providers/DataRepository';
import { EXERCISE_DATA_VERSION } from '../assets/data/default-exercises';
import { BodyWeightService } from '../services/BodyWeightService';
import { NotificationService } from '../services/NotificationService';

SplashScreen.preventAutoHideAsync();

initExecutorchForApp();

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayoutNav() {
  return (
    <Stack>

      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="settings/index" options={{ headerShown: false }} />
      <Stack.Screen name="settings/developer/database" options={{ headerShown: false }} />
      <Stack.Screen name="settings/ai-models" options={{ headerShown: false }} />
      <Stack.Screen name="exercises/details" options={{ headerShown: false }} />
      <Stack.Screen name="workouts/saved" options={{ title: 'Saved Workouts', headerShown: false }} />
      <Stack.Screen name="routines/index" options={{ title: 'My Routines', headerShown: false }} />
      <Stack.Screen name="routines/details" options={{ headerShown: false }} />
      <Stack.Screen name="workouts/details" options={{ headerShown: false }} />
      <Stack.Screen name="history/index" options={{ headerShown: false }} />
      <Stack.Screen name="progress-pictures/index" options={{ headerShown: false }} />
      <Stack.Screen name="progress-pictures/add" options={{ headerShown: false }} />
      <Stack.Screen 
        name="workouts/end" 
        options={{ 
          presentation: 'fullScreenModal', 
          headerShown: false,
          animation: 'slide_from_bottom'
        }} 
      />
    </Stack>
  );
}



// Separate component to consume the theme context
function RootLayoutContent({ isDbReady, setIsDbReady }: { isDbReady: boolean, setIsDbReady: (v: boolean) => void }) {
  const colorScheme = useColorScheme(); // correct hook usage inside provider
  const { user } = useAuth();

  useEffect(() => {
    NotificationService.registerForegroundHandler();
  }, []);

  useEffect(() => {
    async function setupApp() {
      try {
        await initDatabase();
        
        // Versioned seeding: Only seed if the stored version is older than the code version
        const storedVersion = await DataRepository.getStoredExerciseVersion();
        
        if (storedVersion < EXERCISE_DATA_VERSION) {
           console.log(`[Sync] Updating exercises from version ${storedVersion} to ${EXERCISE_DATA_VERSION}...`);
           await DataRepository.seedDefaultExercises();
           await DataRepository.setStoredExerciseVersion(EXERCISE_DATA_VERSION);
           console.log("[Sync] Exercise synchronization complete.");
        }
      } catch (err) {
        console.error("App setup failed:", err);
      } finally {
        setIsDbReady(true);
      }
    }
    
    if (!isDbReady) {
      setupApp();
    }
  }, [isDbReady, setIsDbReady]);

  useEffect(() => {
    // Only hide splash screen once DB is ready
    // Auth is synchronous guest mode, so no loading state needed
    if (isDbReady) {
      SplashScreen.hideAsync();
    }
  }, [isDbReady]);

  useEffect(() => {
    if (user && isDbReady) {
      // Auto-sync HealthKit data when app opens and user is logged in
      BodyWeightService.syncWithHealthKit(user?.id || null).catch(err => 
        console.error("Auto-sync failed:", err)
      );
    }
  }, [user, isDbReady]);

  if (!isDbReady) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <WorkoutManagerProvider>
        <ActiveWorkoutProvider>
          <RootLayoutNav />
          <StatusBar style="auto" />
        </ActiveWorkoutProvider>
      </WorkoutManagerProvider>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [isDbReady, setIsDbReady] = useState(false);

  return (
    <GestureHandlerRootView className="flex-1">
      <ToastProvider>
        <AuthProvider>
          <AppThemeProvider>
            <UnitPreferenceProvider>
              <RootLayoutContent isDbReady={isDbReady} setIsDbReady={setIsDbReady} />
            </UnitPreferenceProvider>
          </AppThemeProvider>
        </AuthProvider>
      </ToastProvider>
    </GestureHandlerRootView>
  );
}
