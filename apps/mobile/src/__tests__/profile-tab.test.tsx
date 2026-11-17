import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import ProfileScreen from '@/app/(tabs)/profile';
import { QueryTestProvider } from '@padel/query/testing';
import { SessionProvider } from '@padel/auth';
import { fakeSession, mockState, resetMockSupabase } from '@padel/supabase/testing';

jest.mock('@padel/supabase', () => jest.requireActual('@padel/supabase/testing'));

beforeEach(() => {
  resetMockSupabase();
  jest.clearAllMocks();
  mockState.session = fakeSession();
});

const withSession = (ui: React.ReactElement) => <QueryTestProvider><SessionProvider>{ui}</SessionProvider></QueryTestProvider>;

async function pressSave(name = 'Save profile') {
  await fireEvent.press(screen.getByRole('button', { name }));
}

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
