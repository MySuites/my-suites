import '../global.css';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider, useAuth } from '@mycsuite/auth';
import { AppThemeProvider } from './providers/AppThemeProvider';
import { NavigationSettingsProvider } from './providers/NavigationSettingsProvider';
import { useColorScheme } from '../hooks/use-color-scheme';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { ActiveWorkoutProvider } from '../providers/ActiveWorkoutProvider'; // Fixed import path
import { WorkoutStickyHeader } from '../components/ui/WorkoutStickyHeader';
import { ActiveWorkoutOverlay } from '../components/ActiveWorkoutOverlay'; 
import { QuickNavigationButton } from '../components/ui/QuickNavigationMenu';
import { QuickUtilityButton } from '../components/ui/QuickUilityMenu';
import { QuickBackButton } from '../components/ui/QuickBackButton';
import { FloatingButtonProvider } from '../components/ui/FloatingButtonContext';
import { GlobalOverlay } from '../components/ui/GlobalOverlay';

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayoutNav() {
  const { session } = useAuth(); // <-- Get the session
  const router = useRouter();

  useEffect(() => {
    // Defer navigation until after the root layout mounts. Calling
    // `router.replace` synchronously during the first render can cause
    // "Attempted to navigate before mounting the Root Layout component".
    // Using `setTimeout` yields to the event loop and ensures the Slot
    // / navigator has been mounted.
    if (!router) return;
    if (session) {
      // If the user is logged in, send them to the main app
      setTimeout(() => (router as any).replace('/(tabs)'), 0);
    } else {
      // If the user is logged out, send them to the auth screen
      setTimeout(() => (router as any).replace('/auth'), 0);
    }
  }, [session, router]); // <-- Re-run this effect when the session or router changes

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      <Stack.Screen name="auth" options={{ headerShown: false }} />
      <Stack.Screen name="settings" options={{ headerShown: false }} />
      <Stack.Screen name="exercises" options={{ presentation: 'modal', title: 'Exercises', headerShown: false }} />
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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <NavigationSettingsProvider>
          <AppThemeProvider>
            <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
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
            </ThemeProvider>
          </AppThemeProvider>
        </NavigationSettingsProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
