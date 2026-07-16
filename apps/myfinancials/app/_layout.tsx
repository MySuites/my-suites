import '../global.css';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { AuthProvider, useAuth } from '@mysuite/auth';
import AppThemeProvider from './providers/AppThemeProvider';
import { useColorScheme } from '@/hooks/use-color-scheme';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

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
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <AuthProvider>
      <AppThemeProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <RootLayoutNav />
          <StatusBar style="auto" />
        </ThemeProvider>
      </AppThemeProvider>
    </AuthProvider>
  );
}
