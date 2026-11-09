import { Stack } from 'expo-router';
import { renderRouter, screen, waitFor } from 'expo-router/testing-library';
import { Text } from 'react-native';

import { SessionProvider } from '@/auth/session';
import { RootStack } from '@/components/root-stack';
import { fakeSession, mockState, resetMockSupabase, supabase } from '@/test/mock-supabase';

jest.mock('@/lib/supabase', () => jest.requireActual('@/test/mock-supabase'));

function Layout() {
  return (
    <SessionProvider>
      <RootStack />
    </SessionProvider>
  );
}

const routes = {
  _layout: Layout,
  '(auth)/_layout': () => <Stack screenOptions={{ headerShown: false }} />,
  '(tabs)/_layout': () => <Stack screenOptions={{ headerShown: false }} />,
  '(auth)/sign-in': () => <Text>Sign-in screen</Text>,
  'profile-setup': () => <Text>Profile setup screen</Text>,
  '(tabs)/index': () => <Text>Home screen</Text>,
};

beforeEach(() => resetMockSupabase());

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
});
