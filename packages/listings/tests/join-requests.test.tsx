import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { QueryTestProvider } from '@padel/query/testing';
import { mockState, resetMockSupabase, supabase } from '@padel/supabase/testing';

import { joinErrorCode, JoinRequestError, placesLeft, playersProgress } from '../src/domain/join-request';
import { toMatchPeople, type MatchPeopleRow } from '../src/infrastructure/join-request.mapper';
import { createSupabaseJoinRequestRepository } from '../src/infrastructure/supabase-join-request.repository';
import {
  useDecideRequest,
  useMatchPeople,
  useRequestToJoin,
  useWithdrawRequest,
} from '../src/presentation/hooks/use-join-requests';

jest.mock('@padel/supabase', () => jest.requireActual('@padel/supabase/testing'));

const wrapper = ({ children }: { children: ReactNode }) => <QueryTestProvider>{children}</QueryTestProvider>;

const header = { viewer_role: 'organiser', own_status: null, players_needed: 3, accepted_count: 1, pending_count: 2 };
const rows = [
  { ...header, person_kind: 'organiser', request_id: null, person_name: 'Carlos M.', skill_tier: 'Advanced', request_status: null },
  { ...header, person_kind: 'player', request_id: null, person_name: 'Emma R.', skill_tier: 'Intermediate', request_status: null },
  { ...header, person_kind: 'request', request_id: 'r1', person_name: 'David K.', skill_tier: 'Beginner', request_status: 'pending' },
] as unknown as MatchPeopleRow[];

beforeEach(() => resetMockSupabase());

describe('join error codes', () => {
  it('reads a known code from an error message', () => {
    expect(joinErrorCode({ message: 'match_full' })).toBe('match_full');
    expect(joinErrorCode(new Error('declined'))).toBe('declined');
    expect(joinErrorCode(new JoinRequestError('own_match'))).toBe('own_match');
  });

  it('treats anything else as unknown', () => {
    expect(joinErrorCode({ message: 'permission denied for table join_requests' })).toBe('unknown');
    expect(joinErrorCode(null)).toBe('unknown');
    expect(joinErrorCode('match_full')).toBe('unknown');
  });
});

describe('players progress', () => {
  it('counts the organiser on both sides', () => {
    expect(playersProgress({ acceptedCount: 1, playersNeeded: 3 })).toEqual({ current: 2, total: 4 });
    expect(playersProgress({ acceptedCount: 0, playersNeeded: 1 })).toEqual({ current: 1, total: 2 });
  });

  it('works out places left and never goes below zero', () => {
    expect(placesLeft({ acceptedCount: 1, playersNeeded: 3 })).toBe(2);
    expect(placesLeft({ acceptedCount: 3, playersNeeded: 3 })).toBe(0);
    expect(placesLeft({ acceptedCount: 4, playersNeeded: 3 })).toBe(0);
  });
});

describe('toMatchPeople', () => {
  it('has no result for no rows', () => {
    expect(toMatchPeople([])).toBeNull();
  });

  it('builds the header from the first row and one person per row', () => {
    expect(toMatchPeople(rows)).toEqual({
      viewerRole: 'organiser',
      ownStatus: null,
      playersNeeded: 3,
      acceptedCount: 1,
      pendingCount: 2,
      people: [
        { kind: 'organiser', requestId: null, name: 'Carlos M.', skillTier: 'Advanced' },
        { kind: 'player', requestId: null, name: 'Emma R.', skillTier: 'Intermediate' },
        { kind: 'request', requestId: 'r1', name: 'David K.', skillTier: 'Beginner' },
      ],
    });
  });

  it('treats the nulls a member gets as no pending requests and no own status', () => {
    const member = toMatchPeople([{ ...rows[0]!, viewer_role: 'member', pending_count: null as never, own_status: null as never }]);
    expect(member).toMatchObject({ viewerRole: 'member', pendingCount: 0, ownStatus: null });
  });
});

describe('the join request repository', () => {
  const repository = createSupabaseJoinRequestRepository(supabase as never);

  it('calls the four functions with the caller-independent arguments only', async () => {
    mockState.matchPeople = rows;
    expect((await repository.getPeople('m1'))?.acceptedCount).toBe(1);
    await repository.request('m1');
    await repository.withdraw('m1');
    await repository.decide('r1', true);
    expect(mockState.rpcCalls).toEqual([
      { name: 'match_people', args: { p_listing: 'm1' } },
      { name: 'request_to_join', args: { p_listing: 'm1' } },
      { name: 'withdraw_join_request', args: { p_listing: 'm1' } },
      { name: 'decide_join_request', args: { p_request: 'r1', p_accept: true } },
    ]);
  });

  it('turns a database error into a coded error', async () => {
    mockState.joinError = 'match_full';
    await expect(repository.request('m1')).rejects.toMatchObject({ code: 'match_full' });
    await expect(repository.decide('r1', true)).rejects.toBeInstanceOf(JoinRequestError);
  });

  it('keeps an unrecognised failure as unknown', async () => {
    mockState.joinError = 'connection reset';
    await expect(repository.withdraw('m1')).rejects.toMatchObject({ code: 'unknown' });
  });

  it('has no people for an unknown match', async () => {
    mockState.matchPeople = [];
    expect(await repository.getPeople('missing')).toBeNull();
  });
});

describe('join request hooks', () => {
  it('does not load people without a user or a match', async () => {
    const { result } = await renderHook(() => useMatchPeople('m1', undefined), { wrapper });
    expect(result.current.people).toBeUndefined();
    expect(result.current.loading).toBe(false);
    expect(mockState.rpcCalls).toHaveLength(0);
  });

  it('loads people for a signed-in user', async () => {
    mockState.matchPeople = rows;
    const { result } = await renderHook(() => useMatchPeople('m1', 'u1'), { wrapper });
    await waitFor(() => expect(result.current.people?.viewerRole).toBe('organiser'));
    expect(result.current.failed).toBe(false);
  });

  it('reports a failure to load', async () => {
    mockState.joinError = 'unknown';
    const { result } = await renderHook(() => useMatchPeople('m1', 'u1'), { wrapper });
    await waitFor(() => expect(result.current.failed).toBe(true));
  });

  it('requests, withdraws and decides through the repository and refreshes people afterwards', async () => {
    mockState.matchPeople = rows;
    const { result } = await renderHook(
      () => ({
        people: useMatchPeople('m1', 'u1'),
        request: useRequestToJoin(),
        withdraw: useWithdrawRequest(),
        decide: useDecideRequest(),
      }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.people.people).toBeTruthy());
    const loads = () => mockState.rpcCalls.filter((c) => c.name === 'match_people').length;
    const before = loads();

    await act(async () => {
      await result.current.request.mutateAsync('m1');
    });
    await waitFor(() => expect(loads()).toBeGreaterThan(before));

    await act(async () => {
      await result.current.withdraw.mutateAsync('m1');
      await result.current.decide.mutateAsync({ requestId: 'r1', accept: false });
    });
    expect(mockState.rpcCalls.map((c) => c.name)).toEqual(
      expect.arrayContaining(['request_to_join', 'withdraw_join_request', 'decide_join_request']),
    );
  });

  it('surfaces a coded error from a failed request', async () => {
    mockState.joinError = 'email_not_confirmed';
    const { result } = await renderHook(() => useRequestToJoin(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync('m1').catch(() => {});
    });
    await waitFor(() => expect(result.current.error).toMatchObject({ code: 'email_not_confirmed' }));
  });
});
