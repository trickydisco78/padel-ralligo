import { SignInScreen, SignUpScreen } from '@padel/auth';
import { ProfileSetupScreen } from '@padel/profiles';
import { createQueryClient } from '@padel/query';
import { QueryTestProvider } from '@padel/query/testing';
import { fakeSession, mockState, resetMockSupabase, supabase } from '@padel/supabase/testing';
import { Stack } from 'expo-router';
import { act, fireEvent, renderRouter, screen, waitFor, within } from 'expo-router/testing-library';

import DiscoverScreen from '@/app/(tabs)/discover';
import { AppShell } from '@/components/app-shell';

jest.mock('@padel/supabase', () => jest.requireActual('@padel/supabase/testing'));

const destination = (id: string, name: string, country: string) => ({ id, name, country, tagline: '', open_listings: 0 });

const player = (name: string, destinationName: string, tier: string, total = 2, id: string | null = null) => ({
  player_id: id,
  display_name: name,
  destination_id: destinationName.toLowerCase(),
  destination_name: destinationName,
  skill_tier: tier,
  total_count: total,
});

const matchRow = {
  id: 'm1',
  destination_id: 'malaga',
  destination_name: 'Málaga',
  destination_country: 'Spain',
  start_date: '2099-02-20',
  end_date: null,
  start_time: null,
  venue: null,
  level_wanted: 'Any',
  players_needed: 2,
  description: '',
  poster_name: 'Leon',
  poster_skill_tier: 'Advanced',
};

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
  '(auth)/_layout': () => <Stack screenOptions={{ headerShown: false }} />,
  '(auth)/sign-in': SignInScreen,
  '(auth)/sign-up': SignUpScreen,
  'profile-setup': ProfileSetupScreen,
};

beforeEach(() => {
  resetMockSupabase();
  jest.clearAllMocks();
  client = createQueryClient({ gcTime: Infinity });
  mockState.destinations = [destination('malaga', 'Málaga', 'Spain'), destination('lisbon', 'Lisbon', 'Portugal')];
  mockState.listings = [matchRow];
  mockState.players = [player('Jordi M.', 'Málaga', 'Advanced'), player('Lucía C.', 'Lisbon', 'Intermediate')];
});

const openDiscover = async (url = '/discover') => {
  await renderRouter(routes, { initialUrl: url });
  await waitFor(() => expect(screen.getByRole('tab', { name: /^Open matches/ })).toBeTruthy());
};
const openPlayers = async () => {
  await openDiscover();
  await fireEvent.press(screen.getByRole('tab', { name: /^Players/ }));
  await waitFor(() => expect(screen.getByText('Jordi M.')).toBeTruthy());
};

describe('Players | Open matches switch', () => {
  it('keeps the match list by default and shows a count on each side', async () => {
    await openDiscover();
    await waitFor(() => expect(screen.getByRole('tab', { name: 'Open matches, 1', selected: true })).toBeTruthy());
    expect(screen.getByRole('tab', { name: 'Players, 2', selected: false })).toBeTruthy();
    expect(screen.getByText('Leon · Advanced')).toBeTruthy();
    expect(screen.queryByText('Jordi M.')).toBeNull();
  });

  it('shows the players when Players is chosen, and the matches again when switched back', async () => {
    await openPlayers();
    expect(screen.getByRole('tab', { name: 'Players, 2', selected: true })).toBeTruthy();
    expect(screen.getByText('Browse player cards by location. No trip required.')).toBeTruthy();
    expect(screen.queryByText('Leon · Advanced')).toBeNull();

    await fireEvent.press(screen.getByRole('tab', { name: /^Open matches/ }));
    await waitFor(() => expect(screen.getByText('Leon · Advanced')).toBeTruthy());
    expect(screen.queryByText('Jordi M.')).toBeNull();
  });

  it('opens on Players when the link asks for it', async () => {
    await renderRouter(routes, { initialUrl: '/discover?view=players' });
    await waitFor(() => expect(screen.getByText('Jordi M.')).toBeTruthy());
    expect(screen.getByRole('tab', { name: /^Players/, selected: true })).toBeTruthy();
  });

  it('uses the design wording for a guest and a search hint that matches what is searched', async () => {
    await openPlayers();
    expect(screen.getByText('Find your next game.')).toBeTruthy();
    expect(screen.getByText('Browse player cards by location. No trip required.')).toBeTruthy();
    expect(screen.getByText('Public profile only: area and level. Trip dates stay private.')).toBeTruthy();
    expect(screen.getByText('Explore near')).toBeTruthy();
    expect(screen.getByText('Public players')).toBeTruthy();
    expect(screen.getByPlaceholderText('Search a city')).toBeTruthy();
    await fireEvent.press(screen.getByRole('tab', { name: /^Open matches/ }));
    expect(screen.getByPlaceholderText('City, destination or venue')).toBeTruthy();
  });

  it('hides the date filters, which only apply to matches', async () => {
    await openPlayers();
    expect(screen.queryByLabelText('From')).toBeNull();
    expect(screen.queryByLabelText('To')).toBeNull();
  });
});

describe('player cards', () => {
  it('show only the name, destination, sport, level and Sign in to a guest, and no profile opens', async () => {
    await openPlayers();
    expect(screen.getByText('Málaga · Padel · Advanced')).toBeTruthy();
    expect(screen.getByText('Lisbon · Padel · Intermediate')).toBeTruthy();
    expect(screen.getAllByRole('button', { name: 'Sign in' })).toHaveLength(2);
    expect(screen.queryByRole('button', { name: 'Connect' })).toBeNull();

    await fireEvent.press(screen.getByText('Jordi M.'));
    expect(screen.getByRole('tab', { name: /^Players/, selected: true })).toBeTruthy();
    expect(mockState.rpcCalls.every((call) => call.name === 'search_players')).toBe(true);
  });

  it('are found by destination text and never by name', async () => {
    await openPlayers();
    mockState.rpcCalls.length = 0;
    await fireEvent.changeText(screen.getByLabelText('Search'), 'lisb');
    await waitFor(() => expect(mockState.rpcCalls.some((call) => call.args.p_query === 'lisb')).toBe(true));
  });
});

describe('filters shared between the two views', () => {
  it('keeps the chosen destination when switching views and sends it with the player request', async () => {
    await openPlayers();
    mockState.rpcCalls.length = 0;
    await fireEvent.press(screen.getByRole('button', { name: 'Lisbon' }));
    await waitFor(() => expect(mockState.rpcCalls.some((call) => call.args.p_destination_id === 'lisbon')).toBe(true));

    await fireEvent.press(screen.getByRole('tab', { name: /^Open matches/ }));
    expect(screen.getByRole('button', { name: 'Lisbon', selected: true })).toBeTruthy();
    await fireEvent.press(screen.getByRole('tab', { name: /^Players/ }));
    expect(screen.getByRole('button', { name: 'Lisbon', selected: true })).toBeTruthy();
  });

  it('sends the chosen level', async () => {
    await openPlayers();
    mockState.rpcCalls.length = 0;
    await fireEvent.press(screen.getByRole('button', { name: 'Advanced' }));
    await waitFor(() => expect(mockState.rpcCalls.some((call) => call.args.p_level === 'Advanced')).toBe(true));
  });
});

describe('states', () => {
  it('shows an empty state with a way to clear the filters', async () => {
    mockState.players = [];
    await openDiscover();
    await fireEvent.press(screen.getByRole('tab', { name: /^Players/ }));
    await waitFor(() => expect(screen.getByText('No players here yet')).toBeTruthy());
    expect(screen.getByRole('button', { name: 'Clear filters' })).toBeTruthy();
    expect(screen.queryByText(/Turn on/)).toBeNull();
  });

  it('points a signed-in member to their profile when the list is empty', async () => {
    mockState.players = [];
    mockState.session = fakeSession('u1');
    mockState.profile = completeProfile('u1');
    await openDiscover();
    await fireEvent.press(screen.getByRole('tab', { name: /^Players/ }));
    await waitFor(() => expect(screen.getByText('No players here yet')).toBeTruthy());
    expect(screen.getByText(/Turn on "Show me in Find players" in your profile/)).toBeTruthy();
  });

  it('shows an error with a retry, not a blank list', async () => {
    mockState.playersError = { message: 'down' };
    await openDiscover();
    await fireEvent.press(screen.getByRole('tab', { name: /^Players/ }));
    await waitFor(() => expect(screen.getByText('Could not load players')).toBeTruthy());
    expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy();
  });
});

describe('Connect', () => {
  async function connectAsGuest() {
    await openPlayers();
    await fireEvent.press(screen.getAllByRole('button', { name: 'Sign in' })[0]!);
    await waitFor(() => expect(screen.getByText('Connect with players')).toBeTruthy());
  }
  const sheet = () => within(screen.getByTestId('bottom-sheet-surface'));

  it('asks a guest to sign in and connects nothing', async () => {
    await connectAsGuest();
    expect(screen.getByText('Create a free account or sign in to connect with other players.')).toBeTruthy();
    expect(sheet().getByRole('button', { name: 'Create account' })).toBeTruthy();
    expect(sheet().getByRole('button', { name: 'Sign in' })).toBeTruthy();
    expect(sheet().getByRole('button', { name: 'Dismiss' })).toBeTruthy();
    expect(mockState.inserts).toHaveLength(0);
    expect(mockState.upserts).toHaveLength(0);
  });

  it('leaves the guest on the Players list when the prompt is dismissed', async () => {
    await connectAsGuest();
    await fireEvent.press(sheet().getByRole('button', { name: 'Dismiss' }));
    await waitFor(() => expect(screen.queryByText('Connect with players')).toBeNull());
    expect(screen.getByRole('tab', { name: /^Players/, selected: true })).toBeTruthy();
    expect(screen.getByText('Jordi M.')).toBeTruthy();
  });

  it('dismisses on Android back and stays on the list', async () => {
    await connectAsGuest();
    await act(async () => screen.getByTestId('bottom-sheet-modal').props.onRequestClose());
    await waitFor(() => expect(screen.queryByText('Connect with players')).toBeNull());
    expect(screen.getByText('Jordi M.')).toBeTruthy();
  });

  it('returns a guest to the Players list after signing in, with nothing connected', async () => {
    await connectAsGuest();
    await fireEvent.press(sheet().getByRole('button', { name: 'Sign in' }));
    await waitFor(() => expect(screen.getByLabelText('Email')).toBeTruthy());

    supabase.auth.signInWithPassword.mockImplementationOnce(async () => {
      mockState.session = fakeSession('u1');
      mockState.profile = completeProfile('u1');
      mockState.listeners.forEach((listener) => listener('SIGNED_IN', mockState.session));
      return { data: {}, error: null } as never;
    });
    await fireEvent.changeText(screen.getByLabelText('Email'), 'leon@example.com');
    await fireEvent.changeText(screen.getByLabelText('Password'), 'password1');
    await fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => expect(screen.getByRole('tab', { name: /^Players/, selected: true })).toBeTruthy());
    expect(screen.getByText('Jordi M.')).toBeTruthy();
    expect(mockState.inserts).toHaveLength(0);
  });

  describe('for a signed-in member', () => {
    beforeEach(() => {
      mockState.session = fakeSession('u1');
      mockState.profile = completeProfile('u1');
      mockState.players = [player('Jordi M.', 'Málaga', 'Advanced', 1, 'p-1')];
    });

    it('opens a "To be developed" sheet instead of the sign-in prompt, and sends nothing', async () => {
      await openPlayers();
      expect(screen.getByRole('button', { name: 'Connect' })).toHaveProp(
        'accessibilityState',
        expect.not.objectContaining({ disabled: true }),
      );

      await fireEvent.press(screen.getByRole('button', { name: 'Connect' }));
      await waitFor(() => expect(screen.getByText('To be developed')).toBeTruthy());
      expect(screen.getByText('Connect with players')).toBeTruthy();
      expect(screen.queryByRole('button', { name: 'Create account' })).toBeNull();
      expect(screen.queryByRole('button', { name: 'Sign in' })).toBeNull();
      expect(mockState.inserts).toHaveLength(0);
      expect(mockState.upserts).toHaveLength(0);
    });

    it('closes the sheet with its close control and stays on the list', async () => {
      await openPlayers();
      await fireEvent.press(screen.getByRole('button', { name: 'Connect' }));
      await waitFor(() => expect(screen.getByText('To be developed')).toBeTruthy());

      await fireEvent.press(screen.getByRole('button', { name: 'Close' }));
      await waitFor(() => expect(screen.queryByText('To be developed')).toBeNull());
      expect(screen.getByText('Jordi M.')).toBeTruthy();
    });

    it('closes the sheet on Android back', async () => {
      await openPlayers();
      await fireEvent.press(screen.getByRole('button', { name: 'Connect' }));
      await waitFor(() => expect(screen.getByText('To be developed')).toBeTruthy());

      await act(async () => screen.getByTestId('bottom-sheet-modal').props.onRequestClose());
      await waitFor(() => expect(screen.queryByText('To be developed')).toBeNull());
    });
  });
});
