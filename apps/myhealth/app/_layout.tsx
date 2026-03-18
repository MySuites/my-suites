import '../global.css';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider, useAuth } from '@mysuite/auth';
import { AppThemeProvider } from '../providers/AppThemeProvider';
import { NavigationSettingsProvider } from '../providers/NavigationSettingsProvider';
import { useColorScheme } from '../hooks/ui/use-color-scheme';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { initDatabase } from '../utils/db/database';
import { ActiveWorkoutProvider } from '../providers/ActiveWorkoutProvider'; // Fixed import path
import { WorkoutManagerProvider } from '../providers/WorkoutManagerProvider';
import { FloatingButtonProvider } from '../providers/FloatingButtonContext';
import { ToastProvider } from '@mysuite/ui';
import { DataRepository } from '../providers/DataRepository';
import { BodyWeightService } from '../services/BodyWeightService';

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayoutNav() {
  return (
    <Stack>

      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="settings/index" options={{ headerShown: false }} />
      <Stack.Screen name="profile/index" options={{ headerShown: false }} />
      <Stack.Screen name="exercises/index" options={{ title: 'Exercises', headerShown: false }} />
      <Stack.Screen name="exercises/details" options={{ headerShown: false }} />
      <Stack.Screen name="workouts/saved" options={{ title: 'Saved Workouts', headerShown: false }} />
      <Stack.Screen name="routines/index" options={{ title: 'My Routines', headerShown: false }} />
      <Stack.Screen name="routines/details" options={{ headerShown: false }} />
      <Stack.Screen name="workouts/details" options={{ headerShown: false }} />
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
    async function setupApp() {
      try {
        await initDatabase();
        
        // Optimistic seeding: Only seed if the exercise table is empty
        const exercises = await DataRepository.getExercises();
        if (exercises.length === 0) {
           await DataRepository.seedDefaultExercises();
        }
      } catch (err) {
        console.error("App setup failed:", err);
      } finally {
        setIsDbReady(true);
        SplashScreen.hideAsync();
      }
    }
    
    if (!isDbReady) {
      setupApp();
    }
  }, [isDbReady, setIsDbReady]);

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
      <ToastProvider>
        <WorkoutManagerProvider>
          <ActiveWorkoutProvider>
            <FloatingButtonProvider>
              <RootLayoutNav />
            </FloatingButtonProvider>
            <StatusBar style="auto" />
          </ActiveWorkoutProvider>
        </WorkoutManagerProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [isDbReady, setIsDbReady] = useState(false);

  return (
    <GestureHandlerRootView className="flex-1">
      <AuthProvider>
        <NavigationSettingsProvider>
          <AppThemeProvider>
            <RootLayoutContent isDbReady={isDbReady} setIsDbReady={setIsDbReady} />
          </AppThemeProvider>
        </NavigationSettingsProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
