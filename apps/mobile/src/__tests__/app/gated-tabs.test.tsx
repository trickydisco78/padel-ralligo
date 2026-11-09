import { Stack } from 'expo-router';
import { renderRouter, screen, waitFor } from 'expo-router/testing-library';

import CreateScreen from '@/app/(tabs)/create';
import MatchesScreen from '@/app/(tabs)/matches';
import ProfileScreen from '@/app/(tabs)/profile';
import { SessionProvider } from '@/auth/session';
import { fakeSession, mockState, resetMockSupabase } from '@/test/mock-supabase';

jest.mock('@/lib/supabase', () => jest.requireActual('@/test/mock-supabase'));

function routesFor(Screen: () => React.JSX.Element) {
  return {
    _layout: () => (
      <SessionProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </SessionProvider>
    ),
    index: Screen,
  };
}

beforeEach(() => {
  resetMockSupabase();
  mockState.destinations = [];
});

const cases = [
  { name: 'Create', Screen: CreateScreen, feature: 'Post a game' },
  { name: 'Matches', Screen: MatchesScreen, feature: 'Coming soon' },
  { name: 'Profile', Screen: ProfileScreen, feature: 'Sign out' },
];

describe.each(cases)('$name tab', ({ Screen, feature }) => {
  it('shows a visitor the sign-in prompt and none of the feature', async () => {
    await renderRouter(routesFor(Screen));
    await waitFor(() => expect(screen.getByText('Sign in to continue')).toBeTruthy());
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeTruthy();
    expect(screen.getByText('Create an account')).toBeTruthy();
    expect(screen.queryByText(feature)).toBeNull();
    expect(screen.queryByText('Display name')).toBeNull();
  });

  it('shows a signed-in user the feature, not the prompt', async () => {
    mockState.session = fakeSession();
    mockState.profile = { id: 'user-1', profile_sports: [{ skill_tier: 'Beginner' }] };
    await renderRouter(routesFor(Screen));
    await waitFor(() => expect(screen.getByText(feature)).toBeTruthy());
    expect(screen.queryByText('Sign in to continue')).toBeNull();
  });
});
