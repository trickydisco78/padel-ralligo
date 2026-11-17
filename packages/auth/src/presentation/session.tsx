import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import { authService } from '../composition';
import type { AuthUser } from '../domain/auth-user';
import { deriveSessionStatus, type SessionStatus } from '../domain/session-status';

type SessionValue = {
  status: SessionStatus;
  user: AuthUser | null;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  // `undefined` = still reading storage; `null` = signed out.
  const [user, setUser] = useState<AuthUser | null | undefined>(undefined);

  useEffect(() => {
    authService.currentUser().then(setUser);
    return authService.onUserChange(setUser);
  }, []);

  // Refresh tokens only while the app is in the foreground.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      authService.setAutoRefresh(state === 'active');
    });
    authService.setAutoRefresh(true);
    return () => {
      subscription.remove();
      authService.setAutoRefresh(false);
    };
  }, []);

  const value = useMemo<SessionValue>(
    () => ({
      status: deriveSessionStatus(user),
      user: user ?? null,
      signOut: () => authService.signOut(),
    }),
    [user],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSession must be used inside SessionProvider');
  return value;
}
