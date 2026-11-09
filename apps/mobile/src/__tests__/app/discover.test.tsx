import { toIsoDate } from '@repo/core';
import { Slot } from 'expo-router';
import { fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';

import DiscoverScreen from '@/app/(tabs)/discover';
import { SessionProvider } from '@/auth/session';
import { fakeSession, mockState, resetMockSupabase } from '@/test/mock-supabase';

jest.mock('@/lib/supabase', () => jest.requireActual('@/test/mock-supabase'));

function daysFromNow(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return toIsoDate(d);
}

const row = (id: string, overrides: Record<string, unknown> = {}) => ({
  id,
  destination_id: 'marbella',
  destination_name: 'Marbella',
  start_date: daysFromNow(3),
  end_date: null,
  start_time: null,
  venue: null,
  level_wanted: 'Any',
  players_needed: 2,
  description: '',
  poster_name: 'Ann',
  poster_skill_tier: 'Intermediate',
  ...overrides,
});

const dest = (id: string, name: string) => ({ id, name, country: 'Spain', tagline: '', open_listings: 0 });

beforeEach(() => {
  resetMockSupabase();
  mockState.session = fakeSession();
  mockState.profile = { id: 'user-1', profile_sports: [{ skill_tier: 'Beginner' }] };
  mockState.destinations = [dest('marbella', 'Marbella'), dest('tenerife', 'Tenerife')];
  mockState.listings = [
    row('1', { description: 'Friendly doubles', venue: 'Ace Padel Club', start_time: '20:00:00', level_wanted: 'Intermediate' }),
    row('2', { destination_id: 'tenerife', destination_name: 'Tenerife', poster_name: 'Ben', level_wanted: 'Beginner', start_date: daysFromNow(10), end_date: daysFromNow(14) }),
    row('3', { poster_name: 'Cat', level_wanted: 'Advanced', start_date: daysFromNow(5) }),
  ];
});

const open = (url = '/') =>
  renderRouter(
    {
      _layout: () => (
        <SessionProvider>
          <Slot />
        </SessionProvider>
      ),
      index: DiscoverScreen,
    },
    { initialUrl: url },
  );

const press = (name: string) => fireEvent.press(screen.getByRole('button', { name }));
const shown = (name: string) => screen.queryByText(new RegExp(name));

describe('Discover', () => {
  it('shows listings with destination, venue, time, level, spots, description and poster', async () => {
    await open();
    await waitFor(() => expect(screen.getByText('Friendly doubles')).toBeTruthy());

    expect(screen.getAllByText('Marbella').length).toBeGreaterThan(0);
    expect(screen.getByText(/at 20:00 · Ace Padel Club/)).toBeTruthy();
    expect(screen.getAllByText('2 spots needed').length).toBeGreaterThan(0);
    expect(screen.getByText('Ann · Intermediate')).toBeTruthy();
    expect(screen.getByText('Ben · Intermediate')).toBeTruthy();
  });

  it('keeps the order the data comes in, soonest first', async () => {
    mockState.listings = [row('a', { poster_name: 'First' }), row('b', { poster_name: 'Second' })];
    await open();
    await waitFor(() => expect(screen.getByText(/First/)).toBeTruthy());
    const posters = screen.getAllByText(/^(First|Second) ·/).map((n) => n.props.children.join(''));
    expect(posters[0]).toMatch(/First/);
  });

  it('filters by destination', async () => {
    await open();
    await waitFor(() => expect(screen.getByText(/Ben ·/)).toBeTruthy());

    await press('Tenerife');
    expect(screen.getByText(/Ben ·/)).toBeTruthy();
    expect(shown('Ann ·')).toBeNull();
    expect(shown('Cat ·')).toBeNull();
  });

  it('filters by level, keeping listings that want Any level', async () => {
    mockState.listings = [
      row('1', { poster_name: 'Anyone', level_wanted: 'Any' }),
      row('2', { poster_name: 'Midway', level_wanted: 'Intermediate' }),
      row('3', { poster_name: 'Newbie', level_wanted: 'Beginner' }),
    ];
    await open();
    await waitFor(() => expect(screen.getByText(/Newbie ·/)).toBeTruthy());

    await press('Intermediate');
    expect(screen.getByText(/Anyone ·/)).toBeTruthy();
    expect(screen.getByText(/Midway ·/)).toBeTruthy();
    expect(shown('Newbie ·')).toBeNull();
  });

  it('filters by date overlap', async () => {
    await open();
    await waitFor(() => expect(screen.getByText(/Ben ·/)).toBeTruthy());

    await fireEvent.changeText(screen.getByLabelText('From'), daysFromNow(12));
    await fireEvent.changeText(screen.getByLabelText('To'), daysFromNow(20));
    expect(screen.getByText(/Ben ·/)).toBeTruthy();
    expect(shown('Ann ·')).toBeNull();
  });

  it('shows an empty state and clears filters', async () => {
    await open();
    await waitFor(() => expect(screen.getByText(/Ben ·/)).toBeTruthy());

    await press('Tenerife');
    await press('Advanced');
    expect(screen.getByText('No games match your filters.')).toBeTruthy();

    await press('Clear filters');
    await waitFor(() => expect(screen.getByText(/Ann ·/)).toBeTruthy());
    expect(screen.getByText(/Ben ·/)).toBeTruthy();
    expect(screen.getByText(/Cat ·/)).toBeTruthy();
  });

  it('opens pre-filtered to the saved trip', async () => {
    mockState.trip = { destination_id: 'tenerife', start_date: daysFromNow(9), end_date: daysFromNow(15) };
    await open();

    await waitFor(() => expect(screen.getByText(/Ben ·/)).toBeTruthy());
    await waitFor(() => expect(shown('Ann ·')).toBeNull());
    expect(screen.getByRole('button', { name: 'Tenerife' }).props.accessibilityState.selected).toBe(true);
  });

  it('does not apply a trip whose end date has passed', async () => {
    mockState.trip = { destination_id: 'tenerife', start_date: daysFromNow(-9), end_date: daysFromNow(-2) };
    await open();

    await waitFor(() => expect(screen.getByText(/Ann ·/)).toBeTruthy());
    expect(screen.getByText(/Ben ·/)).toBeTruthy();
  });

  it('shows an error when listings cannot be loaded', async () => {
    mockState.listingsError = { message: 'down' };
    await open();
    await waitFor(() => expect(screen.getByText(/Could not load games/)).toBeTruthy());
  });

  it('opens filtered to the destination passed in the link', async () => {
    await open('/?destinationId=tenerife');

    await waitFor(() => expect(screen.getByText(/Ben ·/)).toBeTruthy());
    await waitFor(() => expect(shown('Ann ·')).toBeNull());
    expect(screen.getByRole('button', { name: 'Tenerife' }).props.accessibilityState.selected).toBe(true);
  });

  it('prefers the destination in the link over the saved trip', async () => {
    mockState.trip = { destination_id: 'tenerife', start_date: daysFromNow(9), end_date: daysFromNow(15) };
    await open('/?destinationId=marbella');

    await waitFor(() => expect(screen.getByText(/Ann ·/)).toBeTruthy());
    await waitFor(() => expect(shown('Ben ·')).toBeNull());
    expect(screen.getByRole('button', { name: 'Marbella' }).props.accessibilityState.selected).toBe(true);
  });

  it('shows all games when there is no destination link and no trip', async () => {
    await open();
    await waitFor(() => expect(screen.getByText(/Ann ·/)).toBeTruthy());
    expect(screen.getByText(/Ben ·/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'All destinations' }).props.accessibilityState.selected).toBe(true);
  });
});
