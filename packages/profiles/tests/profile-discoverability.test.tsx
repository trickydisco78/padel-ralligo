import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { ProfileForm } from '../src/presentation/components/profile-form';
import { createSupabaseProfileRepository } from '../src/infrastructure/supabase-profile.repository';
import { toProfile } from '../src/infrastructure/profile.mapper';
import { QueryTestProvider } from '@padel/query/testing';
import { SessionProvider } from '@padel/auth';
import { fakeSession, mockState, resetMockSupabase, supabase } from '@padel/supabase/testing';
import type { TypedSupabaseClient } from '@padel/supabase';

jest.mock('@padel/supabase', () => jest.requireActual('@padel/supabase/testing'));

const dest = (id: string, name: string) => ({ id, name, country: 'Spain', tagline: '', open_listings: 0 });
const STORED = '2026-03-01T10:00:00.000Z';
const baseInput = {
  displayName: 'Leon',
  homeCity: '',
  bio: '',
  skillTier: 'Advanced' as const,
  homeDestinationId: null,
  discoverable: false,
};
const repo = () => createSupabaseProfileRepository(supabase as unknown as TypedSupabaseClient);
const profileUpsert = () => mockState.upserts.find((u) => u.table === 'profiles')!.values;

beforeEach(() => {
  resetMockSupabase();
  mockState.session = fakeSession();
  mockState.destinations = [dest('m', 'Marbella'), dest('t', 'Tenerife')];
});

describe('profile mapper', () => {
  const row = { display_name: 'Leon', home_city: null, bio: '', profile_sports: [] };

  it('is not discoverable and has no home destination by default', () => {
    const profile = toProfile({ ...row, home_destination_id: null, discoverable_at: null });
    expect(profile.homeDestinationId).toBeNull();
    expect(profile.discoverableAt).toBeNull();
  });

  it('maps the stored values', () => {
    const profile = toProfile({ ...row, home_destination_id: 'm', discoverable_at: STORED });
    expect(profile.homeDestinationId).toBe('m');
    expect(profile.discoverableAt).toBe(STORED);
  });
});

describe('profile repository discoverability', () => {
  it('writes null when off and writes the home destination as given', async () => {
    await repo().save('user-1', { ...baseInput, homeDestinationId: 'm' });
    expect(profileUpsert()).toMatchObject({ home_destination_id: 'm', discoverable_at: null });
  });

  it('sets a timestamp when turned on from off', async () => {
    mockState.profile = { id: 'user-1', discoverable_at: null, profile_sports: [] };
    const before = Date.now();
    await repo().save('user-1', { ...baseInput, homeDestinationId: 'm', discoverable: true });
    const written = profileUpsert().discoverable_at as string;
    expect(Date.parse(written)).toBeGreaterThanOrEqual(before);
    expect(Date.parse(written)).toBeLessThanOrEqual(Date.now());
  });

  it('sets a timestamp when there is no profile yet', async () => {
    await repo().save('user-1', { ...baseInput, homeDestinationId: 'm', discoverable: true });
    expect(typeof profileUpsert().discoverable_at).toBe('string');
  });

  it('keeps the stored timestamp when resaved while on', async () => {
    mockState.profile = { id: 'user-1', discoverable_at: STORED, profile_sports: [] };
    await repo().save('user-1', { ...baseInput, homeDestinationId: 'm', discoverable: true });
    expect(profileUpsert().discoverable_at).toBe(STORED);
  });

  it('writes null when turned off', async () => {
    mockState.profile = { id: 'user-1', discoverable_at: STORED, profile_sports: [] };
    await repo().save('user-1', { ...baseInput, homeDestinationId: 'm', discoverable: false });
    expect(profileUpsert().discoverable_at).toBeNull();
  });
});

const renderForm = () =>
  render(
    <QueryTestProvider>
      <SessionProvider>
        <ProfileForm submitLabel="Save" />
      </SessionProvider>
    </QueryTestProvider>,
  );

describe('profile form discoverability', () => {
  it('shows the switch off by default with its explanation', async () => {
    await renderForm();
    expect(screen.getByRole('checkbox', { name: 'Show me in Find players' }).props.accessibilityState.checked).toBe(false);
    expect(
      screen.getByText(
        'Other people can see your first name and last initial, your home destination and your skill tier. You can turn this off at any time.',
      ),
    ).toBeTruthy();
    expect(screen.getByText('Home destination')).toBeTruthy();
  });

  it('saves with the switch off and no destination, writing a null timestamp', async () => {
    await renderForm();
    await fireEvent.changeText(screen.getByLabelText('Display name'), 'Leon');
    await fireEvent.press(screen.getByRole('radio', { name: 'Beginner' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(mockState.upserts).toHaveLength(2));
    expect(profileUpsert()).toMatchObject({ home_destination_id: null, discoverable_at: null });
  });

  it('asks for a home destination when turned on without one, and saves nothing', async () => {
    await renderForm();
    await fireEvent.changeText(screen.getByLabelText('Display name'), 'Leon');
    await fireEvent.press(screen.getByRole('radio', { name: 'Beginner' }));
    await fireEvent.press(screen.getByRole('checkbox', { name: 'Show me in Find players' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Save' }));

    expect(screen.getByText('Choose a home destination to be listed')).toBeTruthy();
    expect(mockState.upserts).toHaveLength(0);
  });

  it('saves once a home destination is chosen', async () => {
    await renderForm();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Marbella' })).toBeTruthy());
    await fireEvent.changeText(screen.getByLabelText('Display name'), 'Leon');
    await fireEvent.press(screen.getByRole('radio', { name: 'Beginner' }));
    await fireEvent.press(screen.getByRole('checkbox', { name: 'Show me in Find players' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Marbella' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(mockState.upserts).toHaveLength(2));
    const values = profileUpsert();
    expect(values.home_destination_id).toBe('m');
    expect(typeof values.discoverable_at).toBe('string');
  });

  it('reloads an existing profile with its saved values', async () => {
    const initial = toProfile({
      display_name: 'Leon',
      home_city: null,
      bio: '',
      home_destination_id: 't',
      discoverable_at: STORED,
      profile_sports: [{ skill_tier: 'Advanced' }],
    });
    await render(
      <QueryTestProvider>
        <SessionProvider>
          <ProfileForm initial={initial} submitLabel="Save" />
        </SessionProvider>
      </QueryTestProvider>,
    );
    expect(screen.getByRole('checkbox', { name: 'Show me in Find players' }).props.accessibilityState.checked).toBe(true);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Tenerife' })).toBeTruthy());
    expect(screen.getByRole('button', { name: 'Tenerife' }).props.accessibilityState.selected).toBe(true);
    expect(screen.getByRole('button', { name: 'Marbella' }).props.accessibilityState.selected).toBe(false);
  });
});
