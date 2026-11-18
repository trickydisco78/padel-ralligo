import { Stack } from 'expo-router';
import { act, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import { useEffect } from 'react';
import { Text } from 'react-native';

import { QueryTestProvider } from '@padel/query/testing';
import { SessionProvider, useSession } from '@padel/auth';
import { RootStack } from '@/components/root-stack';
import { fakeSession, mockState, resetMockSupabase, supabase } from '@padel/supabase/testing';

jest.mock('@padel/supabase', () => jest.requireActual('@padel/supabase/testing'));

function Layout() {
  return (
    <QueryTestProvider><SessionProvider>
      <RootStack />
    </SessionProvider></QueryTestProvider>
  );
}

// What the tabs screen saw: every session status it rendered with, and how many times it mounted.
const seen = { statuses: [] as string[], mounts: 0 };

function RecordingHome() {
  const { status } = useSession();
  seen.statuses.push(status);
  useEffect(() => {
    seen.mounts += 1;
  }, []);
  return <Text>Home screen</Text>;
}

const routes = {
  _layout: Layout,
  '(auth)/_layout': () => <Stack screenOptions={{ headerShown: false }} />,
  '(tabs)/_layout': () => <Stack screenOptions={{ headerShown: false }} />,
  '(auth)/sign-in': () => <Text>Sign-in screen</Text>,
  'profile-setup': () => <Text>Profile setup screen</Text>,
  '(tabs)/index': RecordingHome,
};

beforeEach(() => {
  resetMockSupabase();
  seen.statuses = [];
  seen.mounts = 0;
});

describe('route guard', () => {
  it('shows no screen while the session is still loading', async () => {
    supabase.auth.getSession.mockImplementationOnce(() => new Promise(() => {}));
    await renderRouter(routes, { initialUrl: '/' });
    expect(screen.queryByText('Home screen')).toBeNull();
    expect(screen.queryByText('Sign-in screen')).toBeNull();
  });

  it('opens a visitor on the tabs, not the sign-in screen', async () => {
    await renderRouter(routes, { initialUrl: '/' });
    await waitFor(() => expect(screen.getByText('Home screen')).toBeTruthy());
    expect(screen.queryByText('Sign-in screen')).toBeNull();
  });

  it('lets a visitor open the sign-in screen from the app', async () => {
    await renderRouter(routes, { initialUrl: '/sign-in' });
    await waitFor(() => expect(screen.getByText('Sign-in screen')).toBeTruthy());
    expect(screen.queryByText('Home screen')).toBeNull();
  });

  it('keeps a visitor out of profile setup', async () => {
    await renderRouter(routes, { initialUrl: '/profile-setup' });
    await waitFor(() => expect(screen.queryByText('Profile setup screen')).toBeNull());
  });

  it('sends a signed-in user without a profile to profile setup', async () => {
    mockState.session = fakeSession();
    mockState.profile = null;
    await renderRouter(routes, { initialUrl: '/' });
    await waitFor(() => expect(screen.getByText('Profile setup screen')).toBeTruthy());
    expect(screen.queryByText('Home screen')).toBeNull();
  });

  it('treats a profile with no skill tier as incomplete', async () => {
    mockState.session = fakeSession();
    mockState.profile = { id: 'user-1', profile_sports: [] };
    await renderRouter(routes, { initialUrl: '/' });
    await waitFor(() => expect(screen.getByText('Profile setup screen')).toBeTruthy());
  });

  it('shows the tabs for a signed-in user with a complete profile', async () => {
    mockState.session = fakeSession();
    mockState.profile = { id: 'user-1', profile_sports: [{ skill_tier: 'Intermediate' }] };
    await renderRouter(routes, { initialUrl: '/' });
    await waitFor(() => expect(screen.getByText('Home screen')).toBeTruthy());
    expect(screen.queryByText('Sign-in screen')).toBeNull();
  });

  it('keeps a signed-in user off the sign-in screen', async () => {
    mockState.session = fakeSession();
    mockState.profile = { id: 'user-1', profile_sports: [{ skill_tier: 'Intermediate' }] };
    await renderRouter(routes, { initialUrl: '/sign-in' });
    await waitFor(() => expect(screen.queryByText('Sign-in screen')).toBeNull());
  });

  it('never shows the guest state to a user whose session is being restored', async () => {
    mockState.session = fakeSession();
    mockState.profile = { id: 'user-1', profile_sports: [{ skill_tier: 'Intermediate' }] };
    await renderRouter(routes, { initialUrl: '/' });
    await waitFor(() => expect(screen.getByText('Home screen')).toBeTruthy());
    expect(seen.statuses.length).toBeGreaterThan(0);
    expect(seen.statuses).not.toContain('signedOut');
    expect(seen.statuses).not.toContain('loading');
  });

  it('keeps the tabs mounted while a guest who signs in has their profile checked', async () => {
    await renderRouter(routes, { initialUrl: '/' });
    await waitFor(() => expect(screen.getByText('Home screen')).toBeTruthy());
    expect(seen.mounts).toBe(1);

    await act(async () => {
      mockState.session = fakeSession('u1');
      mockState.profile = { id: 'u1', profile_sports: [{ skill_tier: 'Intermediate' }] };
      mockState.listeners.forEach((listener) => listener('SIGNED_IN', mockState.session));
    });
    await waitFor(() => expect(seen.statuses).toContain('signedIn'));
    await waitFor(() => expect(screen.getByText('Home screen')).toBeTruthy());

    expect(seen.mounts).toBe(1);
  });

  it('does not put a spinner over the screens once the app has settled', async () => {
    await renderRouter(routes, { initialUrl: '/' });
    await waitFor(() => expect(screen.getByText('Home screen')).toBeTruthy());

    await act(async () => {
      mockState.session = fakeSession('u1');
      mockState.profile = { id: 'u1', profile_sports: [{ skill_tier: 'Intermediate' }] };
      mockState.listeners.forEach((listener) => listener('SIGNED_IN', mockState.session));
    });
    expect(screen.getByText('Home screen')).toBeTruthy();
  });
});
