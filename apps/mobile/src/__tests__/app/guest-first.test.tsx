import { SignInScreen, SignUpScreen } from '@padel/auth';
import { ProfileSetupScreen } from '@padel/profiles';
import { createQueryClient } from '@padel/query';
import { QueryTestProvider } from '@padel/query/testing';
import { fakeSession, mockState, resetMockSupabase, supabase } from '@padel/supabase/testing';
import { Stack, router } from 'expo-router';
import { act, fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import { Text } from 'react-native';

import MatchScreen from '@/app/match/[id]';
import { AppShell } from '@/components/app-shell';

jest.mock('@padel/supabase', () => jest.requireActual('@padel/supabase/testing'));

const matchRow = {
  id: 'm1',
  destination_id: 'marbella',
  destination_name: 'Marbella',
  destination_country: 'Spain',
  start_date: '2099-02-20',
  end_date: null,
  start_time: '18:30:00',
  venue: 'Puerto Padel Club',
  level_wanted: 'Intermediate',
  players_needed: 2,
  description: 'Friendly doubles',
  poster_name: 'Leon',
  poster_skill_tier: 'Advanced',
};

const completeProfile = (id: string, name = 'Leon') => ({
  id,
  display_name: name,
  home_city: null,
  bio: '',
  profile_sports: [{ skill_tier: 'Intermediate' }],
});

function Home() {
  return (
    <>
      <Text>Home screen</Text>
      <Text onPress={() => router.push('/match/m1')}>Open match</Text>
      <Text onPress={() => router.push('/match/gone')}>Open stale match</Text>
    </>
  );
}

let client = createQueryClient({ gcTime: Infinity });

const routes = {
  // The real root layout anchors history on the tabs; keep that so rebuilding from a URL matches the app.
  _layout: {
    default: () => (
      <QueryTestProvider client={client}>
        <AppShell />
      </QueryTestProvider>
    ),
    unstable_settings: { anchor: '(tabs)' },
  },
  '(tabs)/_layout': () => <Stack screenOptions={{ headerShown: false }} />,
  '(tabs)/index': Home,
  '(tabs)/discover': () => <Text>Discover screen</Text>,
  'match/[id]': MatchScreen,
  '(auth)/_layout': () => <Stack screenOptions={{ headerShown: false }} />,
  '(auth)/sign-in': SignInScreen,
  '(auth)/sign-up': SignUpScreen,
  'profile-setup': ProfileSetupScreen,
};

beforeEach(() => {
  resetMockSupabase();
  jest.clearAllMocks();
  client = createQueryClient({ gcTime: Infinity });
  mockState.listings = [matchRow];
});

/** Makes the next sign-in succeed the way Supabase does: a session, then a SIGNED_IN event. */
function nextSignInSucceeds(userId: string, profile: unknown) {
  supabase.auth.signInWithPassword.mockImplementationOnce(async () => {
    mockState.session = fakeSession(userId);
    mockState.profile = profile;
    mockState.listeners.forEach((listener) => listener('SIGNED_IN', mockState.session));
    return { data: {}, error: null } as never;
  });
}

async function openMatchAsGuest() {
  await renderRouter(routes, { initialUrl: '/' });
  await waitFor(() => expect(screen.getByText('Home screen')).toBeTruthy());
  await fireEvent.press(screen.getByText('Open match'));
  await waitFor(() => expect(screen.getByRole('header', { name: 'Marbella' })).toBeTruthy());
}

async function joinThenChoose(action: 'Sign in' | 'Create account') {
  await fireEvent.press(screen.getByRole('button', { name: 'Join match' }));
  await waitFor(() => expect(screen.getByText('Join this match')).toBeTruthy());
  await fireEvent.press(screen.getByRole('button', { name: action }));
}

async function submitCredentials() {
  await fireEvent.changeText(screen.getByLabelText('Email'), 'leon@example.com');
  await fireEvent.changeText(screen.getByLabelText('Password'), 'password1');
  await fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));
}

describe('match details', () => {
  it('lets a guest open a match from Home without being asked to sign in', async () => {
    await openMatchAsGuest();
    expect(screen.getByText('Marbella, Spain')).toBeTruthy();
    expect(screen.getByText('Puerto Padel Club')).toBeTruthy();
    expect(screen.getByText('2 spots needed')).toBeTruthy();
    expect(screen.queryByText('Join this match')).toBeNull();
  });

  it('shows an unavailable match for a closed, past or unknown id', async () => {
    await renderRouter(routes, { initialUrl: '/' });
    await waitFor(() => expect(screen.getByText('Open stale match')).toBeTruthy());
    await fireEvent.press(screen.getByText('Open stale match'));
    await waitFor(() => expect(screen.getByText('This match is no longer available')).toBeTruthy());
    expect(screen.getByRole('button', { name: 'Back to Discover' })).toBeTruthy();
  });

  it('shows a retry when the match cannot be loaded', async () => {
    mockState.listingsError = { message: 'down' };
    await renderRouter(routes, { initialUrl: '/' });
    await fireEvent.press(await screen.findByText('Open match'));
    await waitFor(() => expect(screen.getByText('Could not load this match.')).toBeTruthy());
    expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy();
  });

  it('asks a guest to sign in when they tap Join match, and joins nothing', async () => {
    await openMatchAsGuest();
    await fireEvent.press(screen.getByRole('button', { name: 'Join match' }));

    await waitFor(() => expect(screen.getByText('Join this match')).toBeTruthy());
    expect(screen.getByRole('button', { name: 'Create account' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Dismiss' })).toBeTruthy();
    expect(mockState.inserts).toHaveLength(0);
    expect(mockState.upserts).toHaveLength(0);
  });

  it('leaves the guest on the match when the prompt is dismissed', async () => {
    await openMatchAsGuest();
    await fireEvent.press(screen.getByRole('button', { name: 'Join match' }));
    await waitFor(() => expect(screen.getByText('Join this match')).toBeTruthy());

    await fireEvent.press(screen.getByRole('button', { name: 'Dismiss' }));
    await waitFor(() => expect(screen.queryByText('Join this match')).toBeNull());
    expect(screen.getByRole('header', { name: 'Marbella' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Join match' })).toBeTruthy();
  });

  it('dismisses the prompt on Android back and stays on the match', async () => {
    await openMatchAsGuest();
    await fireEvent.press(screen.getByRole('button', { name: 'Join match' }));
    await waitFor(() => expect(screen.getByText('Join this match')).toBeTruthy());

    await act(async () => screen.getByTestId('bottom-sheet-modal').props.onRequestClose());
    await waitFor(() => expect(screen.queryByText('Join this match')).toBeNull());
    expect(screen.getByRole('header', { name: 'Marbella' })).toBeTruthy();
  });

  it('shows a signed-in user a disabled Join match button and no prompt', async () => {
    mockState.session = fakeSession('u1');
    mockState.profile = completeProfile('u1');
    await renderRouter(routes, { initialUrl: '/' });
    await fireEvent.press(await screen.findByText('Open match'));
    await waitFor(() => expect(screen.getByRole('header', { name: 'Marbella' })).toBeTruthy());

    const join = screen.getByRole('button', { name: 'Join match' });
    expect(join.props.accessibilityState.disabled).toBe(true);
    expect(join.props.accessibilityHint).toBe('Joining is not available yet');
    await fireEvent.press(join);
    expect(screen.queryByText('Join this match')).toBeNull();
    expect(mockState.inserts).toHaveLength(0);
  });
});

describe('returning after authentication', () => {
  it('takes a guest who signs in back to the match, with Join still needing its own tap', async () => {
    nextSignInSucceeds('u1', completeProfile('u1'));
    await openMatchAsGuest();
    await joinThenChoose('Sign in');
    await waitFor(() => expect(screen.getByText('New here? Create an account')).toBeTruthy());
    await submitCredentials();

    await waitFor(() => expect(screen.getByRole('header', { name: 'Marbella' })).toBeTruthy());
    expect(screen.queryByText('New here? Create an account')).toBeNull();
    const join = screen.getByRole('button', { name: 'Join match' });
    expect(join.props.accessibilityState.disabled).toBe(true);
    expect(mockState.inserts).toHaveLength(0);
    expect(mockState.upserts).toHaveLength(0);
  });

  it('does not stack a second copy of the match: back goes to where the guest started', async () => {
    nextSignInSucceeds('u1', completeProfile('u1'));
    await openMatchAsGuest();
    await joinThenChoose('Sign in');
    await submitCredentials();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Join match' }).props.accessibilityState.disabled).toBe(true));

    await act(async () => router.back());
    await waitFor(() => expect(screen.getByText('Home screen')).toBeTruthy());
  });

  it('holds a new account at profile setup, then returns to the match once the profile is saved', async () => {
    nextSignInSucceeds('u2', null);
    await openMatchAsGuest();
    await joinThenChoose('Sign in');
    await submitCredentials();

    await waitFor(() => expect(screen.getByText('Set up your profile')).toBeTruthy());
    expect(screen.queryByRole('header', { name: 'Marbella' })).toBeNull();

    await fireEvent.changeText(screen.getByLabelText('Display name'), 'Leon');
    await fireEvent.press(screen.getByRole('radio', { name: 'Beginner' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Save and continue' }));

    await waitFor(() => expect(screen.getByRole('header', { name: 'Marbella' })).toBeTruthy());
    expect(screen.queryByText('Set up your profile')).toBeNull();
  });

  it('shows the unavailable state when the match closed while the guest was signing in', async () => {
    nextSignInSucceeds('u1', completeProfile('u1'));
    await openMatchAsGuest();
    await joinThenChoose('Sign in');
    mockState.listings = [];
    await submitCredentials();

    await waitFor(() => expect(screen.getByText('This match is no longer available')).toBeTruthy());
  });

  it('does not resume the intent a second time', async () => {
    nextSignInSucceeds('u1', completeProfile('u1'));
    await openMatchAsGuest();
    await joinThenChoose('Sign in');
    await submitCredentials();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Join match' }).props.accessibilityState.disabled).toBe(true));
    await act(async () => router.back());
    await waitFor(() => expect(screen.getByText('Home screen')).toBeTruthy());

    await act(async () => {
      mockState.listeners.forEach((listener) => listener('TOKEN_REFRESHED', mockState.session));
    });
    expect(screen.getByText('Home screen')).toBeTruthy();
    expect(screen.queryByRole('header', { name: 'Marbella' })).toBeNull();
  });
});

describe('cancelling authentication', () => {
  it('forgets the intent when the guest backs out of the sign-in screen', async () => {
    await openMatchAsGuest();
    await joinThenChoose('Sign in');
    await waitFor(() => expect(screen.getByText('New here? Create an account')).toBeTruthy());

    await act(async () => router.back());
    await waitFor(() => expect(screen.getByRole('header', { name: 'Marbella' })).toBeTruthy());

    // A later sign-in must not jump back to the match: sign in from the sign-in screen opened fresh.
    nextSignInSucceeds('u1', completeProfile('u1'));
    await act(async () => router.dismissTo('/'));
    await waitFor(() => expect(screen.getByText('Home screen')).toBeTruthy());
    await act(async () => router.push('/sign-in'));
    await submitCredentials();
    await waitFor(() => expect(screen.getByText('Home screen')).toBeTruthy());
    expect(screen.queryByRole('header', { name: 'Marbella' })).toBeNull();
  });

  it('forgets the intent when the guest continues browsing instead', async () => {
    await openMatchAsGuest();
    await joinThenChoose('Create account');
    await waitFor(() => expect(screen.getByText('Continue browsing')).toBeTruthy());
    await fireEvent.press(screen.getByText('Continue browsing'));
    await waitFor(() => expect(screen.getByText('Home screen')).toBeTruthy());

    nextSignInSucceeds('u1', completeProfile('u1'));
    await act(async () => router.push('/sign-in'));
    await submitCredentials();
    await waitFor(() => expect(screen.getByText('Home screen')).toBeTruthy());
    expect(screen.queryByRole('header', { name: 'Marbella' })).toBeNull();
  });
});

describe('session and cache hygiene', () => {
  const entriesFor = (userId: string) =>
    client
      .getQueryCache()
      .getAll()
      .filter((query) => JSON.stringify(query.queryKey).includes(userId));

  it('subscribes to authentication changes exactly once', async () => {
    await renderRouter(routes, { initialUrl: '/' });
    await waitFor(() => expect(screen.getByText('Home screen')).toBeTruthy());
    expect(supabase.auth.onAuthStateChange).toHaveBeenCalledTimes(1);
    expect(mockState.listeners.size).toBe(1);
  });

  it("discards one user's cached private data when they sign out, so the next user never sees it", async () => {
    mockState.session = fakeSession('user-a');
    mockState.profile = completeProfile('user-a', 'Alice');
    await renderRouter(routes, { initialUrl: '/' });
    await waitFor(() => expect(screen.getByText('Home screen')).toBeTruthy());
    await waitFor(() => expect(entriesFor('user-a').length).toBeGreaterThan(0));

    await act(async () => {
      mockState.session = null;
      mockState.listeners.forEach((listener) => listener('SIGNED_OUT', null));
    });
    await waitFor(() => expect(entriesFor('user-a')).toHaveLength(0));

    await act(async () => {
      mockState.session = fakeSession('user-b');
      mockState.profile = completeProfile('user-b', 'Bea');
      mockState.listeners.forEach((listener) => listener('SIGNED_IN', mockState.session));
    });
    await waitFor(() => expect(entriesFor('user-b').length).toBeGreaterThan(0));
    expect(entriesFor('user-a')).toHaveLength(0);
  });

  it('treats an expired session like a sign-out', async () => {
    mockState.session = fakeSession('user-a');
    mockState.profile = completeProfile('user-a');
    await renderRouter(routes, { initialUrl: '/' });
    await waitFor(() => expect(entriesFor('user-a').length).toBeGreaterThan(0));

    await act(async () => {
      mockState.session = null;
      mockState.listeners.forEach((listener) => listener('TOKEN_REFRESHED', null));
    });
    await waitFor(() => expect(entriesFor('user-a')).toHaveLength(0));
    expect(screen.getByText('Home screen')).toBeTruthy();
  });

  it('keeps public data when a guest signs in', async () => {
    nextSignInSucceeds('u1', completeProfile('u1'));
    await openMatchAsGuest();
    expect(client.getQueryCache().getAll().length).toBeGreaterThan(0);
    const before = client.getQueryCache().getAll().length;

    await fireEvent.press(screen.getByRole('button', { name: 'Join match' }));
    await waitFor(() => expect(screen.getByText('Join this match')).toBeTruthy());
    await fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));
    await submitCredentials();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Join match' }).props.accessibilityState.disabled).toBe(true));
    expect(client.getQueryCache().getAll().length).toBeGreaterThanOrEqual(before);
  });
});
