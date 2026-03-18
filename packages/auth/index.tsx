// packages/auth/index.tsx
// Supabase temporarily removed. All features run in local/guest mode.
import React, { createContext, useContext } from 'react';
import type { Session, User } from '@supabase/supabase-js';

// --- AUTH CONTEXT ---
interface AuthContextType {
  session: Session | null;
  user: User | null;
}

export const AuthContext = createContext<AuthContextType>({ session: null, user: null });

// Always-guest provider — no network calls
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthContext.Provider value={{ session: null, user: null }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

// Stub supabase export so existing imports don't break at compile time.
// None of these methods will be called while Supabase is disabled.
export const supabase = {
  auth: {
    signUp: async () => ({ data: null, error: new Error('Supabase disabled') }),
    signInWithPassword: async () => ({ data: null, error: new Error('Supabase disabled') }),
    signOut: async () => ({ error: null }),
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
  },
  from: (_table: string) => ({
    select: (_cols?: string) => ({ eq: () => ({ data: null, error: null }), data: null, error: null }),
    insert: (_rows: any) => ({ data: null, error: null }),
    upsert: (_rows: any) => ({ data: null, error: null }),
    delete: () => ({ eq: () => ({ data: null, error: null }) }),
  }),
  functions: {
    invoke: async (_name: string, _opts?: any) => ({ data: null, error: new Error('Supabase disabled') }),
  },
} as any;