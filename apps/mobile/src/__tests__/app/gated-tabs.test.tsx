import { Stack } from 'expo-router';
import { fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import { Text } from 'react-native';

import CreateScreen from '@/app/(tabs)/create';
import MatchesScreen from '@/app/(tabs)/matches';
import ProfileScreen from '@/app/(tabs)/profile';
import { QueryTestProvider } from '@padel/query/testing';
import { AuthIntentProvider, SessionProvider, useAuthIntent } from '@padel/auth';
import { fakeSession, mockState, resetMockSupabase } from '@padel/supabase/testing';

jest.mock('@padel/supabase', () => jest.requireActual('@padel/supabase/testing'));

function IntentProbe() {
  const { intent } = useAuthIntent();
  return <Text>{`intent: ${intent ? intent.type : 'none'}`}</Text>;
}

function routesFor(Screen: () => React.JSX.Element) {
  return {
    _layout: () => (
      <QueryTestProvider>
        <SessionProvider>
          <AuthIntentProvider>
            <Stack screenOptions={{ headerShown: false }} />
            <IntentProbe />
          </AuthIntentProvider>
        </SessionProvider>
      </QueryTestProvider>
    ),
    index: Screen,
    'sign-in': () => <Text>Sign-in screen</Text>,
    'sign-up': () => <Text>Sign-up screen</Text>,
  };
}

beforeEach(() => {
  resetMockSupabase();
  mockState.destinations = [];
});

const cases = [
  { name: 'Create', Screen: CreateScreen, feature: 'Post a game', title: 'Sign in to continue', intent: 'createMatch' },
  { name: 'Matches', Screen: MatchesScreen, feature: 'Coming soon', title: 'Sign in to continue', intent: 'openMessages' },
  { name: 'Profile', Screen: ProfileScreen, feature: 'Sign out', title: 'Your padel profile', intent: 'openProfile' },
];

describe.each(cases)('$name tab', ({ Screen, feature, title, intent }) => {
  it('shows a visitor the sign-in prompt and none of the feature', async () => {
    await renderRouter(routesFor(Screen));
    await waitFor(() => expect(screen.getByText(title)).toBeTruthy());
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Create account' })).toBeTruthy();
    expect(screen.queryByText(feature)).toBeNull();
    expect(screen.queryByText('Display name')).toBeNull();
  });

  it('records what the visitor was trying to open when they choose Sign in', async () => {
    await renderRouter(routesFor(Screen));
    await waitFor(() => expect(screen.getByText('intent: none')).toBeTruthy());
    await fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));
    await waitFor(() => expect(screen.getByText('Sign-in screen')).toBeTruthy());
    expect(screen.getByText(`intent: ${intent}`)).toBeTruthy();
  });

  it('records the same intent when they choose Create account', async () => {
    await renderRouter(routesFor(Screen));
    await waitFor(() => expect(screen.getByText('intent: none')).toBeTruthy());
    await fireEvent.press(screen.getByRole('button', { name: 'Create account' }));
    await waitFor(() => expect(screen.getByText('Sign-up screen')).toBeTruthy());
    expect(screen.getByText(`intent: ${intent}`)).toBeTruthy();
  });

  it('shows a signed-in user the feature, not the prompt', async () => {
    mockState.session = fakeSession();
    mockState.profile = { id: 'user-1', profile_sports: [{ skill_tier: 'Beginner' }] };
    await renderRouter(routesFor(Screen));
    await waitFor(() => expect(screen.getByText(feature)).toBeTruthy());
    expect(screen.queryByText(title)).toBeNull();
    expect(screen.queryByRole('button', { name: 'Create account' })).toBeNull();
  });
});
