import { fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { Text } from 'react-native';

import { QueryTestProvider } from '@padel/query/testing';
import { mockState, resetMockSupabase } from '@padel/supabase/testing';

import type { DiscoverListing } from '../src/domain/listing';
import { MatchDetail } from '../src/presentation/components/match-detail';
import { ListingCard } from '../src/presentation/components/listing-card';
import { useDiscoverListing } from '../src/presentation/hooks/use-listings';

jest.mock('@padel/supabase', () => jest.requireActual('@padel/supabase/testing'));

const wrapper = ({ children }: { children: ReactNode }) => <QueryTestProvider>{children}</QueryTestProvider>;

const row = {
  id: 'm1',
  destination_id: 'd1',
  destination_name: 'Marbella',
  destination_country: 'Spain',
  start_date: '2026-02-20',
  end_date: null,
  start_time: '18:30:00',
  venue: 'Puerto Padel Club',
  level_wanted: 'Intermediate',
  players_needed: 2,
  description: 'Friendly doubles',
  poster_name: 'Leon',
  poster_skill_tier: 'Advanced',
};

const listing: DiscoverListing = {
  id: 'm1',
  destinationId: 'd1',
  destinationName: 'Marbella',
  destinationCountry: 'Spain',
  startDate: '2026-02-20',
  endDate: null,
  startTime: '18:30',
  venue: 'Puerto Padel Club',
  levelWanted: 'Intermediate',
  playersNeeded: 2,
  spotsLeft: 2,
  description: 'Friendly doubles',
  posterName: 'Leon',
  posterSkillTier: 'Advanced',
};

beforeEach(() => resetMockSupabase());

describe('useDiscoverListing', () => {
  it('loads the public match with that id', async () => {
    mockState.listings = [row];
    const { result } = await renderHook(() => useDiscoverListing('m1'), { wrapper });
    await waitFor(() => expect(result.current.listing).toMatchObject({ id: 'm1', destinationName: 'Marbella' }));
    expect(result.current.loading).toBe(false);
    expect(result.current.failed).toBe(false);
  });

  it('reports null for a match that is closed, past or unknown', async () => {
    mockState.listings = [row];
    const { result } = await renderHook(() => useDiscoverListing('gone'), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.listing).toBeNull();
    expect(result.current.failed).toBe(false);
  });

  it('reports a failed request', async () => {
    mockState.listingsError = { message: 'down' };
    const { result } = await renderHook(() => useDiscoverListing('m1'), { wrapper });
    await waitFor(() => expect(result.current.failed).toBe(true));
    expect(result.current.listing).toBeUndefined();
  });

  it('does not load without an id', async () => {
    const { result } = await renderHook(() => useDiscoverListing(undefined), { wrapper });
    expect(result.current.loading).toBe(false);
    expect(result.current.listing).toBeUndefined();
  });
});

describe('ListingCard', () => {
  it('is not pressable without onPress', async () => {
    await render(<ListingCard listing={listing} />);
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByText('Marbella')).toBeTruthy();
  });

  it('opens the match when pressed', async () => {
    const onPress = jest.fn();
    await render(<ListingCard listing={listing} onPress={onPress} />);
    const card = screen.getByRole('button', { name: /Marbella/ });
    expect(card.props.accessibilityHint).toBe('Opens the match details');
    await fireEvent.press(card);
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe('MatchDetail', () => {
  const props = { loading: false, failed: false, onRetry: jest.fn(), onBackToDiscover: jest.fn() };

  beforeEach(() => jest.clearAllMocks());

  it('shows the public fields of a match', async () => {
    await render(<MatchDetail {...props} listing={listing} />);
    expect(screen.getByRole('header', { name: 'Marbella' })).toBeTruthy();
    expect(screen.getByText('Puerto Padel Club, Marbella, Spain')).toBeTruthy();
    expect(screen.getByText(/18:30/)).toBeTruthy();
    expect(screen.getByText('Intermediate')).toBeTruthy();
    expect(screen.getByText('Friendly doubles')).toBeTruthy();
    expect(screen.getByText('About this match')).toBeTruthy();
  });

  it('shows the date tile for the start date', async () => {
    await render(<MatchDetail {...props} listing={listing} />);
    expect(screen.getByText('FRI', { includeHiddenElements: true })).toBeTruthy();
    expect(screen.getByText('20', { includeHiddenElements: true })).toBeTruthy();
    expect(screen.getByText('FEB', { includeHiddenElements: true })).toBeTruthy();
  });

  it('omits fields that are not set instead of inventing content', async () => {
    await render(
      <MatchDetail {...props} listing={{ ...listing, venue: null, startTime: null, description: '', posterSkillTier: null }} />,
    );
    expect(screen.queryByText('About this match')).toBeNull();
    expect(screen.queryByText(/ at /)).toBeNull();
    expect(screen.getByText('Marbella, Spain')).toBeTruthy();
  });

  it('shows players progress counting the organiser, from the places left', async () => {
    await render(<MatchDetail {...props} listing={{ ...listing, playersNeeded: 3, spotsLeft: 2 }} />);
    expect(screen.getByRole('progressbar', { name: 'Players, 2 of 4' })).toBeTruthy();
    expect(screen.getByText('2 of 4')).toBeTruthy();
  });

  it('shows a full match as every player in', async () => {
    await render(<MatchDetail {...props} listing={{ ...listing, playersNeeded: 2, spotsLeft: 0 }} />);
    expect(screen.getByText('3 of 3')).toBeTruthy();
  });

  it('renders the banner, organiser and players slots in order', async () => {
    await render(
      <MatchDetail
        {...props}
        listing={listing}
        banner={<Text>Banner slot</Text>}
        organiser={<Text>Organiser slot</Text>}
        players={<Text>Players slot</Text>}
      />,
    );
    const tree = JSON.stringify(screen.toJSON());
    const order = ['Banner slot', 'Marbella', 'Organiser slot', 'Players slot'].map((t) => tree.indexOf(t));
    expect(order.every((i) => i >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  it('shows a loading indicator and nothing else while loading', async () => {
    await render(<MatchDetail {...props} loading listing={undefined} />);
    expect(screen.getByLabelText('Loading match')).toBeTruthy();
    expect(screen.queryByText('This match is no longer available')).toBeNull();
  });

  it('explains an unavailable match and offers a way back', async () => {
    await render(<MatchDetail {...props} listing={null} />);
    expect(screen.getByText('This match is no longer available')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Back to Discover' }));
    expect(props.onBackToDiscover).toHaveBeenCalledTimes(1);
  });

  it('shows a retry for a failed request', async () => {
    await render(<MatchDetail {...props} failed listing={undefined} />);
    expect(screen.getByText('Could not load this match.')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
    expect(props.onRetry).toHaveBeenCalledTimes(1);
  });
});
