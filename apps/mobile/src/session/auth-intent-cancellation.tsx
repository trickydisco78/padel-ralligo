import { useAuthIntent, useSession } from '@padel/auth';
import { useSegments } from 'expo-router';
import { useEffect, useRef } from 'react';

/**
 * Drops a pending intent when a guest leaves the sign-in and sign-up screens without signing in
 * ("Continue browsing", back). It lives at the root, outside the auth screens, so it never unmounts
 * at the moment a sign-in succeeds, and it checks the session so that case keeps the intent.
 */
export function AuthIntentCancellation() {
  const segments = useSegments() as string[];
  const inAuthScreens = segments[0] === '(auth)';
  const { status } = useSession();
  const { clearIntent } = useAuthIntent();
  const wasInAuthScreens = useRef(false);

  useEffect(() => {
    if (wasInAuthScreens.current && !inAuthScreens && status === 'signedOut') clearIntent();
    wasInAuthScreens.current = inAuthScreens;
  }, [inAuthScreens, status, clearIntent]);

  return null;
}
