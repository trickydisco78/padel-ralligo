import { toIsoDate } from '@repo/core';
import { Slot, useLocalSearchParams } from 'expo-router';
import { fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import { Text } from 'react-native';

import HomeScreen from '@/app/(tabs)/index';
import { SessionProvider } from '@/auth/session';
import { fakeSession, mockState, resetMockSupabase } from '@/test/mock-supabase';

jest.mock('@/lib/supabase', () => jest.requireActual('@/test/mock-supabase'));

function daysFromNow(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return toIsoDate(d);
}

const row = (n: number) => ({
  id: `l${n}`,
  destination_id: 'marbella',
  destination_name: 'Marbella',
  start_date: daysFromNow(n),
  end_date: null,
  start_time: null,
  venue: null,
  level_wanted: 'Any',
  players_needed: 2,
  description: '',
  poster_name: `Poster${n}`,
  poster_skill_tier: 'Intermediate',
});

const dest = (id: string, name: string, open_listings: number) => ({
  id,
  name,
  country: 'Spain',
  tagline: '',
  open_listings,
});

const Discover = () => {
  const { destinationId } = useLocalSearchParams();
  return <Text>{`Discover screen ${destinationId ?? 'all'}`}</Text>;
};

const open = () =>
  renderRouter(
    {
      _layout: () => (
        <SessionProvider>
          <Slot />
        </SessionProvider>
      ),
      index: HomeScreen,
      discover: Discover,
      '(auth)/sign-in': () => <Text>Sign-in screen</Text>,
      '(auth)/sign-up': () => <Text>Sign-up screen</Text>,
    },
    { initialUrl: '/' },
  );

beforeEach(() => {
  resetMockSupabase();
  mockState.destinations = [dest('marbella', 'Marbella', 3), dest('tenerife', 'Tenerife', 1)];
  mockState.listings = [1, 2, 3, 4, 5, 6, 7].map(row);
});

describe('Home', () => {
  it('shows a visitor the sign-in and create-account actions', async () => {
    await open();
    await waitFor(() => expect(screen.getByText('Find your next padel game')).toBeTruthy());
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeTruthy();
    expect(screen.getByText('Create an account')).toBeTruthy();
  });

  it('opens the sign-in screen from the visitor action', async () => {
    await open();
    await fireEvent.press(await screen.findByRole('button', { name: 'Sign in' }));
    await waitFor(() => expect(screen.getByText('Sign-in screen')).toBeTruthy());
  });

  it('hides the account actions from a signed-in user', async () => {
    mockState.session = fakeSession();
    mockState.profile = { id: 'user-1', profile_sports: [{ skill_tier: 'Beginner' }] };
    await open();
    await waitFor(() => expect(screen.getByText('Upcoming games')).toBeTruthy());
    await waitFor(() => expect(screen.getByRole('button', { name: 'Marbella, 3 open games' })).toBeTruthy());
    expect(screen.queryByText('Create an account')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Sign in' })).toBeNull();
  });

  it('shows each destination with its open-game count', async () => {
    await open();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Marbella, 3 open games' })).toBeTruthy());
    expect(screen.getByRole('button', { name: 'Tenerife, 1 open game' })).toBeTruthy();
  });

  it('opens Discover filtered to the chosen destination', async () => {
    await open();
    await fireEvent.press(await screen.findByRole('button', { name: 'Tenerife, 1 open game' }));
    await waitFor(() => expect(screen.getByText('Discover screen tenerife')).toBeTruthy());
  });

  it('shows only the first five games and a link to all of them', async () => {
    await open();
    await waitFor(() => expect(screen.getByText(/Poster1 ·/)).toBeTruthy());
    expect(screen.getByText(/Poster5 ·/)).toBeTruthy();
    expect(screen.queryByText(/Poster6 ·/)).toBeNull();

    await fireEvent.press(screen.getByRole('button', { name: 'See all games' }));
    await waitFor(() => expect(screen.getByText('Discover screen all')).toBeTruthy());
  });

  it('shows an empty message but keeps the destinations when there are no games', async () => {
    mockState.listings = [];
    await open();
    await waitFor(() => expect(screen.getByText(/No games yet/)).toBeTruthy());
    expect(screen.getByRole('button', { name: 'Marbella, 3 open games' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'See all games' })).toBeNull();
  });

  it('reports a games failure without hiding the destinations', async () => {
    mockState.listingsError = { message: 'down' };
    await open();
    await waitFor(() => expect(screen.getByText(/Could not load games/)).toBeTruthy());
    expect(screen.getByRole('button', { name: 'Marbella, 3 open games' })).toBeTruthy();
  });

  it('reports a destinations failure without hiding the games', async () => {
    mockState.destinationsError = { message: 'down' };
    await open();
    await waitFor(() => expect(screen.getByText(/Could not load destinations/)).toBeTruthy());
    expect(screen.getByText(/Poster1 ·/)).toBeTruthy();
  });
});
