import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Credentials, OperatorSession } from '@/services/auth/localAuth';
import { readSession, signIn, signOut } from '@/services/auth/localAuth';

interface AuthValue {
  session: OperatorSession | null;
  authenticated: boolean;
  login: (credentials: Credentials, remember: boolean) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthValue | null>(null);

/**
 * Operator access, kept deliberately separate from AppStore: authentication
 * decides whether the station opens, mission state is untouched by it.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<OperatorSession | null>(() => readSession());

  const login = useCallback(async (credentials: Credentials, remember: boolean) => {
    const next = await signIn(credentials, remember);
    setSession(next);
  }, []);

  const logout = useCallback(() => {
    signOut();
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({ session, authenticated: session !== null, login, logout }),
    [login, logout, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
