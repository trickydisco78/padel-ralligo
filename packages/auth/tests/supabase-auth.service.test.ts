import type { TypedSupabaseClient } from '@padel/supabase';
import { fakeSession, mockState, resetMockSupabase, supabase as fakeClient } from '@padel/supabase/testing';

import { createSupabaseAuthService } from '../src/infrastructure/supabase-auth.service';

const client = fakeClient as unknown as TypedSupabaseClient;
const auth = fakeClient.auth;
const service = createSupabaseAuthService(client);

beforeEach(() => {
  resetMockSupabase();
  jest.clearAllMocks();
});

describe('currentUser', () => {
  it('is null when signed out', async () => {
    expect(await service.currentUser()).toBeNull();
  });

  it('maps the stored session to a minimal user', async () => {
    mockState.session = fakeSession('u1', false);
    expect(await service.currentUser()).toEqual({ id: 'u1', emailConfirmed: false });
  });
});

describe('onUserChange', () => {
  it('reports sign-in and sign-out, and stops after unsubscribing', () => {
    const listener = jest.fn();
    const unsubscribe = service.onUserChange(listener);

    mockState.listeners.forEach((l) => l('SIGNED_IN', fakeSession('u1')));
    mockState.listeners.forEach((l) => l('SIGNED_OUT', null));
    expect(listener.mock.calls).toEqual([[{ id: 'u1', emailConfirmed: true }], [null]]);

    unsubscribe();
    expect(mockState.listeners.size).toBe(0);
  });
});

describe('signIn', () => {
  it('trims the email and succeeds', async () => {
    expect(await service.signIn('  a@example.com ', 'pw')).toEqual({ ok: true });
    expect(auth.signInWithPassword).toHaveBeenCalledWith({ email: 'a@example.com', password: 'pw' });
  });

  it('reports an unverified email separately from bad credentials', async () => {
    auth.signInWithPassword.mockResolvedValueOnce({ data: {}, error: { code: 'email_not_confirmed' } } as never);
    expect(await service.signIn('a@example.com', 'pw')).toEqual({ ok: false, reason: 'email_not_confirmed' });

    auth.signInWithPassword.mockResolvedValueOnce({ data: {}, error: { code: 'invalid_credentials' } } as never);
    expect(await service.signIn('a@example.com', 'pw')).toEqual({ ok: false, reason: 'invalid_credentials' });
  });
});

describe('signUp', () => {
  it('records the terms and age confirmations', async () => {
    expect(await service.signUp('a@example.com', 'password1')).toEqual({ ok: true });
    expect(auth.signUp).toHaveBeenCalledWith({
      email: 'a@example.com',
      password: 'password1',
      options: { data: { terms_accepted: true, age_confirmed: true } },
    });
  });

  it('flags an existing address (a user with no identities)', async () => {
    auth.signUp.mockResolvedValueOnce({ data: { user: { identities: [] }, session: null }, error: null } as never);
    expect(await service.signUp('a@example.com', 'password1')).toEqual({ ok: false, reason: 'already_registered' });
  });

  it('passes through the failure message', async () => {
    auth.signUp.mockResolvedValueOnce({ data: {}, error: { message: 'Weak password' } } as never);
    expect(await service.signUp('a@example.com', 'password1')).toEqual({
      ok: false,
      reason: 'failed',
      message: 'Weak password',
    });
  });
});

describe('setAutoRefresh', () => {
  it('starts and stops token refresh', () => {
    service.setAutoRefresh(true);
    service.setAutoRefresh(false);
    expect(auth.startAutoRefresh).toHaveBeenCalledTimes(1);
    expect(auth.stopAutoRefresh).toHaveBeenCalledTimes(1);
  });
});
