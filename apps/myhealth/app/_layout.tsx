import '../global.css';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider, useAuth } from '@mysuite/auth';
import { AppThemeProvider } from '../providers/AppThemeProvider';
import { NavigationSettingsProvider } from '../providers/NavigationSettingsProvider';
import { useColorScheme } from '../hooks/ui/use-color-scheme';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { ActiveWorkoutProvider } from '../providers/ActiveWorkoutProvider'; // Fixed import path
import { WorkoutManagerProvider } from '../providers/WorkoutManagerProvider';
import { FloatingButtonProvider } from '../providers/FloatingButtonContext';

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
      setTimeout(() => router.replace('/(tabs)'), 0);
    } else {
      setTimeout(() => router.replace('/auth'), 0);
    }
  }, [session, router]);

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="auth/index" options={{ headerShown: false }} />
      <Stack.Screen name="settings/index" options={{ headerShown: false }} />
      <Stack.Screen name="exercises/index" options={{ title: 'Exercises', headerShown: false }} />
      <Stack.Screen name="workouts/saved" options={{ title: 'Saved Workouts', headerShown: false }} />
      <Stack.Screen name="routines/index" options={{ title: 'My Routines', headerShown: false }} />
      <Stack.Screen name="workouts/create" options={{ title: 'Create Workout', headerShown: false }} />
      <Stack.Screen name="workouts/details" options={{ title: 'Workout Details', headerShown: false }} />
      <Stack.Screen name="routines/create" options={{ title: 'Create Routine', headerShown: false }} />
      <Stack.Screen name="routines/details" options={{ title: 'Routine Details', headerShown: false }} />
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
      <WorkoutManagerProvider>
        <ActiveWorkoutProvider>
          <FloatingButtonProvider>
            <RootLayoutNav />
          </FloatingButtonProvider>
          <StatusBar style="auto" />
        </ActiveWorkoutProvider>
      </WorkoutManagerProvider>
    </ThemeProvider>
  );
}

export default function RootLayout() {
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
            <RootLayoutContent />
          </AppThemeProvider>
        </NavigationSettingsProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
