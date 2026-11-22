import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import type { Profile } from '../src/domain/profile';
import { ProfileForm } from '../src/presentation/components/profile-form';
import { QueryTestProvider } from '@padel/query/testing';
import { SessionProvider } from '@padel/auth';
import { fakeSession, mockState, resetMockSupabase } from '@padel/supabase/testing';

jest.mock('@padel/supabase', () => jest.requireActual('@padel/supabase/testing'));

const STORED = '2026-03-01T10:00:00.000Z';

beforeEach(() => {
  resetMockSupabase();
  mockState.session = fakeSession();
  mockState.destinations = [];
});

const renderForm = (props: Partial<React.ComponentProps<typeof ProfileForm>> = {}) =>
  render(
    <QueryTestProvider>
      <SessionProvider>
        <ProfileForm submitLabel="Save" {...props} />
      </SessionProvider>
    </QueryTestProvider>,
  );

const partial: Profile = {
  displayName: '',
  homeCity: 'Bristol',
  bio: 'Padel fan',
  skillTier: null,
  homeDestinationId: 'marbella',
  discoverableAt: STORED,
};

describe('ProfileForm field set', () => {
  it('shows only name, skill level and city in setup', async () => {
    await renderForm({ fields: 'setup' });
    expect(screen.getByLabelText('Display name')).toBeTruthy();
    expect(screen.getByLabelText('Home city')).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'Beginner' })).toBeTruthy();
    expect(screen.queryByLabelText('Bio')).toBeNull();
    expect(screen.queryByText('Home destination')).toBeNull();
    expect(screen.queryByRole('checkbox', { name: 'Show me in Find players' })).toBeNull();
  });

  it('shows every field by default and when asked for the full set', async () => {
    await renderForm();
    expect(screen.getByLabelText('Bio')).toBeTruthy();
    expect(screen.getByRole('checkbox', { name: 'Show me in Find players' })).toBeTruthy();
    expect(screen.getByText('Home destination')).toBeTruthy();
    await screen.unmount();

    await renderForm({ fields: 'full' });
    expect(screen.getByLabelText('Bio')).toBeTruthy();
  });

  it('saves a new member with the hidden fields at their defaults, Find players off', async () => {
    await renderForm({ fields: 'setup' });
    await fireEvent.changeText(screen.getByLabelText('Display name'), 'Leon');
    await fireEvent.press(screen.getByRole('radio', { name: 'Beginner' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(mockState.upserts).toHaveLength(2));
    expect(mockState.upserts[0]!.values).toMatchObject({ bio: '', home_destination_id: null, discoverable_at: null });
  });

  it('keeps the bio, home destination and Find players setting a partial profile already has', async () => {
    mockState.profile = { id: 'user-1', discoverable_at: STORED, profile_sports: [] };
    await renderForm({ fields: 'setup', initial: partial });
    await fireEvent.changeText(screen.getByLabelText('Display name'), 'Leon');
    await fireEvent.press(screen.getByRole('radio', { name: 'Advanced' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(mockState.upserts).toHaveLength(2));
    expect(mockState.upserts[0]!.values).toMatchObject({
      bio: 'Padel fan',
      home_city: 'Bristol',
      home_destination_id: 'marbella',
      discoverable_at: STORED,
    });
  });
});

describe('ProfileForm suggested name', () => {
  it('prefills the name as an editable value and saves nothing until the member saves', async () => {
    await renderForm({ fields: 'setup', suggestedName: 'Alex Morgan' });
    expect(screen.getByDisplayValue('Alex Morgan')).toBeTruthy();
    expect(mockState.upserts).toHaveLength(0);

    await fireEvent.changeText(screen.getByLabelText('Display name'), 'Alex M');
    await fireEvent.press(screen.getByRole('radio', { name: 'Beginner' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(mockState.upserts).toHaveLength(2));
    expect(mockState.upserts[0]!.values.display_name).toBe('Alex M');
  });

  it('saves the suggestion as it stands when the member accepts it', async () => {
    await renderForm({ fields: 'setup', suggestedName: 'Alex Morgan' });
    await fireEvent.press(screen.getByRole('radio', { name: 'Beginner' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(mockState.upserts).toHaveLength(2));
    expect(mockState.upserts[0]!.values.display_name).toBe('Alex Morgan');
  });

  it('leaves the name to the member when the profile already has one', async () => {
    await renderForm({ fields: 'setup', suggestedName: 'Alex Morgan', initial: { ...partial, displayName: 'Leon' } });
    expect(screen.getByDisplayValue('Leon')).toBeTruthy();
    expect(screen.queryByDisplayValue('Alex Morgan')).toBeNull();
  });

  it('starts empty without a suggestion, whatever the account email is', async () => {
    mockState.session = fakeSession('user-1');
    await renderForm({ fields: 'setup' });
    expect(screen.getByLabelText('Display name').props.value).toBe('');
  });
});
