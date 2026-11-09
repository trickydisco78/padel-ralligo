import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import ProfileScreen from '@/app/(tabs)/profile';
import ProfileSetupScreen from '@/app/profile-setup';
import { SessionProvider } from '@/auth/session';
import { fakeSession, mockState, resetMockSupabase } from '@/test/mock-supabase';

jest.mock('@/lib/supabase', () => jest.requireActual('@/test/mock-supabase'));

beforeEach(() => {
  resetMockSupabase();
  jest.clearAllMocks();
  mockState.session = fakeSession();
});

const withSession = (ui: React.ReactElement) => <SessionProvider>{ui}</SessionProvider>;

async function pressSave(name = 'Save and continue') {
  await fireEvent.press(screen.getByRole('button', { name }));
}

describe('profile setup', () => {
  it('requires a display name and a skill level, and saves nothing', async () => {
    await render(withSession(<ProfileSetupScreen />));
    await pressSave();

    expect(screen.getByText(/Name must be 2 to 40 characters/)).toBeTruthy();
    expect(screen.getByText('Choose a skill level')).toBeTruthy();
    expect(mockState.upserts).toHaveLength(0);
  });

  it('rejects a 1-character name and a bio over 300 characters', async () => {
    await render(withSession(<ProfileSetupScreen />));
    await fireEvent.changeText(screen.getByLabelText('Display name'), 'A');
    await fireEvent.changeText(screen.getByLabelText('Bio (optional)'), 'x'.repeat(301));
    await fireEvent.press(screen.getByRole('button', { name: 'Beginner' }));
    await pressSave();

    expect(screen.getByText(/Name must be 2 to 40 characters/)).toBeTruthy();
    expect(screen.getByText(/Bio must be 300 characters or fewer/)).toBeTruthy();
    expect(mockState.upserts).toHaveLength(0);
  });

  it('saves the profile and the padel skill tier for the signed-in user', async () => {
    await render(withSession(<ProfileSetupScreen />));
    await fireEvent.changeText(screen.getByLabelText('Display name'), '  Leon  ');
    await fireEvent.changeText(screen.getByLabelText('Home city (optional)'), 'Bristol');
    await fireEvent.press(screen.getByRole('button', { name: 'Advanced' }));
    await pressSave();

    await waitFor(() => expect(mockState.upserts).toHaveLength(2));
    expect(mockState.upserts[0]).toEqual({
      table: 'profiles',
      values: { id: 'user-1', display_name: 'Leon', home_city: 'Bristol', bio: '' },
    });
    expect(mockState.upserts[1]).toEqual({
      table: 'profile_sports',
      values: { profile_id: 'user-1', sport: 'padel', skill_tier: 'Advanced' },
    });
  });

  it('stores an empty home city as null', async () => {
    await render(withSession(<ProfileSetupScreen />));
    await fireEvent.changeText(screen.getByLabelText('Display name'), 'Leon');
    await fireEvent.press(screen.getByRole('button', { name: 'Beginner' }));
    await pressSave();

    await waitFor(() => expect(mockState.upserts).toHaveLength(2));
    expect(mockState.upserts[0]!.values.home_city).toBeNull();
  });

  it('shows an error and does not continue when saving fails', async () => {
    mockState.upsertError = { message: 'boom' };
    await render(withSession(<ProfileSetupScreen />));
    await fireEvent.changeText(screen.getByLabelText('Display name'), 'Leon');
    await fireEvent.press(screen.getByRole('button', { name: 'Beginner' }));
    await pressSave();

    await waitFor(() => expect(screen.getByText(/Could not save your profile/)).toBeTruthy());
  });
});

describe('profile tab', () => {
  beforeEach(() => {
    mockState.profile = {
      id: 'user-1',
      display_name: 'Leon',
      home_city: 'Bristol',
      bio: 'Padel fan',
      profile_sports: [{ skill_tier: 'Intermediate' }],
    };
  });

  it('shows the saved profile with the current tier selected', async () => {
    await render(withSession(<ProfileScreen />));

    await waitFor(() => expect(screen.getByDisplayValue('Leon')).toBeTruthy());
    expect(screen.getByDisplayValue('Bristol')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Intermediate' }).props.accessibilityState.selected).toBe(true);
  });

  it('replaces the skill tier when a different one is saved', async () => {
    await render(withSession(<ProfileScreen />));
    await waitFor(() => expect(screen.getByDisplayValue('Leon')).toBeTruthy());

    await fireEvent.press(screen.getByRole('button', { name: 'Advanced' }));
    await pressSave('Save profile');

    await waitFor(() => expect(mockState.upserts).toHaveLength(2));
    expect(mockState.upserts[1]!.values).toMatchObject({ skill_tier: 'Advanced' });
    await waitFor(() => expect(screen.getByText('Profile saved')).toBeTruthy());
    expect(screen.getByRole('button', { name: 'Advanced' }).props.accessibilityState.selected).toBe(true);
  });
});
