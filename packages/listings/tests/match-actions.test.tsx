import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { StyleSheet } from 'react-native';

import { QueryTestProvider } from '@padel/query/testing';
import { mockState, resetMockSupabase } from '@padel/supabase/testing';

import type { DiscoverListing } from '../src/domain/listing';
import { MatchActions, type MatchViewer } from '../src/presentation/components/match-actions';
import { MatchStatusBanner } from '../src/presentation/components/match-status-banner';

jest.mock('@padel/supabase', () => jest.requireActual('@padel/supabase/testing'));

const listing: DiscoverListing = {
  id: 'm1',
  destinationId: 'd1',
  destinationName: 'Málaga',
  destinationCountry: 'Spain',
  startDate: '2999-06-17',
  endDate: null,
  startTime: '18:30',
  venue: 'Málaga Centro',
  levelWanted: 'Any',
  playersNeeded: 3,
  spotsLeft: 2,
  description: '',
  posterName: 'Carlos Martín',
  posterSkillTier: 'Advanced',
};

const handlers = { onGuestRequest: jest.fn(), onManage: jest.fn(), onFindSimilar: jest.fn() };

function setup(props: Partial<React.ComponentProps<typeof MatchActions>> & { viewer?: MatchViewer } = {}) {
  const wrap = ({ children }: { children: ReactNode }) => <QueryTestProvider>{children}</QueryTestProvider>;
  return render(
    <MatchActions
      listing={listing}
      viewer="member"
      ownStatus={null}
      pendingCount={0}
      organiserName="Carlos M."
      {...handlers}
      {...props}
    />,
    { wrapper: wrap },
  );
}

const calls = (name: string) => mockState.rpcCalls.filter((c) => c.name === name);

beforeEach(() => {
  resetMockSupabase();
  jest.clearAllMocks();
});

describe('MatchActions: who sees what', () => {
  it('offers Request to join to a member with no request', async () => {
    await setup();
    expect(screen.getByRole('button', { name: 'Request to join' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Withdraw request' })).toBeNull();
  });

  it('a guest taps Request to join and only the sign-in handler runs: nothing is requested', async () => {
    await setup({ viewer: 'guest' });
    await fireEvent.press(screen.getByRole('button', { name: 'Request to join' }));
    expect(handlers.onGuestRequest).toHaveBeenCalledTimes(1);
    expect(calls('request_to_join')).toHaveLength(0);
  });

  it('offers Withdraw request while pending and while accepted for a match still to come', async () => {
    const { rerender } = await setup({ viewer: 'requester', ownStatus: 'pending' });
    expect(screen.getByRole('button', { name: 'Withdraw request' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Request to join' })).toBeNull();
    await rerender(
      <QueryTestProvider>
        <MatchActions listing={listing} viewer="requester" ownStatus="accepted" pendingCount={0} organiserName="Carlos M." {...handlers} />
      </QueryTestProvider>,
    );
    expect(screen.getByRole('button', { name: 'Withdraw request' })).toBeTruthy();
  });

  it('offers nothing to an accepted player once the match has started', async () => {
    await setup({ viewer: 'requester', ownStatus: 'accepted', listing: { ...listing, startDate: '2020-01-01' } });
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('offers Find similar matches to a declined member and no request', async () => {
    await setup({ viewer: 'requester', ownStatus: 'declined' });
    expect(screen.queryByRole('button', { name: 'Request to join' })).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: 'Find similar matches' }));
    expect(handlers.onFindSimilar).toHaveBeenCalledTimes(1);
  });

  it('offers a withdrawn member Request to join again', async () => {
    await setup({ viewer: 'requester', ownStatus: 'withdrawn' });
    expect(screen.getByRole('button', { name: 'Request to join' })).toBeTruthy();
  });

  it('offers no action on a full match to someone who is not involved', async () => {
    await setup({ listing: { ...listing, spotsLeft: 0 } });
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('shows the organiser Manage match with the number of waiting requests', async () => {
    await setup({ viewer: 'organiser', pendingCount: 2 });
    await fireEvent.press(screen.getByRole('button', { name: 'Manage match · 2 requests' }));
    expect(handlers.onManage).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: 'Request to join' })).toBeNull();
  });

  it('says Manage match with no count and the singular for one request', async () => {
    const { rerender } = await setup({ viewer: 'organiser', pendingCount: 0 });
    expect(screen.getByRole('button', { name: 'Manage match' })).toBeTruthy();
    await rerender(
      <QueryTestProvider>
        <MatchActions listing={listing} viewer="organiser" ownStatus={null} pendingCount={1} organiserName="Carlos M." {...handlers} />
      </QueryTestProvider>,
    );
    expect(screen.getByRole('button', { name: 'Manage match · 1 request' })).toBeTruthy();
  });

  it('shows a disabled Request to join while the member role is loading', async () => {
    await setup({ viewer: 'loading' });
    expect(screen.getByRole('button', { name: 'Request to join' }).props.accessibilityState.disabled).toBe(true);
  });
});

describe('MatchActions: requesting', () => {
  it('requests a place, then confirms with the Request sent sheet that makes no notification promise', async () => {
    await setup();
    await fireEvent.press(screen.getByRole('button', { name: 'Request to join' }));
    await waitFor(() => expect(screen.getByRole('header', { name: 'Request sent!' })).toBeTruthy());
    expect(calls('request_to_join')).toEqual([{ name: 'request_to_join', args: { p_listing: 'm1' } }]);
    expect(screen.getByText("You can see Carlos M.'s answer here once they respond.")).toBeTruthy();
    expect(screen.queryByText(/notif/i)).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: 'Done' }));
    await waitFor(() => expect(screen.queryByRole('header', { name: 'Request sent!' })).toBeNull());
  });

  it.each([
    ['match_full', 'This match is full.'],
    ['email_not_confirmed', /Verify your email address to request a place/],
    ['declined', /wasn't approved/],
    ['connection reset', 'Something went wrong. Please try again.'],
  ])('says why a request failed: %s', async (code, text) => {
    mockState.joinError = code;
    await setup();
    await fireEvent.press(screen.getByRole('button', { name: 'Request to join' }));
    await waitFor(() => expect(screen.getByText(text)).toBeTruthy());
    expect(screen.queryByRole('header', { name: 'Request sent!' })).toBeNull();
  });
});

describe('MatchActions: withdrawing', () => {
  const open = async () => {
    await setup({ viewer: 'requester', ownStatus: 'pending' });
    await fireEvent.press(screen.getByRole('button', { name: 'Withdraw request' }));
    await waitFor(() => expect(screen.getByRole('header', { name: 'Withdraw request?' })).toBeTruthy());
  };

  it('asks first and changes nothing until confirmed', async () => {
    await open();
    expect(screen.getByText("You'll no longer be considered for this match.")).toBeTruthy();
    expect(calls('withdraw_join_request')).toHaveLength(0);
  });

  it('Keep request closes the sheet without withdrawing', async () => {
    await open();
    await fireEvent.press(screen.getByRole('button', { name: 'Keep request' }));
    await waitFor(() => expect(screen.queryByRole('header', { name: 'Withdraw request?' })).toBeNull());
    expect(calls('withdraw_join_request')).toHaveLength(0);
  });

  it('Withdraw withdraws and closes the sheet', async () => {
    await open();
    await fireEvent.press(screen.getByRole('button', { name: 'Withdraw' }));
    await waitFor(() => expect(calls('withdraw_join_request')).toEqual([{ name: 'withdraw_join_request', args: { p_listing: 'm1' } }]));
    await waitFor(() => expect(screen.queryByRole('header', { name: 'Withdraw request?' })).toBeNull());
  });

  it('shows the reason when withdrawing fails', async () => {
    await open();
    mockState.joinError = 'match_past';
    await fireEvent.press(screen.getByRole('button', { name: 'Withdraw' }));
    await waitFor(() => expect(screen.getByText('This match has already started or been played.')).toBeTruthy());
  });
});

describe('MatchStatusBanner', () => {
  const banner = (status: React.ComponentProps<typeof MatchStatusBanner>['status'], full = false) =>
    render(<MatchStatusBanner status={status} organiserName="Carlos M." full={full} />);

  it('pending names the organiser', async () => {
    await banner('pending');
    expect(screen.getByLabelText('Request pending. Waiting for Carlos M. to confirm your place.')).toBeTruthy();
  });

  it('pending on a match that has filled says so', async () => {
    await banner('pending', true);
    expect(screen.getByLabelText('Request pending. Waiting for Carlos M.. The match is now full.')).toBeTruthy();
  });

  it("accepted says You're in!", async () => {
    await banner('accepted');
    expect(screen.getByLabelText("You're in!. Your place has been confirmed.")).toBeTruthy();
  });

  it('declined is the dark banner', async () => {
    await banner('declined');
    expect(StyleSheet.flatten(screen.getByLabelText(/^Request declined/).props.style).backgroundColor).toBe('#1A1218');
  });

  it('a full match with no request shows a notice, and a withdrawn member sees none', async () => {
    const { unmount } = await banner(null, true);
    expect(screen.getByLabelText(/This match is full/)).toBeTruthy();
    unmount();
    await banner('withdrawn', false);
    expect(screen.toJSON()).toBeNull();
  });

  it('shows nothing for a member with no request on a match with places', async () => {
    await banner(null, false);
    expect(screen.toJSON()).toBeNull();
  });
});
