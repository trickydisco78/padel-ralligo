import { useSession, type SessionStatus } from '@padel/auth';
import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';

import { isProfileComplete } from '@/data/profile';

/** What the route guard decides on: authentication plus whether the profile is complete. */
export type AppStatus = 'loading' | 'signedOut' | 'needsProfile' | 'ready';

export function deriveAppStatus(session: SessionStatus, profileComplete: boolean | null): AppStatus {
  if (session !== 'signedIn') return session;
  if (profileComplete === null) return 'loading';
  return profileComplete ? 'ready' : 'needsProfile';
}

const profileCompleteKey = (userId: string | undefined) => ['profile-complete', userId] as const;

export function useAppStatus(): AppStatus {
  const { status, user } = useSession();
  const userId = user?.id;
  const query = useQuery({
    queryKey: profileCompleteKey(userId),
    // If the profile cannot be read, treat it as incomplete so the user can fill it in.
    queryFn: () => isProfileComplete(userId!).catch(() => false),
    enabled: !!userId,
  });
  return deriveAppStatus(status, query.data ?? null);
}

/** Re-checks whether the profile is complete, e.g. after saving it. */
export function useRefreshProfileComplete() {
  const queryClient: QueryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['profile-complete'] });
}
