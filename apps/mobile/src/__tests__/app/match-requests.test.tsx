import { createQueryClient } from '@padel/query';
import { QueryTestProvider } from '@padel/query/testing';
import { fakeSession, mockState, resetMockSupabase } from '@padel/supabase/testing';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { act, fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import { Share, Text } from 'react-native';

import ManageMatchScreen from '@/app/match/[id]/manage';
import MatchScreen from '@/app/match/[id]';
import { AppShell } from '@/components/app-shell';

jest.mock('@padel/supabase', () => jest.requireActual('@padel/supabase/testing'));

const matchRow = {
  id: 'm1',
  destination_id: 'marbella',
  destination_name: 'Marbella',
  destination_country: 'Spain',
  start_date: '2099-02-20',
  end_date: null,
  start_time: '18:30:00',
  venue: 'Puerto Padel Club',
  level_wanted: 'Intermediate',
  players_needed: 2,
  spots_left: 2,
  description: 'Friendly doubles',
  poster_name: 'Carlos Martín',
  poster_skill_tier: 'Advanced',
};

const profile = {
  id: 'u1',
  display_name: 'Leon Smith',
  home_city: null,
  bio: '',
  profile_sports: [{ skill_tier: 'Intermediate' }],
};

type Role = 'organiser' | 'requester' | 'member';
const person = (kind: string, name: string, tier: string | null, requestId: string | null = null) => ({
  person_kind: kind,
  person_name: name,
  skill_tier: tier,
  request_id: requestId,
  request_status: kind === 'request' ? 'pending' : null,
});
const withHeader = (role: Role, own: string | null, accepted: number, pending: number | null, people: ReturnType<typeof person>[]) =>
  people.map((p) => ({ viewer_role: role, own_status: own, players_needed: 2, accepted_count: accepted, pending_count: pending, ...p }));
const organiserRow = person('organiser', 'Carlos M.', 'Advanced');
const emma = person('player', 'Emma R.', 'Intermediate');

function Home() {
  return (
    <>
      <Text>Home screen</Text>
      <Text onPress={() => router.push('/match/m1')}>Open match</Text>
      <Text onPress={() => router.push('/match/m1/manage')}>Open manage</Text>
    </>
  );
}

function Discover() {
  const { destinationId } = useLocalSearchParams<{ destinationId?: string }>();
  return <Text>{`Discover screen ${destinationId ?? 'unfiltered'}`}</Text>;
}

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
  '(tabs)/index': Home,
  '(tabs)/discover': Discover,
  'match/[id]': MatchScreen,
  'match/[id]/manage': ManageMatchScreen,
};

const calls = (name: string) => mockState.rpcCalls.filter((c) => c.name === name);

function signedInAs(people: unknown[]) {
  mockState.session = fakeSession('u1');
  mockState.profile = profile;
  mockState.matchPeople = people;
}

async function openMatch() {
  await renderRouter(routes, { initialUrl: '/' });
  await fireEvent.press(await screen.findByText('Open match'));
  await waitFor(() => expect(screen.getByRole('header', { name: 'Marbella' })).toBeTruthy());
}

async function openManage() {
  await renderRouter(routes, { initialUrl: '/' });
  await fireEvent.press(await screen.findByText('Open manage'));
}

beforeEach(() => {
  resetMockSupabase();
  jest.clearAllMocks();
  client = createQueryClient({ gcTime: Infinity });
  mockState.listings = [matchRow];
});

describe('the match screen for a guest', () => {
  it('never asks for the people on a match and shows the organiser by public name only', async () => {
    await openMatch();
    expect(calls('match_people')).toHaveLength(0);
    expect(screen.getByText('Carlos Martín')).toBeTruthy();
    expect(screen.getByText('Match organiser')).toBeTruthy();
    expect(screen.queryByText(/Playing/)).toBeNull();
  });

  it('shows a full match with a notice and no request action', async () => {
    mockState.listings = [{ ...matchRow, spots_left: 0 }];
    await openMatch();
    expect(screen.getByLabelText(/This match is full/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Request to join' })).toBeNull();
    expect(screen.getByText('3 of 3')).toBeTruthy();
  });
});

describe('the match screen for a signed-in member', () => {
  it('shows the organiser and the accepted players, never a request', async () => {
    signedInAs(withHeader('member', null, 1, null, [organiserRow, emma]));
    mockState.listings = [{ ...matchRow, spots_left: 1 }];
    await openMatch();
    await waitFor(() => expect(screen.getByText('Emma R.')).toBeTruthy());
    expect(screen.getByText('Carlos M.')).toBeTruthy();
    expect(screen.getByText('2 of 3')).toBeTruthy();
    expect(screen.queryByText('Requesting to join')).toBeNull();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Request to join' }).props.accessibilityState.disabled).toBe(false));
  });

  it('shows a pending request with a banner and a way to withdraw, not a second request', async () => {
    signedInAs(withHeader('requester', 'pending', 0, null, [organiserRow]));
    await openMatch();
    await waitFor(() => expect(screen.getByLabelText('Request pending. Waiting for Carlos M. to confirm your place.')).toBeTruthy());
    expect(screen.getByRole('button', { name: 'Withdraw request' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Request to join' })).toBeNull();
  });

  it("tells an accepted member they're in", async () => {
    signedInAs(withHeader('requester', 'accepted', 1, null, [organiserRow, person('player', 'Leon S.', 'Intermediate')]));
    await openMatch();
    await waitFor(() => expect(screen.getByLabelText("You're in!. Your place has been confirmed.")).toBeTruthy());
    expect(screen.getByRole('button', { name: 'Withdraw request' })).toBeTruthy();
  });

  it('shows a declined member the banner and Find similar matches, which opens Discover for the same place', async () => {
    signedInAs(withHeader('requester', 'declined', 0, null, [organiserRow]));
    await openMatch();
    await waitFor(() => expect(screen.getByLabelText(/^Request declined/)).toBeTruthy());
    expect(screen.queryByRole('button', { name: 'Request to join' })).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: 'Find similar matches' }));
    await waitFor(() => expect(screen.getByText('Discover screen marbella')).toBeTruthy());
  });

  it('shows the organiser Manage match with the waiting count instead of Request to join', async () => {
    signedInAs(withHeader('organiser', null, 0, 2, [organiserRow, person('request', 'David K.', 'Beginner', 'r1')]));
    await openMatch();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Manage match · 2 requests' })).toBeTruthy());
    expect(screen.queryByRole('button', { name: 'Request to join' })).toBeNull();
    // Requests are handled on Manage match, not listed on the public screen.
    expect(screen.queryByText('David K.')).toBeNull();
  });

  it('asks the database for the match people once signed in', async () => {
    signedInAs(withHeader('member', null, 0, null, [organiserRow]));
    await openMatch();
    await waitFor(() => expect(calls('match_people')).toEqual([{ name: 'match_people', args: { p_listing: 'm1' } }]));
  });
});

describe('sharing a match', () => {
  it('opens the phone share sheet with the destination, the date and a link to the match, for a guest', async () => {
    const share = jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' } as never);
    await openMatch();
    await fireEvent.press(screen.getByRole('button', { name: 'Share' }));
    expect(share).toHaveBeenCalledTimes(1);
    const { message } = share.mock.calls[0]![0] as { message: string };
    expect(message).toContain('Padel match in Marbella');
    expect(message).toContain('Feb 20');
    expect(message).toContain('match/m1');
  });

  it('has no favourite button', async () => {
    await openMatch();
    expect(screen.queryByRole('button', { name: /favourite/i })).toBeNull();
  });

  it('survives the share sheet failing', async () => {
    jest.spyOn(Share, 'share').mockRejectedValue(new Error('unavailable'));
    await openMatch();
    await fireEvent.press(screen.getByRole('button', { name: 'Share' }));
    expect(screen.getByRole('header', { name: 'Marbella' })).toBeTruthy();
  });
});

describe('Manage match', () => {
  const organiserPeople = withHeader('organiser', null, 1, 1, [
    organiserRow,
    emma,
    person('request', 'David K.', 'Beginner', 'r1'),
  ]);

  it('shows the Players and Requests tabs with their counts and the requesting person', async () => {
    signedInAs(organiserPeople);
    await openManage();
    await waitFor(() => expect(screen.getByRole('tab', { name: 'Requests, 1', selected: true })).toBeTruthy());
    expect(screen.getByRole('tab', { name: 'Players, 2' })).toBeTruthy();
    expect(screen.getByText('David K.')).toBeTruthy();
    expect(screen.getByText('Requesting to join')).toBeTruthy();
    await fireEvent.press(screen.getByRole('tab', { name: 'Players, 2' }));
    expect(screen.getByText('Match organiser')).toBeTruthy();
    expect(screen.getByText('Emma R.')).toBeTruthy();
    expect(screen.queryByText('David K.')).toBeNull();
  });

  it('accepts from the row and calls the database function with the request id', async () => {
    signedInAs(organiserPeople);
    await openManage();
    await fireEvent.press(await screen.findByRole('button', { name: 'Accept David K.' }));
    await waitFor(() => expect(calls('decide_join_request')).toEqual([{ name: 'decide_join_request', args: { p_request: 'r1', p_accept: true } }]));
  });

  it('opens a review sheet with name and skill level only, and declines from it', async () => {
    signedInAs(organiserPeople);
    await openManage();
    await fireEvent.press(await screen.findByRole('button', { name: "Review David K.'s request" }));
    await waitFor(() => expect(screen.getByRole('header', { name: 'David K.' })).toBeTruthy());
    expect(screen.getByText('Skill level: Beginner')).toBeTruthy();
    expect(screen.queryByText(/Málaga|@|message/i)).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: 'Decline request' }));
    await waitFor(() => expect(calls('decide_join_request')).toEqual([{ name: 'decide_join_request', args: { p_request: 'r1', p_accept: false } }]));
    await waitFor(() => expect(screen.queryByRole('header', { name: 'David K.' })).toBeNull());
  });

  it('says why a decision failed', async () => {
    signedInAs(organiserPeople);
    await openManage();
    const accept = await screen.findByRole('button', { name: 'Accept David K.' });
    mockState.joinError = 'match_full';
    await fireEvent.press(accept);
    await waitFor(() => expect(screen.getByText('This match is full.')).toBeTruthy());
  });

  it('asks before closing, keeps the match open if told to, and closes it when confirmed', async () => {
    signedInAs(organiserPeople);
    await openManage();
    await fireEvent.press(await screen.findByRole('button', { name: 'Close match' }));
    await waitFor(() => expect(screen.getByRole('header', { name: 'Close this match?' })).toBeTruthy());
    expect(mockState.updates).toHaveLength(0);
    await fireEvent.press(screen.getByRole('button', { name: 'Keep match open' }));
    await waitFor(() => expect(screen.queryByRole('header', { name: 'Close this match?' })).toBeNull());
    expect(mockState.updates).toHaveLength(0);

    await fireEvent.press(screen.getByRole('button', { name: 'Close match' }));
    await waitFor(() => expect(screen.getByRole('header', { name: 'Close this match?' })).toBeTruthy());
    // The screen's own Close match button comes first; the sheet's confirm button is the last one.
    await fireEvent.press(screen.getAllByRole('button', { name: 'Close match' }).at(-1)!);
    await waitFor(() => expect(mockState.updates).toEqual([{ table: 'listings', values: { status: 'closed' }, id: 'm1' }]));
  });

  it('takes someone who is not the organiser to the public details and shows no requests', async () => {
    signedInAs(withHeader('member', null, 1, null, [organiserRow, emma]));
    await openManage();
    await waitFor(() => expect(screen.getByRole('header', { name: 'Marbella' })).toBeTruthy());
    expect(screen.queryByRole('tab', { name: /Requests/ })).toBeNull();
    expect(screen.queryByText('David K.')).toBeNull();
  });

  it('takes a guest to the public details without asking for the people', async () => {
    await openManage();
    await waitFor(() => expect(screen.getByRole('header', { name: 'Marbella' })).toBeTruthy());
    expect(calls('match_people')).toHaveLength(0);
  });

  it('says the match is closed when it has left Discover', async () => {
    signedInAs(organiserPeople);
    mockState.listings = [];
    await openManage();
    await waitFor(() => expect(screen.getByText('This match is closed')).toBeTruthy());
    expect(screen.queryByRole('tab', { name: /Requests/ })).toBeNull();
  });

  it('shows a retry when the people cannot be loaded', async () => {
    signedInAs(organiserPeople);
    mockState.joinError = 'unknown';
    await openManage();
    await waitFor(() => expect(screen.getByText('Could not load this match.')).toBeTruthy());
    expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy();
  });
});

describe('opening Manage match from the match screen', () => {
  it('goes to Manage match when the organiser taps the action', async () => {
    signedInAs(withHeader('organiser', null, 0, 1, [organiserRow, person('request', 'David K.', 'Beginner', 'r1')]));
    await openMatch();
    await fireEvent.press(await screen.findByRole('button', { name: 'Manage match · 1 request' }));
    await waitFor(() => expect(screen.getByRole('tab', { name: /^Requests/ })).toBeTruthy());
    await act(async () => router.back());
    await waitFor(() => expect(screen.getByRole('header', { name: 'Marbella' })).toBeTruthy());
  });
});
