import { Stack } from 'expo-router';
import { fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import { Text } from 'react-native';

import SignInScreen from '@/app/(auth)/sign-in';
import SignUpScreen from '@/app/(auth)/sign-up';
import { supabase } from '@/test/mock-supabase';

jest.mock('@/lib/supabase', () => jest.requireActual('@/test/mock-supabase'));

const routes = {
  '(auth)/_layout': () => <Stack screenOptions={{ headerShown: false }} />,
  '(auth)/sign-in': SignInScreen,
  '(auth)/sign-up': SignUpScreen,
};

beforeEach(() => jest.clearAllMocks());

async function fillSignUp({ email = 'a@example.com', password = 'password1', terms = true, age = true } = {}) {
  await fireEvent.changeText(screen.getByLabelText('Email'), email);
  await fireEvent.changeText(screen.getByLabelText('Password'), password);
  if (terms) await fireEvent.press(screen.getByRole('checkbox', { name: /terms/ }));
  if (age) await fireEvent.press(screen.getByRole('checkbox', { name: /18 or over/ }));
}

describe('leaving the auth screens', () => {
  const withHome = { ...routes, index: () => <Text>Home screen</Text> };

  it.each(['/sign-in', '/sign-up'])('lets a visitor continue browsing from %s', async (url) => {
    await renderRouter(withHome, { initialUrl: url });
    await fireEvent.press(screen.getByText('Continue browsing'));
    await waitFor(() => expect(screen.getByText('Home screen')).toBeTruthy());
  });
});

describe('sign up', () => {
  it('creates the account and asks the user to check their email', async () => {
    await renderRouter(routes, { initialUrl: '/sign-up' });
    await fillSignUp();
    await fireEvent.press(screen.getByRole('button', { name: 'Sign up' }));

    await waitFor(() => expect(screen.getByText(/Check your email/)).toBeTruthy());
    expect(supabase.auth.signUp).toHaveBeenCalledWith({
      email: 'a@example.com',
      password: 'password1',
      options: { data: { terms_accepted: true, age_confirmed: true } },
    });
  });

  it('shows field errors and does not submit for a bad email and a short password', async () => {
    await renderRouter(routes, { initialUrl: '/sign-up' });
    await fillSignUp({ email: 'nope', password: '123' });
    await fireEvent.press(screen.getByRole('button', { name: 'Sign up' }));

    expect(screen.getByText('Enter a valid email address')).toBeTruthy();
    expect(screen.getByText(/at least 8 characters/)).toBeTruthy();
    expect(supabase.auth.signUp).not.toHaveBeenCalled();
  });

  it('blocks sign up and flags a missing terms confirmation', async () => {
    await renderRouter(routes, { initialUrl: '/sign-up' });
    await fillSignUp({ terms: false });
    await fireEvent.press(screen.getByRole('button', { name: 'Sign up' }));

    expect(screen.getByText('You need to accept the terms')).toBeTruthy();
    expect(screen.queryByText(/confirm you are 18/)).toBeNull();
    expect(supabase.auth.signUp).not.toHaveBeenCalled();
  });

  it('blocks sign up and flags a missing age confirmation', async () => {
    await renderRouter(routes, { initialUrl: '/sign-up' });
    await fillSignUp({ age: false });
    await fireEvent.press(screen.getByRole('button', { name: 'Sign up' }));

    expect(screen.getByText(/confirm you are 18/)).toBeTruthy();
    expect(supabase.auth.signUp).not.toHaveBeenCalled();
  });

  it('shows an error when the email is already registered', async () => {
    (supabase.auth.signUp as jest.Mock).mockResolvedValueOnce({
      data: { user: { identities: [] }, session: null },
      error: null,
    });
    await renderRouter(routes, { initialUrl: '/sign-up' });
    await fillSignUp();
    await fireEvent.press(screen.getByRole('button', { name: 'Sign up' }));

    await waitFor(() => expect(screen.getByText(/already exists/)).toBeTruthy());
    expect(screen.queryByText(/Check your email/)).toBeNull();
  });

  it('shows the server error if sign up fails', async () => {
    (supabase.auth.signUp as jest.Mock).mockResolvedValueOnce({
      data: { user: null, session: null },
      error: { message: 'Database error saving new user' },
    });
    await renderRouter(routes, { initialUrl: '/sign-up' });
    await fillSignUp();
    await fireEvent.press(screen.getByRole('button', { name: 'Sign up' }));

    await waitFor(() => expect(screen.getByText('Database error saving new user')).toBeTruthy());
  });
});

describe('sign in', () => {
  async function submit(email = ' a@example.com ', password = 'secret') {
    await fireEvent.changeText(screen.getByLabelText('Email'), email);
    await fireEvent.changeText(screen.getByLabelText('Password'), password);
    await fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));
  }

  it('signs in with a trimmed email and shows no error', async () => {
    await renderRouter(routes, { initialUrl: '/sign-in' });
    await submit();

    await waitFor(() =>
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'a@example.com',
        password: 'secret',
      }),
    );
    expect(screen.queryByText('Invalid email or password')).toBeNull();
  });

  it('shows one generic error for wrong credentials', async () => {
    (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValueOnce({
      data: {},
      error: { code: 'invalid_credentials', message: 'Invalid login credentials' },
    });
    await renderRouter(routes, { initialUrl: '/sign-in' });
    await submit();

    await waitFor(() => expect(screen.getByText('Invalid email or password')).toBeTruthy());
  });

  it('asks an unverified user to verify their email', async () => {
    (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValueOnce({
      data: {},
      error: { code: 'email_not_confirmed', message: 'Email not confirmed' },
    });
    await renderRouter(routes, { initialUrl: '/sign-in' });
    await submit();

    await waitFor(() => expect(screen.getByText(/verify your email first/)).toBeTruthy());
  });

  it('links to sign up', async () => {
    await renderRouter(routes, { initialUrl: '/sign-in' });
    await fireEvent.press(screen.getByText('New here? Create an account'));
    await waitFor(() => expect(screen.getByText('Create account')).toBeTruthy());
  });
});
