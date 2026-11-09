import { Stack } from 'expo-router';
import { fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import { Text } from 'react-native';

import { SignInPrompt } from '@/components/sign-in-prompt';

const routes = {
  _layout: () => <Stack screenOptions={{ headerShown: false }} />,
  index: () => <SignInPrompt message="Create an account to post games." />,
  '(auth)/sign-in': () => <Text>Sign-in screen</Text>,
  '(auth)/sign-up': () => <Text>Sign-up screen</Text>,
};

describe('SignInPrompt', () => {
  it('explains what needs an account', async () => {
    await renderRouter(routes);
    expect(screen.getByText('Sign in to continue')).toBeTruthy();
    expect(screen.getByText('Create an account to post games.')).toBeTruthy();
  });

  it('opens the sign-in screen', async () => {
    await renderRouter(routes);
    await fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));
    await waitFor(() => expect(screen.getByText('Sign-in screen')).toBeTruthy());
  });

  it('opens the sign-up screen', async () => {
    await renderRouter(routes);
    await fireEvent.press(screen.getByText('Create an account'));
    await waitFor(() => expect(screen.getByText('Sign-up screen')).toBeTruthy());
  });
});
