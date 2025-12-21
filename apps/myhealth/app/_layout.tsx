import '../global.css';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider, useAuth } from '@mycsuite/auth';
import { AppThemeProvider } from '../providers/AppThemeProvider';
import { NavigationSettingsProvider } from '../providers/NavigationSettingsProvider';
import { useColorScheme } from '../hooks/use-color-scheme';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { ActiveWorkoutProvider } from '../providers/ActiveWorkoutProvider'; // Fixed import path
import { WorkoutManagerProvider } from '../providers/WorkoutManagerProvider';
import { WorkoutStickyHeader } from '../components/ui/WorkoutStickyHeader';
import { ActiveWorkoutOverlay } from '../components/workouts/ActiveWorkoutOverlay'; 
import { QuickNavigationButton } from '../components/ui/QuickNavigationMenu';
import { QuickUtilityButton } from '../components/ui/QuickUtilityMenu';
import { QuickBackButton } from '../components/ui/QuickBackButton';
import { FloatingButtonProvider } from '../providers/FloatingButtonContext';
import { GlobalOverlay } from '../components/ui/GlobalOverlay';

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayoutNav() {
  const { session } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!router) return;
    if (session) {
      setTimeout(() => (router as any).replace('/(tabs)'), 0);
    } else {
      setTimeout(() => (router as any).replace('/auth'), 0);
    }
  }, [session, router]);

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="auth" options={{ headerShown: false }} />
      <Stack.Screen name="settings" options={{ headerShown: false }} />
      <Stack.Screen name="exercises" options={{ presentation: 'modal', title: 'Exercises', headerShown: false }} />
      <Stack.Screen name="saved-workouts" options={{ presentation: 'modal', title: 'Saved Workouts', headerShown: false }} />
      <Stack.Screen name="routines" options={{ presentation: 'modal', title: 'My Routines', headerShown: false }} />
      <Stack.Screen name="create-workout" options={{ presentation: 'modal', title: 'Create Workout', headerShown: false }} />
      <Stack.Screen name="create-routine" options={{ presentation: 'modal', title: 'Create Routine', headerShown: false }} />
      <Stack.Screen name="create-exercise" options={{ presentation: 'modal', title: 'Create Exercise', headerShown: false }} />
      <Stack.Screen name="exercise-details" options={{ presentation: 'modal', headerShown: false }} />
      <Stack.Screen 
        name="end-workout" 
        options={{ 
          presentation: 'fullScreenModal', 
          headerShown: false,
          animation: 'slide_from_bottom'
        }} 
      />
    </Stack>
  );
}



export default function RootLayout() {
  const colorScheme = useColorScheme();
  const loaded = true;
  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }
  
  return (
    <GestureHandlerRootView className="flex-1">
      <AuthProvider>
        <NavigationSettingsProvider>
          <AppThemeProvider>
            <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
              <WorkoutManagerProvider>
                <ActiveWorkoutProvider>
                  <FloatingButtonProvider>
                    <RootLayoutNav />
                    <WorkoutStickyHeader />
                    <ActiveWorkoutOverlay />
                    <GlobalOverlay>
                      <QuickNavigationButton />
                      <QuickUtilityButton />
                      <QuickBackButton />
                    </GlobalOverlay>
                  </FloatingButtonProvider>
                  <StatusBar style="auto" />
                </ActiveWorkoutProvider>
              </WorkoutManagerProvider>
            </ThemeProvider>
          </AppThemeProvider>
        </NavigationSettingsProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
