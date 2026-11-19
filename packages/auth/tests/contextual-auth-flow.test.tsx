import { Stack, router } from 'expo-router';
import { act, fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import { Text } from 'react-native';

import { resetMockSupabase } from '@padel/supabase/testing';

import { AuthIntentProvider, useRequireAuth } from '../src/presentation/auth-intent';
import { useAuthIntent } from '../src/presentation/auth-intent-context';
import { SignInPrompt } from '../src/presentation/components/sign-in-prompt';
import { SessionProvider } from '../src/presentation/session';
import { SignInScreen } from '../src/presentation/screens/sign-in-screen';
import { SignUpScreen } from '../src/presentation/screens/sign-up-screen';

jest.mock('@padel/supabase', () => jest.requireActual('@padel/supabase/testing'));

function Probe() {
  const { intent } = useAuthIntent();
  return <Text>{`intent: ${intent ? intent.type : 'none'}`}</Text>;
}

function MatchScreen() {
  const requireAuth = useRequireAuth();
  return <Text onPress={() => requireAuth({ type: 'joinMatch', matchId: 'm1' })}>Join match</Text>;
}

const routes = {
  _layout: () => (
    <SessionProvider>
      <AuthIntentProvider>
        <Stack screenOptions={{ headerShown: false }} />
        <Probe />
      </AuthIntentProvider>
    </SessionProvider>
  ),
  index: MatchScreen,
  profile: () => <SignInPrompt message="Sign in to see your profile." intent={{ type: 'openProfile' }} />,
  '(auth)/_layout': () => <Stack screenOptions={{ headerShown: false }} />,
  '(auth)/sign-in': SignInScreen,
  '(auth)/sign-up': SignUpScreen,
};

beforeEach(() => resetMockSupabase());

async function openSheet() {
  await renderRouter(routes, { initialUrl: '/' });
  await waitFor(() => expect(screen.getByText('Join match')).toBeTruthy());
  await fireEvent.press(screen.getByText('Join match'));
  await waitFor(() => expect(screen.getByText('Ask to join this match')).toBeTruthy());
}

describe('contextual authentication flow', () => {
  it('keeps the intent and closes the sheet when the guest chooses Create account', async () => {
    await openSheet();
    await fireEvent.press(screen.getByRole('button', { name: 'Create account' }));

    await waitFor(() => expect(screen.getByText('Already have an account? Sign in')).toBeTruthy());
    expect(screen.queryByText('Ask to join this match')).toBeNull();
    expect(screen.getByText('intent: joinMatch')).toBeTruthy();
  });

  it('keeps the intent when the guest chooses Sign in', async () => {
    await openSheet();
    await fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => expect(screen.getByText('New here? Create an account')).toBeTruthy());
    expect(screen.getByText('intent: joinMatch')).toBeTruthy();
  });

  it('keeps the intent while switching between sign-up and sign-in', async () => {
    await openSheet();
    await fireEvent.press(screen.getByRole('button', { name: 'Create account' }));
    await waitFor(() => expect(screen.getByText('Already have an account? Sign in')).toBeTruthy());

    await fireEvent.press(screen.getByText('Already have an account? Sign in'));
    await waitFor(() => expect(screen.getByText('New here? Create an account')).toBeTruthy());
    expect(screen.getByText('intent: joinMatch')).toBeTruthy();

    await fireEvent.press(screen.getByText('New here? Create an account'));
    await waitFor(() => expect(screen.getByText('Already have an account? Sign in')).toBeTruthy());
    expect(screen.getByText('intent: joinMatch')).toBeTruthy();
  });

  it('does not stack screens when switching, so back returns to where the guest started', async () => {
    await openSheet();
    await fireEvent.press(screen.getByRole('button', { name: 'Create account' }));
    await waitFor(() => expect(screen.getByText('Already have an account? Sign in')).toBeTruthy());
    await fireEvent.press(screen.getByText('Already have an account? Sign in'));
    await waitFor(() => expect(screen.getByText('New here? Create an account')).toBeTruthy());

    await act(async () => router.back());
    await waitFor(() => expect(screen.getByText('Join match')).toBeTruthy());
  });

  it('records the screen intent when a tab prompt is used', async () => {
    await renderRouter(routes, { initialUrl: '/profile' });
    await waitFor(() => expect(screen.getByText('intent: none')).toBeTruthy());

    await fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));
    await waitFor(() => expect(screen.getByText('New here? Create an account')).toBeTruthy());
    expect(screen.getByText('intent: openProfile')).toBeTruthy();
  });

  it('leaves no intent when a prompt without one is used', async () => {
    const plain = { ...routes, profile: () => <SignInPrompt message="Sign in." /> };
    await renderRouter(plain, { initialUrl: '/profile' });
    await fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));
    await waitFor(() => expect(screen.getByText('New here? Create an account')).toBeTruthy());
    expect(screen.getByText('intent: none')).toBeTruthy();
  });
});
