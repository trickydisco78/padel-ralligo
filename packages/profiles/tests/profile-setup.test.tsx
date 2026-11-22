import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { ProfileForm } from '../src/presentation/components/profile-form';
import { ProfileSetupScreen } from '../src/presentation/screens/profile-setup-screen';
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

async function renderSetup() {
  await render(withSession(<ProfileSetupScreen />));
  await screen.findByLabelText('Display name');
}

async function pressSave(name = 'Save and continue') {
  await fireEvent.press(screen.getByRole('button', { name }));
}

describe('profile setup', () => {
  it('requires a display name and a skill level, and saves nothing', async () => {
    await renderSetup();
    await pressSave();

    expect(screen.getByText(/Name must be 2 to 40 characters/)).toBeTruthy();
    expect(screen.getByText('Choose a skill level')).toBeTruthy();
    expect(mockState.upserts).toHaveLength(0);
  });

  it('rejects a 1-character name and a bio over 300 characters on the full form', async () => {
    await render(withSession(<ProfileForm submitLabel="Save" />));
    await fireEvent.changeText(screen.getByLabelText('Display name'), 'A');
    await fireEvent.changeText(screen.getByLabelText('Bio'), 'x'.repeat(301));
    await fireEvent.press(screen.getByRole('radio', { name: 'Beginner' }));
    await pressSave('Save');

    expect(screen.getByText(/Name must be 2 to 40 characters/)).toBeTruthy();
    expect(screen.getByText(/Bio must be 300 characters or fewer/)).toBeTruthy();
    expect(mockState.upserts).toHaveLength(0);
  });

  it('saves the profile and the padel skill tier for the signed-in user', async () => {
    await renderSetup();
    await fireEvent.changeText(screen.getByLabelText('Display name'), '  Leon  ');
    await fireEvent.changeText(screen.getByLabelText('Home city'), 'Bristol');
    await fireEvent.press(screen.getByRole('radio', { name: 'Advanced' }));
    await pressSave();

    await waitFor(() => expect(mockState.upserts).toHaveLength(2));
    expect(mockState.upserts[0]).toEqual({
      table: 'profiles',
      values: {
        id: 'user-1',
        display_name: 'Leon',
        home_city: 'Bristol',
        bio: '',
        home_destination_id: null,
        discoverable_at: null,
      },
    });
    expect(mockState.upserts[1]).toEqual({
      table: 'profile_sports',
      values: { profile_id: 'user-1', sport: 'padel', skill_tier: 'Advanced' },
    });
  });

  it('stores an empty home city as null', async () => {
    await renderSetup();
    await fireEvent.changeText(screen.getByLabelText('Display name'), 'Leon');
    await fireEvent.press(screen.getByRole('radio', { name: 'Beginner' }));
    await pressSave();

    await waitFor(() => expect(mockState.upserts).toHaveLength(2));
    expect(mockState.upserts[0]!.values.home_city).toBeNull();
  });

  it('shows an error and does not continue when saving fails', async () => {
    mockState.upsertError = { message: 'boom' };
    await renderSetup();
    await fireEvent.changeText(screen.getByLabelText('Display name'), 'Leon');
    await fireEvent.press(screen.getByRole('radio', { name: 'Beginner' }));
    await pressSave();

    await waitFor(() => expect(screen.getByText(/Could not save your profile/)).toBeTruthy());
  });
});

describe('profile form Cancel', () => {
  it('is not shown unless the caller can cancel, as on profile setup', async () => {
    await renderSetup();
    expect(screen.queryByRole('button', { name: 'Cancel' })).toBeNull();
  });

  it('calls onCancel without saving anything', async () => {
    const onCancel = jest.fn();
    await render(withSession(<ProfileForm submitLabel="Save profile" onCancel={onCancel} />));
    await fireEvent.changeText(screen.getByLabelText('Display name'), 'Changed');
    await fireEvent.press(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(mockState.upserts).toHaveLength(0);
  });
});

describe('profile setup fields', () => {
  it('asks only for name, skill level and city', async () => {
    await renderSetup();
    await screen.findByLabelText('Display name');
    expect(screen.getByLabelText('Home city')).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'Beginner' })).toBeTruthy();
    expect(screen.queryByLabelText('Bio')).toBeNull();
    expect(screen.queryByText('Home destination')).toBeNull();
    expect(screen.queryByRole('checkbox', { name: 'Show me in Find players' })).toBeNull();
  });

  it('starts from the profile the member already has and does not blank what it hides', async () => {
    mockState.profile = {
      id: 'user-1',
      display_name: 'Leon',
      home_city: 'Bristol',
      bio: 'Padel fan',
      home_destination_id: 'marbella',
      discoverable_at: '2026-03-01T10:00:00.000Z',
      profile_sports: [],
    };
    await renderSetup();
    expect(await screen.findByDisplayValue('Leon')).toBeTruthy();
    expect(screen.getByDisplayValue('Bristol')).toBeTruthy();
    await fireEvent.press(screen.getByRole('radio', { name: 'Advanced' }));
    await pressSave();

    await waitFor(() => expect(mockState.upserts).toHaveLength(2));
    expect(mockState.upserts[0]!.values).toMatchObject({
      bio: 'Padel fan',
      home_destination_id: 'marbella',
      discoverable_at: '2026-03-01T10:00:00.000Z',
    });
  });
});

describe('profile setup suggested name', () => {
  it('shows a suggestion from the sign-in provider for the member to confirm', async () => {
    await render(withSession(<ProfileSetupScreen suggestedName="Alex Morgan" />));
    expect(await screen.findByDisplayValue('Alex Morgan')).toBeTruthy();
    expect(mockState.upserts).toHaveLength(0);
  });
});
