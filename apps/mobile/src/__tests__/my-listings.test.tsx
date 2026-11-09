import { toIsoDate } from '@repo/core';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { SessionProvider } from '@/auth/session';
import { MyListings } from '@/components/my-listings';
import { fakeSession, mockState, resetMockSupabase } from '@/test/mock-supabase';

jest.mock('@/lib/supabase', () => jest.requireActual('@/test/mock-supabase'));

function daysFromNow(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return toIsoDate(d);
}

const dbRow = (id: string, overrides: Record<string, unknown> = {}) => ({
  id,
  destination_id: 'marbella',
  destinations: { name: 'Marbella' },
  start_date: daysFromNow(4),
  end_date: null,
  start_time: null,
  venue: null,
  level_wanted: 'Any',
  players_needed: 2,
  description: '',
  status: 'open',
  ...overrides,
});

beforeEach(() => {
  resetMockSupabase();
  mockState.session = fakeSession();
  mockState.profile = { id: 'user-1', profile_sports: [{ skill_tier: 'Beginner' }] };
  mockState.destinations = [
    { id: 'marbella', name: 'Marbella', country: 'Spain', tagline: '', open_listings: 1 },
  ];
});

const renderIt = () =>
  render(
    <SessionProvider>
      <MyListings />
    </SessionProvider>,
  );

describe('MyListings', () => {
  it('lists the user’s open and closed listings', async () => {
    mockState.myListings = [dbRow('1', { venue: 'Ace Padel Club' }), dbRow('2', { status: 'closed' })];
    await renderIt();

    await waitFor(() => expect(screen.getByText(/Ace Padel Club/)).toBeTruthy());
    expect(screen.getByText('Open')).toBeTruthy();
    expect(screen.getByText('Closed')).toBeTruthy();
    // Only the open listing can be edited or closed.
    expect(screen.getAllByRole('button', { name: /^Edit / })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: /^Close / })).toHaveLength(1);
  });

  it('says so when the user has no listings', async () => {
    await renderIt();
    await waitFor(() => expect(screen.getByText(/haven't posted any games/)).toBeTruthy());
  });

  it('closes a listing, which stays in the list marked closed', async () => {
    mockState.myListings = [dbRow('1')];
    await renderIt();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Close Marbella listing' })).toBeTruthy());

    await fireEvent.press(screen.getByRole('button', { name: 'Close Marbella listing' }));

    await waitFor(() => expect(screen.getByText('Closed')).toBeTruthy());
    expect(mockState.updates).toEqual([{ table: 'listings', values: { status: 'closed' }, id: '1' }]);
    expect(screen.queryByRole('button', { name: /^Edit / })).toBeNull();
  });

  it('edits a listing and shows the saved values', async () => {
    mockState.myListings = [dbRow('1', { venue: 'Old Club' })];
    await renderIt();
    await waitFor(() => expect(screen.getByText(/Old Club/)).toBeTruthy());

    await fireEvent.press(screen.getByRole('button', { name: 'Edit Marbella listing' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Save changes' })).toBeTruthy());
    expect(screen.getByDisplayValue('Old Club')).toBeTruthy();

    await fireEvent.changeText(screen.getByLabelText('Venue (optional)'), 'New Club');
    await fireEvent.press(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(screen.getByText(/New Club/)).toBeTruthy());
    expect(mockState.updates[0]).toMatchObject({
      table: 'listings',
      id: '1',
      values: { venue: 'New Club', players_needed: 2, level_wanted: 'Any' },
    });
    expect(screen.queryByRole('button', { name: 'Save changes' })).toBeNull();
  });

  it('rejects an edit with invalid values and does not save', async () => {
    mockState.myListings = [dbRow('1')];
    await renderIt();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Edit Marbella listing' })).toBeTruthy());

    await fireEvent.press(screen.getByRole('button', { name: 'Edit Marbella listing' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Save changes' })).toBeTruthy());
    await fireEvent.changeText(screen.getByLabelText('End date (optional)'), daysFromNow(1));
    await fireEvent.press(screen.getByRole('button', { name: 'Save changes' }));

    expect(screen.getByText("End date can't be before the start date")).toBeTruthy();
    expect(mockState.updates).toHaveLength(0);
  });

  it('lets an ongoing listing (start date already passed) be edited without changing the start date', async () => {
    mockState.myListings = [dbRow('1', { start_date: daysFromNow(-2), end_date: daysFromNow(3), venue: 'Club' })];
    await renderIt();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Edit Marbella listing' })).toBeTruthy());

    await fireEvent.press(screen.getByRole('button', { name: 'Edit Marbella listing' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Save changes' })).toBeTruthy());
    await fireEvent.changeText(screen.getByLabelText('Venue (optional)'), 'Other Club');
    await fireEvent.press(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(mockState.updates).toHaveLength(1));
  });
});
