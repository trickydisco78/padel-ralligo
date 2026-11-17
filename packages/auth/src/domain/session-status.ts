import type { AuthUser } from './auth-user';

export type SessionStatus = 'loading' | 'signedOut' | 'signedIn';

/** `undefined` user = still reading storage; `null` = signed out. */
export function deriveSessionStatus(user: AuthUser | null | undefined): SessionStatus {
  if (user === undefined) return 'loading';
  return user === null ? 'signedOut' : 'signedIn';
}
