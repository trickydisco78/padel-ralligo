import { SessionProvider } from '@padel/auth';
import { QueryTestProvider } from '@padel/query/testing';
import { fakeSession, mockState, resetMockSupabase } from '@padel/supabase/testing';
import { QueryClient } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { usePlayers } from '../src/presentation/hooks/use-players';

jest.mock('@padel/supabase', () => jest.requireActual('@padel/supabase/testing'));

const none = { destinationId: null, level: null, query: '' };

function rows(count: number, total: number, prefix = 'p') {
  return Array.from({ length: count }, (_, i) => ({
    player_id: null,
    display_name: `${prefix}${i}`,
    destination_id: 'd1',
    destination_name: 'Marbella',
    skill_tier: 'Beginner',
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

beforeEach(resetMockSupabase);

describe('usePlayers', () => {
  it('loads the first page', async () => {
    mockState.players = rows(3, 3);
    const { result } = await renderHook(() => usePlayers(none), { wrapper: wrapperFor() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.players).toHaveLength(3);
    expect(result.current.total).toBe(3);
    expect(result.current.hasMore).toBe(false);
  });

  it('loads a second page at offset 50 only while more exist, and never a third', async () => {
    mockState.players = rows(50, 500);
    const { result } = await renderHook(() => usePlayers(none), { wrapper: wrapperFor() });
    await waitFor(() => expect(result.current.hasMore).toBe(true));

    await act(async () => result.current.fetchMore());
    await waitFor(() => expect(result.current.players).toHaveLength(100));
    expect(offsets()).toEqual([0, 50]);
    expect(result.current.hasMore).toBe(false);

    await act(async () => result.current.fetchMore());
    expect(offsets()).toEqual([0, 50]);
  });

  it('reports a failure and recovers on refetch', async () => {
    mockState.playersError = new Error('boom');
    const { result } = await renderHook(() => usePlayers(none), { wrapper: wrapperFor() });
    await waitFor(() => expect(result.current.failed).toBe(true));
    mockState.playersError = null;
    mockState.players = rows(1, 1);
    await act(async () => {
      await result.current.refetch();
    });
    await waitFor(() => expect(result.current.players).toHaveLength(1));
    expect(result.current.failed).toBe(false);
  });

  it('keys the cache by guest or user and by filters', async () => {
    mockState.players = rows(1, 1);
    const client = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity, retry: false } } });
    const guest = await renderHook(() => usePlayers(none), { wrapper: wrapperFor(client) });
    await waitFor(() => expect(guest.result.current.isLoading).toBe(false));
    expect(client.getQueryCache().find({ queryKey: ['players', 'guest', none] })).toBeDefined();
    guest.unmount();

    mockState.session = fakeSession('user-1');
    const filters = { ...none, query: 'spain' };
    const member = await renderHook(() => usePlayers(filters), { wrapper: wrapperFor(client) });
    await waitFor(() =>
      expect(client.getQueryCache().find({ queryKey: ['players', 'user-1', filters] })).toBeDefined(),
    );
    member.unmount();
  });
});
