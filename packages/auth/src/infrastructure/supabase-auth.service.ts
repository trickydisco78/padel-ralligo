import type { Session, TypedSupabaseClient } from '@padel/supabase';

import type { AuthUser } from '../domain/auth-user';
import type { AuthService } from '../domain/auth.service';

function toAuthUser(session: Session | null): AuthUser | null {
  return session ? { id: session.user.id, emailConfirmed: !!session.user.email_confirmed_at } : null;
}

export function createSupabaseAuthService(client: TypedSupabaseClient): AuthService {
  return {
    async currentUser() {
      const { data } = await client.auth.getSession();
      return toAuthUser(data.session);
    },

    onUserChange(listener) {
      // Only call the listener here: awaiting Supabase calls in this callback can deadlock the auth client.
      const { data } = client.auth.onAuthStateChange((_event, session) => listener(toAuthUser(session)));
      return () => data.subscription.unsubscribe();
    },

    async signIn(email, password) {
      const { error } = await client.auth.signInWithPassword({ email: email.trim(), password });
      if (!error) return { ok: true };
      // Only reached after a correct password, so this does not reveal whether an account exists.
      return { ok: false, reason: error.code === 'email_not_confirmed' ? 'email_not_confirmed' : 'invalid_credentials' };
    },

    async signUp(email, password) {
      const { data, error } = await client.auth.signUp({
        email: email.trim(),
        password,
        // The database refuses sign up without both, and stamps the time itself.
        options: { data: { terms_accepted: true, age_confirmed: true } },
      });
      if (error) return { ok: false, reason: 'failed', message: error.message };
      // With email confirmation on, an existing address returns a user with no identities.
      if (data.user && data.user.identities?.length === 0) return { ok: false, reason: 'already_registered' };
      return { ok: true };
    },

    async signOut() {
      await client.auth.signOut();
    },

    setAutoRefresh(enabled) {
      if (enabled) client.auth.startAutoRefresh();
      else client.auth.stopAutoRefresh();
    },
  };
}
