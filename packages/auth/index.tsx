// packages/auth/index.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SupabaseClient, createClient, Session, User } from '@supabase/supabase-js';
const AsyncStorageAdapter = {
  getItem: async (key: string) => {
    try {
      return await AsyncStorage.getItem(key);
    } catch (e) {
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (e) {
      // ignore
    }
  },
  removeItem: async (key: string) => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (e) {
      // ignore
    }
  },
};

// --- CREATE THE SUPABASE CLIENT ---
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

const getSupabaseUrl = () => {
  if (!supabaseUrl) return '';

  // If the configured URL points to localhost (127.0.0.1 or localhost),
  // and we are running in an Expo environment where hostUri is available (Dev Client/Go),
  // try to use the hostUri IP address instead.
  if (supabaseUrl.includes('127.0.0.1') || supabaseUrl.includes('localhost')) {
    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) {
      const ipAddress = hostUri.split(':')[0];
      if (ipAddress) {
        return supabaseUrl
          .replace('127.0.0.1', ipAddress)
          .replace('localhost', ipAddress);
      }
    }
  }

  return supabaseUrl;
};

export const supabase = createClient(getSupabaseUrl(), supabaseAnonKey, {
  auth: {
    storage: AsyncStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// --- CREATE THE AUTH CONTEXT ---
// This defines the shape of the data that will be available to the app
interface AuthContextType {
  session: Session | null;
  user: User | null;
}
export const AuthContext = createContext<AuthContextType>({ session: null, user: null });

// --- CREATE THE AUTH PROVIDER ---
// This component will wrap your app and manage the auth state
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check for an existing session when the app starts.
    // Wrap in try/catch to handle cases where a stored refresh token
    // is invalid on the server (e.g. rotated/removed). If refreshing
    // fails, sign out to clear local storage and avoid an unhandled
    // AuthApiError like "Invalid Refresh Token: Refresh Token Not Found".
    (async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        setSession(data.session);
        setUser(data.session?.user ?? null);
      } catch (err: any) {
        // If Supabase reports an invalid refresh token, clear local state
        // and remove any persisted session by signing out.
        try {
          // eslint-disable-next-line no-console
          console.warn('[Auth] getSession failed, signing out to clear invalid tokens', err?.message ?? err);
          await supabase.auth.signOut();
        } catch (e) {
          // ignore signOut errors
        }
        setSession(null);
        setUser(null);
      }
    })();

    // Listen for changes in authentication state (login, logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    // Clean up the subscription when the component unmounts
    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ session, user }}>
      {children}
    </AuthContext.Provider>
  );
};

// --- CREATE A HOOK TO EASILY ACCESS THE AUTH CONTEXT ---
export const useAuth = () => {
  return useContext(AuthContext);
};