import '../global.css';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from '@mysuite/auth';
import { AppThemeProvider } from '../providers/AppThemeProvider';
import { NavigationSettingsProvider } from '../providers/NavigationSettingsProvider';
import { useColorScheme } from '../hooks/ui/use-color-scheme';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react'; // Added useState removed
import { initDatabase } from '../utils/db/database';
import { ActiveWorkoutProvider } from '../providers/ActiveWorkoutProvider'; // Fixed import path
import { WorkoutManagerProvider } from '../providers/WorkoutManagerProvider';
import { FloatingButtonProvider } from '../providers/FloatingButtonContext';
import { ToastProvider } from '@mysuite/ui';

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
      <Stack.Screen name="workouts/saved" options={{ title: 'Saved Workouts', headerShown: false }} />
      <Stack.Screen name="routines/index" options={{ title: 'My Routines', headerShown: false }} />
      <Stack.Screen name="workouts/editor" options={{ title: 'Create Workout', headerShown: false }} />
      <Stack.Screen name="routines/editor" options={{ title: 'Create Routine', headerShown: false }} />
      <Stack.Screen name="exercises/create" options={{ title: 'Create Exercise', headerShown: false }} />
      <Stack.Screen name="exercises/details" options={{ headerShown: false }} />
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
function RootLayoutContent() {
  const colorScheme = useColorScheme(); // correct hook usage inside provider

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
  const loaded = true;
  useEffect(() => {
    if (loaded) {
      initDatabase().then(() => {
        SplashScreen.hideAsync();
      }).catch(e => {
        console.error("DB Init Failed", e);
        SplashScreen.hideAsync();
      });
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
            <RootLayoutContent />
          </AppThemeProvider>
        </NavigationSettingsProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
