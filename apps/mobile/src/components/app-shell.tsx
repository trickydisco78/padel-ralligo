import { AuthIntentProvider, SessionProvider } from '@padel/auth';

import { RootStack } from '@/components/root-stack';
import { AuthIntentCancellation } from '@/session/auth-intent-cancellation';
import { AuthIntentResolver } from '@/session/auth-intent-resolver';
import { SessionCacheGuard } from '@/session/session-cache-guard';
import { LaunchSplash } from '@/splash/launch-splash';

/**
 * The app's session, intent and navigation composition, with the launch screen over it until the app is ready. Rendered inside a query provider, so tests
 * can supply their own and exercise exactly what ships.
 */
export function AppShell() {
  return (
    <SessionProvider>
      <AuthIntentProvider>
        <SessionCacheGuard />
        <AuthIntentResolver />
        <AuthIntentCancellation />
        <RootStack />
        <LaunchSplash />
      </AuthIntentProvider>
    </SessionProvider>
  );
}
