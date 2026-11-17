import type { AuthUser } from './auth-user';

export type SignInResult =
  | { ok: true }
  | { ok: false; reason: 'email_not_confirmed' | 'invalid_credentials' };

export type SignUpResult =
  | { ok: true }
  | { ok: false; reason: 'already_registered' }
  | { ok: false; reason: 'failed'; message: string };

export interface AuthService {
  /** The stored user, or null when signed out. */
  currentUser(): Promise<AuthUser | null>;
  /** Calls `listener` whenever the user signs in or out; returns an unsubscribe function. */
  onUserChange(listener: (user: AuthUser | null) => void): () => void;
  signIn(email: string, password: string): Promise<SignInResult>;
  /** Records the terms and age confirmations the sign-up flow has already enforced. */
  signUp(email: string, password: string): Promise<SignUpResult>;
  signOut(): Promise<void>;
  /** Token refresh is only wanted while the app is in the foreground. */
  setAutoRefresh(enabled: boolean): void;
}
