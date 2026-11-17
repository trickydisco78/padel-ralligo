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
  description: 'Friendly doubles',
  posterName: 'Leon',
  posterSkillTier: 'Advanced',
};

beforeEach(() => resetMockSupabase());

describe('useDiscoverListing', () => {
  it('loads the public match with that id', async () => {
    mockState.listings = [row];
    const { result } = await renderHook(() => useDiscoverListing('m1'), { wrapper });
    expect(result.current.loading).toBe(true);
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
    expect(screen.getByText('Marbella, Spain')).toBeTruthy();
    expect(screen.getByText('Puerto Padel Club')).toBeTruthy();
    expect(screen.getByText(/18:30/)).toBeTruthy();
    expect(screen.getByText('Intermediate')).toBeTruthy();
    expect(screen.getByText('2 spots needed')).toBeTruthy();
    expect(screen.getByText('Friendly doubles')).toBeTruthy();
    expect(screen.getByText('Leon · Advanced')).toBeTruthy();
  });

  it('omits fields that are not set instead of inventing content', async () => {
    await render(
      <MatchDetail {...props} listing={{ ...listing, venue: null, startTime: null, description: '', posterSkillTier: null }} />,
    );
    expect(screen.queryByText('Venue')).toBeNull();
    expect(screen.queryByText('About this match')).toBeNull();
    expect(screen.queryByText(/ at /)).toBeNull();
    expect(screen.getByText('Leon')).toBeTruthy();
  });

  it('says "1 spot needed" in the singular', async () => {
    await render(<MatchDetail {...props} listing={{ ...listing, playersNeeded: 1 }} />);
    expect(screen.getByText('1 spot needed')).toBeTruthy();
  });

  it('renders the footer under the details', async () => {
    await render(<MatchDetail {...props} listing={listing} footer={<Text>Join action</Text>} />);
    expect(screen.getByText('Join action')).toBeTruthy();
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
