import { useAuthIntent } from '@padel/auth';
import { usePathname, useRouter, useSegments, type Href } from 'expo-router';
import { useEffect, useMemo } from 'react';

import { goToIntent, type IntentNavigator } from './intent-routes';
import { useAppStatus } from './app-status';

/**
 * Takes a user who has just signed in to the screen they were heading for. It waits until the app
 * status is `ready` (so a new account finishes profile setup first) and the sign-in screens have gone,
 * and clears the intent before navigating so it can only ever run once. It never performs the action,
 * only returns to it.
 */
export function AuthIntentResolver() {
  const status = useAppStatus();
  const { intent, clearIntent } = useAuthIntent();
  const router = useRouter();
  const pathname = usePathname();
  const segments = useSegments() as string[];
  // The sign-in screens and profile setup are the places a guest passes through; wait until they are gone.
  const passingThrough = segments[0] === '(auth)' || segments[0] === 'profile-setup';
  const navigator = useMemo<IntentNavigator>(
    () => ({
      navigate: (href) => router.navigate(href as Href),
      push: (href) => router.push(href as Href),
    }),
    [router],
  );

  useEffect(() => {
    if (status !== 'ready' || !intent || passingThrough) return;
    // One tick later, so the navigator has finished adding and removing screens for the new status
    // (for example the tabs coming back after profile setup) before it is asked to move.
    const timer = setTimeout(() => {
      clearIntent();
      goToIntent(navigator, intent, pathname);
    }, 0);
    return () => clearTimeout(timer);
  }, [status, intent, passingThrough, pathname, clearIntent, navigator]);

  return null;
}
