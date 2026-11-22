import { Stack, router } from 'expo-router';
import { act, fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import { Text } from 'react-native';

import ProfileScreen from '@/app/(tabs)/profile';
import { QueryTestProvider } from '@padel/query/testing';
import { AuthIntentProvider, SessionProvider } from '@padel/auth';
import { fakeSession, mockState, resetMockSupabase } from '@padel/supabase/testing';

jest.mock('@padel/supabase', () => jest.requireActual('@padel/supabase/testing'));

const routes = {
  _layout: () => (
    <QueryTestProvider>
      <SessionProvider>
        <AuthIntentProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </AuthIntentProvider>
      </SessionProvider>
    </QueryTestProvider>
  ),
  index: ProfileScreen,
  discover: () => <Text>Other tab</Text>,
};

beforeEach(() => {
  resetMockSupabase();
  jest.clearAllMocks();
  mockState.destinations = [];
  mockState.session = fakeSession();
  mockState.profile = {
    id: 'user-1',
    display_name: 'Leon',
    home_city: 'Bristol',
    bio: 'Padel fan',
    profile_sports: [{ skill_tier: 'Intermediate' }],
  };
});

async function openProfile() {
  await renderRouter(routes, { initialUrl: '/' });
  await screen.findByRole('button', { name: 'Edit profile' });
}

async function startEditing() {
  await openProfile();
  await fireEvent.press(screen.getByRole('button', { name: 'Edit profile' }));
  await screen.findByDisplayValue('Leon');
}

describe('profile tab', () => {
  it('lands on the profile as text, with an Edit profile button and no form', async () => {
    await openProfile();
    expect(screen.getByRole('header', { name: 'Leon' })).toBeTruthy();
    expect(screen.getByText('Intermediate · Bristol')).toBeTruthy();
    expect(screen.getByText('Your level')).toBeTruthy();
    expect(screen.getByText('Padel fan')).toBeTruthy();
    expect(screen.queryByDisplayValue('Leon')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Save profile' })).toBeNull();
  });

  it('keeps trips, listings and sign out below the profile', async () => {
    await openProfile();
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeTruthy();
  });

  it('opens the form with the saved values and a Cancel button when Edit profile is chosen', async () => {
    await startEditing();
    expect(screen.getByDisplayValue('Bristol')).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'Intermediate' }).props.accessibilityState.checked).toBe(true);
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Edit profile' })).toBeNull();
  });

  it('returns to the saved profile on Cancel and saves nothing', async () => {
    await startEditing();
    await fireEvent.changeText(screen.getByDisplayValue('Leon'), 'Changed');
    await fireEvent.press(screen.getByRole('button', { name: 'Cancel' }));
    expect(await screen.findByRole('header', { name: 'Leon' })).toBeTruthy();
    expect(mockState.upserts).toHaveLength(0);
  });

  it('shows the new values after saving, with the replaced skill tier', async () => {
    await startEditing();
    await fireEvent.press(screen.getByRole('radio', { name: 'Advanced' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Save profile' }));

    await waitFor(() => expect(mockState.upserts).toHaveLength(2));
    expect(mockState.upserts[1]!.values).toMatchObject({ skill_tier: 'Advanced' });
    await waitFor(() => expect(screen.getByText('Advanced · Bristol')).toBeTruthy());
    expect(screen.queryByText('Intermediate · Bristol')).toBeNull();
    expect(screen.queryByDisplayValue('Leon')).toBeNull();
  });

  it('stays in the form with the entries and the error when saving fails', async () => {
    await startEditing();
    mockState.upsertError = { message: 'boom' };
    await fireEvent.changeText(screen.getByDisplayValue('Leon'), 'Leon S');
    await fireEvent.press(screen.getByRole('button', { name: 'Save profile' }));
    await waitFor(() => expect(screen.getByText('Could not save your profile. Please try again.')).toBeTruthy());
    expect(screen.getByDisplayValue('Leon S')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Edit profile' })).toBeNull();
  });

  it('comes back to the view, not a half-edited form, after leaving the tab', async () => {
    await startEditing();
    await act(async () => router.push('/discover'));
    await waitFor(() => expect(screen.getByText('Other tab')).toBeTruthy());
    await act(async () => router.back());
    expect(await screen.findByRole('button', { name: 'Edit profile' })).toBeTruthy();
    expect(screen.queryByDisplayValue('Leon')).toBeNull();
  });

  it('shows a visitor the sign-in prompt and no profile', async () => {
    mockState.session = null;
    await renderRouter(routes, { initialUrl: '/' });
    await waitFor(() => expect(screen.getByText('Your padel profile')).toBeTruthy());
    expect(screen.queryByRole('button', { name: 'Edit profile' })).toBeNull();
  });
});
