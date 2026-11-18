import { SessionProvider } from '@padel/auth';
import { QueryTestProvider } from '@padel/query/testing';
import { fakeSession, mockState, resetMockSupabase } from '@padel/supabase/testing';
import { QueryClient } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { useOverlappingPlayers } from '../src/presentation/hooks/use-overlapping-players';

jest.mock('@padel/supabase', () => jest.requireActual('@padel/supabase/testing'));

const none = { myLevel: false, thisWeek: false, query: '' };

function rows(count: number, total: number) {
  return Array.from({ length: count }, (_, i) => ({
    player_id: `p${i}`,
    display_name: `p${i}`,
    destination_id: 'd1',
    destination_name: 'Marbella',
    skill_tier: 'Beginner',
    trip_start: '2026-06-17',
    trip_end: '2026-06-23',
    overlap_days: 5,
    total_count: total,
  }));
}

const offsets = () => mockState.rpcCalls.map((c) => c.args.p_offset);

function wrapperFor(client?: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryTestProvider client={client}>
        <SessionProvider>{children}</SessionProvider>
      </QueryTestProvider>
    );
  };
}

beforeEach(() => {
  resetMockSupabase();
  mockState.session = fakeSession('user-1');
});

describe('useOverlappingPlayers', () => {
  it('loads the first page for a member with a trip', async () => {
    mockState.overlapPlayers = rows(3, 3);
    const { result } = await renderHook(() => useOverlappingPlayers('trip-1', none), { wrapper: wrapperFor() });
    await waitFor(() => expect(result.current.players).toHaveLength(3));
    expect(result.current.total).toBe(3);
    expect(result.current.hasMore).toBe(false);
    expect(mockState.rpcCalls[0]!.args).toMatchObject({ p_trip_id: 'trip-1', p_today: expect.stringMatching(/^\d{4}-\d\d-\d\d$/) });
  });

  it('makes no request for a Guest', async () => {
    mockState.session = null;
    mockState.overlapPlayers = rows(3, 3);
    const { result } = await renderHook(() => useOverlappingPlayers('trip-1', none), { wrapper: wrapperFor() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.players).toEqual([]);
    expect(mockState.rpcCalls).toEqual([]);
  });

  it('makes no request without a trip id', async () => {
    const { result } = await renderHook(() => useOverlappingPlayers(null, none), { wrapper: wrapperFor() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.players).toEqual([]);
    expect(mockState.rpcCalls).toEqual([]);
  });

  it('loads a second page at offset 50 only while more exist, and never a third', async () => {
    mockState.overlapPlayers = rows(50, 500);
    const { result } = await renderHook(() => useOverlappingPlayers('trip-1', none), { wrapper: wrapperFor() });
    await waitFor(() => expect(result.current.hasMore).toBe(true));

    await act(async () => result.current.fetchMore());
    await waitFor(() => expect(result.current.players).toHaveLength(100));
    expect(offsets()).toEqual([0, 50]);
    expect(result.current.hasMore).toBe(false);

    await act(async () => result.current.fetchMore());
    expect(offsets()).toEqual([0, 50]);
  });

  it('reports a failure and recovers on refetch', async () => {
    mockState.overlapPlayersError = new Error('boom');
    const { result } = await renderHook(() => useOverlappingPlayers('trip-1', none), { wrapper: wrapperFor() });
    await waitFor(() => expect(result.current.failed).toBe(true));
    mockState.overlapPlayersError = null;
    mockState.overlapPlayers = rows(1, 1);
    await act(async () => {
      await result.current.refetch();
    });
    await waitFor(() => expect(result.current.players).toHaveLength(1));
    expect(result.current.failed).toBe(false);
  });

  it('keys the cache by session, trip and filters', async () => {
    mockState.overlapPlayers = rows(1, 1);
    const client = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity, retry: false } } });
    const filters = { ...none, query: 'jor' };
    const member = await renderHook(() => useOverlappingPlayers('trip-1', filters), { wrapper: wrapperFor(client) });
    await waitFor(() =>
      expect(client.getQueryCache().find({ queryKey: ['overlapping-players', 'user-1', 'trip-1', filters] })).toBeDefined(),
    );
    member.unmount();
  });
});
