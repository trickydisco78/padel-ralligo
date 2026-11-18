import { AuthIntentProvider, SessionProvider } from '@padel/auth';

import { RootStack } from '@/components/root-stack';
import { AuthIntentCancellation } from '@/session/auth-intent-cancellation';
import { AuthIntentResolver } from '@/session/auth-intent-resolver';
import { SessionCacheGuard } from '@/session/session-cache-guard';

/**
 * The app's session, intent and navigation composition. Rendered inside a query provider, so tests
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
      </AuthIntentProvider>
    </SessionProvider>
  );
}
