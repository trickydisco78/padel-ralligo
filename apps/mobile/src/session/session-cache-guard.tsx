import { useAuthIntent, useSession } from '@padel/auth';
import { useClearQueryCache } from '@padel/query';
import { useEffect, useRef } from 'react';

/**
 * Keeps one user's private data away from the next. When the signed-in user goes away or changes
 * (sign-out, an expired session, a different account) every cached query and any pending intent
 * is discarded. A guest signing in is not a change: public data stays and the intent is kept.
 */
export function SessionCacheGuard() {
  const { user } = useSession();
  const userId = user?.id ?? null;
  const clearCache = useClearQueryCache();
  const { clearIntent } = useAuthIntent();
  const previousUserId = useRef<string | null>(null);

  useEffect(() => {
    const previous = previousUserId.current;
    previousUserId.current = userId;
    if (previous && previous !== userId) {
      clearCache();
      clearIntent();
    }
  }, [userId, clearCache, clearIntent]);

  return null;
}
