// packages/auth/index.tsx
// Local/guest-only auth. There is no backend — every app in this monorepo
// runs against on-device data, so `user`/`session` are always null.
import React, { createContext, useContext } from 'react';

interface AuthContextType {
  session: null;
  user: { id: string } | null;
}

export const AuthContext = createContext<AuthContextType>({ session: null, user: null });

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthContext.Provider value={{ session: null, user: null }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);