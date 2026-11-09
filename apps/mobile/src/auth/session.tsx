import type { Session, User } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import { supabase } from '@/lib/supabase';

export type SessionStatus = 'loading' | 'signedOut' | 'needsProfile' | 'ready';

type SessionValue = {
  status: SessionStatus;
  user: User | null;
  /** Re-check whether the profile is complete, e.g. after saving it. */
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionValue | null>(null);

/** `undefined` session = still reading storage; `null` = signed out. */
export function deriveStatus(
  session: Session | null | undefined,
  profileComplete: boolean | null,
): SessionStatus {
  if (session === undefined) return 'loading';
  if (session === null) return 'signedOut';
  if (profileComplete === null) return 'loading';
  return profileComplete ? 'ready' : 'needsProfile';
}

async function isProfileComplete(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, profile_sports(skill_tier)')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return !!data && data.profile_sports.length > 0;
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [profile, setProfile] = useState<{ userId: string; complete: boolean } | null>(null);
  const userId = session?.user.id;
  // Results for a previous user are ignored, so a new sign-in starts from "loading".
  const profileComplete = profile && profile.userId === userId ? profile.complete : null;

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    // Only set state in the callback: awaiting Supabase calls here can deadlock the auth client.
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);

  // Refresh tokens only while the app is in the foreground.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') supabase.auth.startAutoRefresh();
      else supabase.auth.stopAutoRefresh();
    });
    supabase.auth.startAutoRefresh();
    return () => {
      subscription.remove();
      supabase.auth.stopAutoRefresh();
    };
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!userId) return;
    setProfile({ userId, complete: await isProfileComplete(userId) });
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    isProfileComplete(userId)
      .then((complete) => !cancelled && setProfile({ userId, complete }))
      // If the profile cannot be read, treat it as incomplete so the user can fill it in.
      .catch(() => !cancelled && setProfile({ userId, complete: false }));
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const value = useMemo<SessionValue>(
    () => ({
      status: deriveStatus(session, profileComplete),
      user: session?.user ?? null,
      refreshProfile,
      signOut: async () => {
        await supabase.auth.signOut();
      },
    }),
    [session, profileComplete, refreshProfile],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSession must be used inside SessionProvider');
  return value;
}
