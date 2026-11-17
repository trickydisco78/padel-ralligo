import { Stack } from 'expo-router';
import { fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import { Text } from 'react-native';

import ProfileScreen from '@/app/(tabs)/profile';
import { QueryTestProvider } from '@padel/query/testing';
import { SessionProvider } from '@/auth/session';
import { fakeSession, mockState, resetMockSupabase, supabase } from '@padel/supabase/testing';

jest.mock('@padel/supabase', () => jest.requireActual('@padel/supabase/testing'));

const routes = {
  _layout: () => (
    <QueryTestProvider><SessionProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </SessionProvider></QueryTestProvider>
  ),
  index: () => <Text>Home screen</Text>,
  profile: ProfileScreen,
};

beforeEach(() => {
  resetMockSupabase();
  jest.clearAllMocks();
});

describe('sign out', () => {
  it('ends the session and returns the user to the signed-out Home', async () => {
    mockState.session = fakeSession();
    mockState.profile = { id: 'user-1', profile_sports: [{ skill_tier: 'Beginner' }] };

    await renderRouter(routes, { initialUrl: '/profile' });
    await fireEvent.press(await screen.findByRole('button', { name: 'Sign out' }));

    await waitFor(() => expect(supabase.auth.signOut).toHaveBeenCalledTimes(1));
    expect(mockState.session).toBeNull();
    await waitFor(() => expect(screen.getByText('Home screen')).toBeTruthy());
  });
});
