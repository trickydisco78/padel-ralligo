import { useSession, type SessionStatus } from '@padel/auth';
import { useProfileComplete } from '@padel/profiles';

/** What the route guard decides on: authentication plus whether the profile is complete. */
export type AppStatus = 'loading' | 'signedOut' | 'needsProfile' | 'ready';

export function deriveAppStatus(session: SessionStatus, profileComplete: boolean | null): AppStatus {
  if (session !== 'signedIn') return session;
  if (profileComplete === null) return 'loading';
  return profileComplete ? 'ready' : 'needsProfile';
}

export function useAppStatus(): AppStatus {
  const { status, user } = useSession();
  const { complete } = useProfileComplete(user?.id);
  return deriveAppStatus(status, complete);
}
