import { toIsoDate } from '@padel/core';
import { AuthIntentProvider, SessionProvider, SignInScreen, SignUpScreen } from '@padel/auth';
import { QueryTestProvider } from '@padel/query/testing';
import { mockState, resetMockSupabase } from '@padel/supabase/testing';
import { Stack, router, useGlobalSearchParams } from 'expo-router';
import { act, fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import { Text } from 'react-native';

import DiscoverScreen from '@/app/(tabs)/discover';
import MatchScreen from '@/app/match/[id]';
import { AppShell } from '@/components/app-shell';

jest.mock('@padel/supabase', () => jest.requireActual('@padel/supabase/testing'));

function daysFromNow(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return toIsoDate(d);
}

const row = (id: string, overrides: Record<string, unknown> = {}) => ({
  id,
  destination_id: 'marbella',
  destination_name: 'Marbella',
  destination_country: 'Spain',
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

const dest = (id: string, name: string, country: string) => ({ id, name, country, tagline: '', open_listings: 0 });

beforeEach(() => {
  resetMockSupabase();
  mockState.destinations = [dest('marbella', 'Marbella', 'Spain'), dest('tenerife', 'Tenerife', 'Spain'), dest('algarve', 'The Algarve', 'Portugal')];
  mockState.listings = [
    row('m1', { venue: 'Ace Padel Club', description: 'Friendly doubles' }),
    row('t1', { destination_id: 'tenerife', destination_name: 'Tenerife', venue: 'Sun Courts', poster_name: 'Ben' }),
    row('a1', { destination_id: 'algarve', destination_name: 'The Algarve', destination_country: 'Portugal', venue: 'Vilamoura Arena', poster_name: 'Rui' }),
  ];
});

const MatchStub = () => <Text>Match opened</Text>;

function ParamsProbe() {
  const { focusSearch } = useGlobalSearchParams();
  return <Text>{`focusSearch: ${focusSearch ?? 'none'}`}</Text>;
}

const openDiscover = (url = '/') =>
  renderRouter(
    {
      _layout: () => (
        <QueryTestProvider>
          <SessionProvider>
            <AuthIntentProvider>
              <Stack screenOptions={{ headerShown: false }} />
              <ParamsProbe />
            </AuthIntentProvider>
          </SessionProvider>
        </QueryTestProvider>
      ),
      index: DiscoverScreen,
      'match/[id]': MatchStub,
    },
    { initialUrl: url },
  );

const search = (text: string) => fireEvent.changeText(screen.getByLabelText('Search'), text);
const chip = (name: string) => screen.queryByRole('button', { name });
const hasCard = (text: RegExp) => screen.queryByText(text) !== null;

describe('Discover search', () => {
  it('finds matches by destination, country or venue', async () => {
    await openDiscover();
    await waitFor(() => expect(hasCard(/Ann ·/)).toBe(true));

    await search('tenerife');
    expect(hasCard(/Ben ·/)).toBe(true);
    expect(hasCard(/Ann ·/)).toBe(false);

    await search('portugal');
    expect(hasCard(/Rui ·/)).toBe(true);
    expect(hasCard(/Ben ·/)).toBe(false);

    await search('ace padel');
    expect(hasCard(/Ann ·/)).toBe(true);
    expect(hasCard(/Rui ·/)).toBe(false);
  });

  it('works for a guest with no sign-in', async () => {
    await openDiscover();
    await waitFor(() => expect(screen.getByLabelText('Search')).toBeTruthy());
    expect(screen.queryByText(/Sign in/)).toBeNull();
  });

  it('ignores case and accents', async () => {
    await openDiscover();
    await waitFor(() => expect(hasCard(/Ann ·/)).toBe(true));
    await search('SUN COURTS');
    expect(hasCard(/Ben ·/)).toBe(true);
    expect(hasCard(/Ann ·/)).toBe(false);
  });

  it('narrows the destination chips, but keeps a chosen destination visible', async () => {
    await openDiscover();
    await waitFor(() => expect(chip('Tenerife')).toBeTruthy());

    await search('marb');
    expect(chip('Marbella')).toBeTruthy();
    expect(chip('Tenerife')).toBeNull();

    await search('');
    await fireEvent.press(screen.getByRole('button', { name: 'Tenerife' }));
    await search('marb');
    expect(chip('Tenerife')).toBeTruthy();
  });

  it('combines with the existing filters', async () => {
    await openDiscover();
    await waitFor(() => expect(chip('Tenerife')).toBeTruthy());
    await fireEvent.press(screen.getByRole('button', { name: 'Tenerife' }));
    await search('marbella');
    expect(screen.getByText('No games match your filters.')).toBeTruthy();

    await search('sun');
    expect(hasCard(/Ben ·/)).toBe(true);
  });

  it('clears the search along with the filters', async () => {
    await openDiscover();
    await waitFor(() => expect(hasCard(/Ann ·/)).toBe(true));
    await search('zzz');
    expect(screen.getByText('No games match your filters.')).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'Clear filters' }));
    await waitFor(() => expect(hasCard(/Ann ·/)).toBe(true));
    expect(screen.getByLabelText('Search').props.value).toBe('');
  });

  it('opens a match from its card', async () => {
    await openDiscover();
    await waitFor(() => expect(hasCard(/Ann ·/)).toBe(true));
    await fireEvent.press(screen.getByRole('button', { name: /Marbella, .*2 spots needed/ }));
    await waitFor(() => expect(screen.getByText('Match opened')).toBeTruthy());
  });

  it('consumes the focus-search request from Home once', async () => {
    await openDiscover('/?focusSearch=1');
    expect(screen.getByText('focusSearch: 1')).toBeTruthy();
    await waitFor(() => expect(screen.getByText('focusSearch: none')).toBeTruthy());
  });
});

describe('navigation context while signing in', () => {
  const routes = {
    _layout: {
      default: () => (
        <QueryTestProvider>
          <AppShell />
        </QueryTestProvider>
      ),
      unstable_settings: { anchor: '(tabs)' },
    },
    '(tabs)/_layout': () => <Stack screenOptions={{ headerShown: false }} />,
    '(tabs)/index': DiscoverScreen,
    'match/[id]': MatchScreen,
    '(auth)/_layout': () => <Stack screenOptions={{ headerShown: false }} />,
    '(auth)/sign-in': SignInScreen,
    '(auth)/sign-up': SignUpScreen,
  };

  it('returns to Discover with the same filters and search after backing out of sign-in', async () => {
    await renderRouter(routes, { initialUrl: '/' });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Tenerife' })).toBeTruthy());

    await fireEvent.press(screen.getByRole('button', { name: 'Tenerife' }));
    await fireEvent.changeText(screen.getByLabelText('Search'), 'sun');
    await waitFor(() => expect(screen.getByText('Ben · Intermediate')).toBeTruthy());

    await fireEvent.press(screen.getByRole('button', { name: /Tenerife, .*2 spots needed/ }));
    await waitFor(() => expect(screen.getByRole('header', { name: 'Tenerife' })).toBeTruthy());
    await fireEvent.press(screen.getByRole('button', { name: 'Join match' }));
    await waitFor(() => expect(screen.getByText('Join this match')).toBeTruthy());
    await fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));
    await waitFor(() => expect(screen.getByText('New here? Create an account')).toBeTruthy());

    await act(async () => router.back());
    await waitFor(() => expect(screen.getByRole('header', { name: 'Tenerife' })).toBeTruthy());
    await act(async () => router.back());

    await waitFor(() => expect(screen.getByLabelText('Search')).toBeTruthy());
    expect(screen.getByLabelText('Search').props.value).toBe('sun');
    expect(screen.getByRole('button', { name: 'Tenerife' }).props.accessibilityState.selected).toBe(true);
    expect(screen.getByText('Ben · Intermediate')).toBeTruthy();
    expect(screen.queryByText('Ann · Intermediate')).toBeNull();
  });
});
