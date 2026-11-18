import { toIsoDate } from '@padel/core';
import { SignInScreen, SignUpScreen } from '@padel/auth';
import { createQueryClient } from '@padel/query';
import { QueryTestProvider } from '@padel/query/testing';
import { fakeSession, mockState, resetMockSupabase } from '@padel/supabase/testing';
import { Stack } from 'expo-router';
import { act, fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import { Text } from 'react-native';

import DiscoverScreen from '@/app/(tabs)/discover';
import { AppShell } from '@/components/app-shell';

jest.mock('@padel/supabase', () => jest.requireActual('@padel/supabase/testing'));

const day = (offset: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return toIsoDate(d);
};

const destination = (id: string, name: string, country: string) => ({ id, name, country, tagline: '', open_listings: 0 });

const overviewRow = (id: string, destinationName: string, country: string, from: number, to: number, overlap: number) => ({
  trip_id: id,
  destination_id: destinationName.toLowerCase(),
  destination_name: destinationName,
  destination_country: country,
  start_date: day(from),
  end_date: day(to),
  visibility: 'hidden',
  days: to - from + 1,
  overlap_players: overlap,
});

const overlapRow = (name: string, tier: string, from: number, to: number, days: number) => ({
  player_id: `p-${name}`,
  display_name: name,
  destination_id: 'málaga',
  destination_name: 'Málaga',
  skill_tier: tier,
  trip_start: day(from),
  trip_end: day(to),
  overlap_days: days,
  total_count: 3,
});

const listing = (id: string, destinationName: string, from: number, poster: string) => ({
  id,
  destination_id: destinationName.toLowerCase(),
  destination_name: destinationName,
  destination_country: 'Spain',
  start_date: day(from),
  end_date: null,
  start_time: null,
  venue: null,
  level_wanted: 'Any',
  players_needed: 2,
  description: '',
  poster_name: poster,
  poster_skill_tier: 'Intermediate',
});

const completeProfile = (id: string) => ({
  id,
  display_name: 'Leon',
  home_city: null,
  bio: '',
  profile_sports: [{ skill_tier: 'Intermediate' }],
});

let client = createQueryClient({ gcTime: Infinity });

const routes = {
  _layout: {
    default: () => (
      <QueryTestProvider client={client}>
        <AppShell />
      </QueryTestProvider>
    ),
    unstable_settings: { anchor: '(tabs)' },
  },
  '(tabs)/_layout': () => <Stack screenOptions={{ headerShown: false }} />,
  '(tabs)/index': () => null,
  '(tabs)/discover': DiscoverScreen,
  '(tabs)/profile': () => <Text>Profile screen</Text>,
  '(auth)/_layout': () => <Stack screenOptions={{ headerShown: false }} />,
  '(auth)/sign-in': SignInScreen,
  '(auth)/sign-up': SignUpScreen,
};

const rpcNames = () => mockState.rpcCalls.map((call) => call.name);
const lastOverlapCall = () => [...mockState.rpcCalls].reverse().find((call) => call.name === 'find_overlapping_players');

beforeEach(() => {
  resetMockSupabase();
  jest.clearAllMocks();
  client = createQueryClient({ gcTime: Infinity });
  mockState.destinations = [destination('málaga', 'Málaga', 'Spain'), destination('lisbon', 'Lisbon', 'Portugal')];
  mockState.listings = [];
  mockState.players = [];
  mockState.session = fakeSession('u1');
  mockState.profile = completeProfile('u1');
  mockState.tripsOverview = [
    overviewRow('t1', 'Málaga', 'Spain', 7, 14, 3),
    overviewRow('t2', 'Lisbon', 'Portugal', 30, 36, 0),
  ];
  mockState.overlapPlayers = [
    overlapRow('Jordi M.', 'Advanced', 7, 14, 8),
    overlapRow('Hannah K.', 'Intermediate', 10, 16, 5),
    overlapRow('Diego R.', 'Beginner', 9, 12, 4),
  ];
});

const openDiscover = async () => {
  await renderRouter(routes, { initialUrl: '/discover' });
  await waitFor(() => expect(screen.getByRole('tab', { name: /^My trips/ })).toBeTruthy());
};

describe('modes', () => {
  it('opens a member with an upcoming trip on My trips', async () => {
    await openDiscover();
    await waitFor(() => expect(screen.getByRole('tab', { name: /^My trips/, selected: true })).toBeTruthy());
    expect(screen.getByText('Players for your trips')).toBeTruthy();
    expect(screen.getByText('Choose one of your saved trips to see who overlaps.')).toBeTruthy();
    expect(screen.getByRole('header', { name: 'Players in Málaga' })).toBeTruthy();
    await waitFor(() => expect(screen.getByText('3 players overlap')).toBeTruthy());
  });

  it('opens a member without trips on Explore places, and still offers My trips', async () => {
    mockState.tripsOverview = [];
    await openDiscover();
    await waitFor(() => expect(screen.getByRole('tab', { name: /^Explore places/, selected: true })).toBeTruthy());
    expect(screen.getByRole('tab', { name: /^My trips/, selected: false })).toBeTruthy();
    expect(screen.getByText('Find your kind of game.')).toBeTruthy();
  });

  it('shows a guest no switch and asks for no trip data', async () => {
    mockState.session = null;
    await renderRouter(routes, { initialUrl: '/discover' });
    await waitFor(() => expect(screen.getByText('Find your next game.')).toBeTruthy());
    expect(screen.queryByRole('tab', { name: /^My trips/ })).toBeNull();
    expect(screen.queryByRole('tab', { name: /^Explore places/ })).toBeNull();
    expect(rpcNames()).not.toContain('my_trips_overview');
    expect(rpcNames()).not.toContain('find_overlapping_players');
  });

  it('goes back to the defaults when the user signs out', async () => {
    await openDiscover();
    await fireEvent.press(screen.getByRole('tab', { name: /^Explore places/ }));
    await waitFor(() => expect(screen.getByRole('tab', { name: /^Explore places/, selected: true })).toBeTruthy());

    await act(async () => {
      mockState.session = null;
      mockState.listeners.forEach((listener) => listener('SIGNED_OUT', null));
    });
    await waitFor(() => expect(screen.queryByRole('tab', { name: /^My trips/ })).toBeNull());
    expect(screen.getByText('Find your next game.')).toBeTruthy();
  });

  it('puts the Explore places wording back for a member', async () => {
    mockState.tripsOverview = [];
    await openDiscover();
    await waitFor(() => expect(screen.getByRole('tab', { name: /^Explore places/, selected: true })).toBeTruthy());
    expect(screen.getByText('Explore public players')).toBeTruthy();
    expect(screen.getByText('Explore near')).toBeTruthy();
  });
});

describe('the saved trips row', () => {
  it('shows each upcoming trip with its length and overlap count, the first selected', async () => {
    await openDiscover();
    await waitFor(() => expect(screen.getByRole('button', { name: /^Málaga, .*8 days · 3 players overlap, selected$/ })).toBeTruthy());
    expect(screen.getByRole('button', { name: /^Lisbon, .*7 days · No overlaps yet, not selected$/ })).toBeTruthy();
  });

  it('selects another trip and asks for that trip', async () => {
    mockState.overlapPlayers = [];
    await openDiscover();
    await waitFor(() => expect(lastOverlapCall()?.args.p_trip_id).toBe('t1'));

    await fireEvent.press(screen.getByRole('button', { name: /^Lisbon, / }));
    await waitFor(() => expect(lastOverlapCall()?.args.p_trip_id).toBe('t2'));
    expect(screen.getByRole('button', { name: /^Lisbon, .*selected$/ })).toBeTruthy();
    expect(screen.getByRole('header', { name: 'Players in Lisbon' })).toBeTruthy();
    expect(screen.getByText(/Showing matches for Lisbon,/)).toBeTruthy();
  });

  it('selects the trip that is under way today', async () => {
    mockState.tripsOverview = [overviewRow('later', 'Lisbon', 'Portugal', 2, 9, 0), overviewRow('now', 'Málaga', 'Spain', -2, 3, 1)];
    // The overview is sorted soonest first, as the database returns it.
    mockState.tripsOverview = [mockState.tripsOverview[1], mockState.tripsOverview[0]];
    await openDiscover();
    await waitFor(() => expect(lastOverlapCall()?.args.p_trip_id).toBe('now'));
  });

  it('shows no trips message with a way to add one', async () => {
    mockState.tripsOverview = [];
    await openDiscover();
    await fireEvent.press(screen.getByRole('tab', { name: /^My trips/ }));
    await waitFor(() => expect(screen.getByText('You have no upcoming trips yet.')).toBeTruthy());
    expect(screen.queryByRole('tab', { name: /^Players/ })).toBeNull();

    await fireEvent.press(screen.getByRole('button', { name: 'Add a trip' }));
    await waitFor(() => expect(screen.getByText('Profile screen')).toBeTruthy());
  });
});

describe('players who overlap', () => {
  it('shows the other players\' dates, overlapping days and level', async () => {
    await openDiscover();
    await waitFor(() => expect(screen.getByText('Jordi M.')).toBeTruthy());
    expect(screen.getByText('All 8 days overlap · Advanced')).toBeTruthy();
    expect(screen.getByText('5 days overlap · Intermediate')).toBeTruthy();
    expect(screen.getByText('4 days overlap · Beginner')).toBeTruthy();
    expect(screen.getAllByRole('button', { name: 'Connect' })).toHaveLength(3);
  });

  it('says that play times are not confirmed', async () => {
    await openDiscover();
    await waitFor(() => expect(screen.getByText(/Showing matches for Málaga, .*Play times aren't confirmed yet\./)).toBeTruthy());
  });

  it('sends This week and My level to the server, and combines them', async () => {
    await openDiscover();
    await waitFor(() => expect(screen.getByText('Jordi M.')).toBeTruthy());
    expect(lastOverlapCall()?.args).toMatchObject({ p_this_week: false, p_my_level: false });

    await fireEvent.press(screen.getByRole('button', { name: 'This week' }));
    await waitFor(() => expect(lastOverlapCall()?.args).toMatchObject({ p_this_week: true, p_my_level: false }));

    await fireEvent.press(screen.getByRole('button', { name: 'My level' }));
    await waitFor(() => expect(lastOverlapCall()?.args).toMatchObject({ p_this_week: true, p_my_level: true }));
  });

  it('searches the overlapping players by name', async () => {
    await openDiscover();
    await waitFor(() => expect(screen.getByText('Jordi M.')).toBeTruthy());
    expect(screen.getByPlaceholderText('Search players')).toBeTruthy();

    await fireEvent.changeText(screen.getByLabelText('Search'), 'hann');
    await waitFor(() => expect(lastOverlapCall()?.args.p_query).toBe('hann'));
  });

  it('shows an empty state that explains why', async () => {
    mockState.overlapPlayers = [];
    await openDiscover();
    await waitFor(() => expect(screen.getByText(/Players appear here when they share a trip/)).toBeTruthy());
  });

  it('shows an error with a retry and keeps the saved trips visible', async () => {
    mockState.overlapPlayersError = { message: 'down' };
    await openDiscover();
    await waitFor(() => expect(screen.getByText('Could not load players')).toBeTruthy());
    expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy();
    expect(screen.getByRole('button', { name: /^Málaga, / })).toBeTruthy();
  });

  it('opens the "To be developed" sheet when a member taps Connect', async () => {
    await openDiscover();
    await waitFor(() => expect(screen.getByText('Jordi M.')).toBeTruthy());
    await fireEvent.press(screen.getAllByRole('button', { name: 'Connect' })[0]!);
    await waitFor(() => expect(screen.getByText('To be developed')).toBeTruthy());
  });
});

describe('open matches for the trip', () => {
  beforeEach(() => {
    mockState.listings = [
      listing('during', 'Málaga', 9, 'Ann'), // inside the Málaga trip
      listing('after', 'Málaga', 20, 'Ben'), // Málaga but after the trip
      listing('elsewhere', 'Lisbon', 9, 'Cat'), // during the dates but another destination
    ];
  });

  it('shows only matches at the destination during the trip, with the count on the switch', async () => {
    await openDiscover();
    await waitFor(() => expect(screen.getByRole('tab', { name: 'Open matches, 1' })).toBeTruthy());
    await fireEvent.press(screen.getByRole('tab', { name: /^Open matches/ }));

    await waitFor(() => expect(screen.getByText(/Ann ·/)).toBeTruthy());
    expect(screen.queryByText(/Ben ·/)).toBeNull();
    expect(screen.queryByText(/Cat ·/)).toBeNull();
    expect(screen.queryByPlaceholderText('Search players')).toBeNull();
  });
});
