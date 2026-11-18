import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { Text } from 'react-native';

import { fakeSession, mockState, resetMockSupabase, supabase } from '@padel/supabase/testing';

import { AuthIntentProvider, useRequireAuth } from '../src/presentation/auth-intent';
import { useAuthIntent } from '../src/presentation/auth-intent-context';
import { SessionProvider, useSession } from '../src/presentation/session';

jest.mock('@padel/supabase', () => jest.requireActual('@padel/supabase/testing'));
jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }), Link: 'Link' }));

const wrapper = ({ children }: { children: ReactNode }) => (
  <SessionProvider>
    <AuthIntentProvider>{children}</AuthIntentProvider>
  </SessionProvider>
);

const join = { type: 'joinMatch', matchId: 'm1' } as const;

beforeEach(() => {
  resetMockSupabase();
  jest.clearAllMocks();
});

async function signedOutHook() {
  const hook = await renderHook(() => ({ intents: useAuthIntent(), session: useSession() }), { wrapper });
  await waitFor(() => expect(hook.result.current.session.status).toBe('signedOut'));
  return hook;
}

describe('AuthIntentProvider', () => {
  it('starts with no intent and the sheet closed', async () => {
    const { result } = await signedOutHook();
    expect(result.current.intents.intent).toBeNull();
    expect(result.current.intents.sheetOpen).toBe(false);
  });

  it('records an intent and opens the sheet on request', async () => {
    const { result } = await signedOutHook();
    await act(async () => result.current.intents.requestAuth(join));
    expect(result.current.intents.intent).toEqual(join);
    expect(result.current.intents.sheetOpen).toBe(true);
  });

  it('records an intent without opening the sheet', async () => {
    const { result } = await signedOutHook();
    await act(async () => result.current.intents.setIntent({ type: 'openProfile' }));
    expect(result.current.intents.intent).toEqual({ type: 'openProfile' });
    expect(result.current.intents.sheetOpen).toBe(false);
  });

  it('replaces a pending intent with a newer one', async () => {
    const { result } = await signedOutHook();
    await act(async () => result.current.intents.requestAuth(join));
    await act(async () => result.current.intents.requestAuth({ type: 'createMatch' }));
    expect(result.current.intents.intent).toEqual({ type: 'createMatch' });
  });

  it('ignores a malformed intent', async () => {
    const { result } = await signedOutHook();
    await act(async () => result.current.intents.requestAuth({ type: 'joinMatch', matchId: '../x' }));
    expect(result.current.intents.intent).toBeNull();
    expect(result.current.intents.sheetOpen).toBe(false);
    await act(async () => result.current.intents.setIntent({ type: 'nope' } as never));
    expect(result.current.intents.intent).toBeNull();
  });

  it('keeps the intent when the sheet closes to move on, and drops it on dismiss', async () => {
    const { result } = await signedOutHook();
    await act(async () => result.current.intents.requestAuth(join));
    await act(async () => result.current.intents.closeSheet());
    expect(result.current.intents.sheetOpen).toBe(false);
    expect(result.current.intents.intent).toEqual(join);

    await act(async () => result.current.intents.requestAuth(join));
    await act(async () => result.current.intents.dismissSheet());
    expect(result.current.intents.sheetOpen).toBe(false);
    expect(result.current.intents.intent).toBeNull();
  });

  it('keeps a pending intent when the guest signs in', async () => {
    const { result } = await signedOutHook();
    await act(async () => result.current.intents.setIntent(join));
    await act(async () => {
      mockState.session = fakeSession('u1');
      mockState.listeners.forEach((listener) => listener('SIGNED_IN', mockState.session));
    });
    await waitFor(() => expect(result.current.session.status).toBe('signedIn'));
    expect(result.current.intents.intent).toEqual(join);
  });

  it('clears the intent and closes the sheet on sign-out', async () => {
    mockState.session = fakeSession('u1');
    const { result } = await renderHook(() => ({ intents: useAuthIntent(), session: useSession() }), { wrapper });
    await waitFor(() => expect(result.current.session.status).toBe('signedIn'));

    await act(async () => result.current.intents.requestAuth(join));
    await act(async () => {
      await result.current.session.signOut();
    });
    await waitFor(() => expect(result.current.session.status).toBe('signedOut'));
    expect(result.current.intents.intent).toBeNull();
    expect(result.current.intents.sheetOpen).toBe(false);
  });

  it('throws if used outside the provider', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    await expect(renderHook(() => useAuthIntent())).rejects.toThrow('useAuthIntent must be used inside AuthIntentProvider');
    consoleError.mockRestore();
  });
});

describe('useRequireAuth', () => {
  const setup = () => renderHook(() => ({ require: useRequireAuth(), intents: useAuthIntent(), session: useSession() }), { wrapper });

  it('prompts a guest, records the intent and says not to proceed', async () => {
    const { result } = await setup();
    await waitFor(() => expect(result.current.session.status).toBe('signedOut'));

    let proceed = true;
    await act(async () => {
      proceed = result.current.require(join);
    });
    expect(proceed).toBe(false);
    expect(result.current.intents.intent).toEqual(join);
    expect(result.current.intents.sheetOpen).toBe(true);
  });

  it('lets a signed-in user proceed without a prompt', async () => {
    mockState.session = fakeSession('u1');
    const { result } = await setup();
    await waitFor(() => expect(result.current.session.status).toBe('signedIn'));

    let proceed = false;
    await act(async () => {
      proceed = result.current.require(join);
    });
    expect(proceed).toBe(true);
    expect(result.current.intents.intent).toBeNull();
    expect(result.current.intents.sheetOpen).toBe(false);
  });

  it('neither proceeds nor prompts while the session is still loading', async () => {
    supabase.auth.getSession.mockImplementationOnce(() => new Promise(() => {}));
    const { result } = await setup();
    expect(result.current.session.status).toBe('loading');

    let proceed = true;
    await act(async () => {
      proceed = result.current.require(join);
    });
    expect(proceed).toBe(false);
    expect(result.current.intents.intent).toBeNull();
    expect(result.current.intents.sheetOpen).toBe(false);
  });
});

describe('AuthPromptSheet', () => {
  function Trigger({ intent }: { intent: Parameters<ReturnType<typeof useRequireAuth>>[0] }) {
    const requireAuth = useRequireAuth();
    const { intent: pending } = useAuthIntent();
    return (
      <>
        <Text onPress={() => requireAuth(intent)}>trigger</Text>
        <Text>{`pending: ${pending ? pending.type : 'none'}`}</Text>
      </>
    );
  }

  async function open(intent: Parameters<typeof Trigger>[0]['intent']) {
    await render(
      <SessionProvider>
        <AuthIntentProvider>
          <Trigger intent={intent} />
        </AuthIntentProvider>
      </SessionProvider>,
    );
    await waitFor(() => expect(screen.getByText('trigger')).toBeTruthy());
    await fireEvent.press(screen.getByText('trigger'));
  }

  it('asks a guest to join, with the three actions', async () => {
    await open(join);
    await waitFor(() => expect(screen.getByText('Join this match')).toBeTruthy());
    expect(
      screen.getByText('Create a free account or sign in to reserve your place and connect with other players.'),
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Create account' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Dismiss' })).toBeTruthy();
  });

  it.each([
    [{ type: 'connectPlayer' }, 'Connect with players'],
    [{ type: 'createMatch' }, 'Post a match'],
    [{ type: 'openMessages' }, 'Your messages'],
    [{ type: 'openPersonalMatches' }, 'Your matches'],
    [{ type: 'openProfile' }, 'Your padel profile'],
  ] as const)('names the action for %j', async (intent, title) => {
    await open(intent);
    await waitFor(() => expect(screen.getByText(title)).toBeTruthy());
  });

  it('dismisses and discards the intent', async () => {
    await open(join);
    await waitFor(() => expect(screen.getByText('pending: joinMatch')).toBeTruthy());
    await fireEvent.press(screen.getByRole('button', { name: 'Dismiss' }));
    await waitFor(() => expect(screen.queryByText('Join this match')).toBeNull());
    expect(screen.getByText('pending: none')).toBeTruthy();
  });

  it('dismisses from the close control too', async () => {
    await open(join);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Close' })).toBeTruthy());
    await fireEvent.press(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.getByText('pending: none')).toBeTruthy());
  });

  it('is not shown to a signed-in user', async () => {
    mockState.session = fakeSession('u1');
    await render(
      <SessionProvider>
        <AuthIntentProvider>
          <Trigger intent={join} />
        </AuthIntentProvider>
      </SessionProvider>,
    );
    await waitFor(() => expect(screen.getByText('trigger')).toBeTruthy());
    await act(async () => {});
    await fireEvent.press(screen.getByText('trigger'));
    expect(screen.queryByText('Join this match')).toBeNull();
  });
});
