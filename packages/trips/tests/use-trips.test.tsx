import { SessionProvider } from '@padel/auth';
import { QueryTestProvider } from '@padel/query/testing';
import { mockState, resetMockSupabase } from '@padel/supabase/testing';
import { QueryClient } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { useDeleteTrip, useSaveTrip, useTrips, useTripsOverview } from '../src/presentation/hooks/use-trips';

jest.mock('@padel/supabase', () => jest.requireActual('@padel/supabase/testing'));

const draft = { destinationId: 'm', startDate: '2026-06-14', endDate: '2026-06-21', visibility: 'hidden' as const };
const overviewRow = {
  trip_id: 't1', destination_id: 'm', destination_name: 'Marbella', destination_country: 'Spain',
  start_date: '2026-06-14', end_date: '2026-06-21', visibility: 'hidden', days: 8, overlap_players: 3,
};

const client = () => new QueryClient({ defaultOptions: { queries: { gcTime: Infinity, retry: false } } });
function wrapperFor(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryTestProvider client={queryClient}>
        <SessionProvider>{children}</SessionProvider>
      </QueryTestProvider>
    );
  };
}

beforeEach(() => {
  resetMockSupabase();
  mockState.destinations = [{ id: 'm', name: 'Marbella', country: 'Spain' }];
});

describe('trips hooks', () => {
  it('make no request without a user', async () => {
    const queryClient = client();
    const wrapper = wrapperFor(queryClient);
    const trips = await renderHook(() => useTrips(undefined), { wrapper });
    const overview = await renderHook(() => useTripsOverview(undefined, '2026-06-01'), { wrapper });
    expect(trips.result.current.fetchStatus).toBe('idle');
    expect(overview.result.current).toMatchObject({ trips: [], isLoading: false, failed: false });
    expect(mockState.rpcCalls).toEqual([]);
  });

  it('key the caches by user (and today for the overview)', async () => {
    mockState.tripsOverview = [overviewRow];
    const queryClient = client();
    const wrapper = wrapperFor(queryClient);
    const trips = await renderHook(() => useTrips('user-1'), { wrapper });
    const overview = await renderHook(() => useTripsOverview('user-1', '2026-06-01'), { wrapper });
    await waitFor(() => expect(overview.result.current.isLoading).toBe(false));
    await waitFor(() => expect(trips.result.current.isSuccess).toBe(true));
    expect(queryClient.getQueryCache().find({ queryKey: ['trips', 'user-1'] })).toBeDefined();
    expect(queryClient.getQueryCache().find({ queryKey: ['trips-overview', 'user-1', '2026-06-01'] })).toBeDefined();
    expect(overview.result.current.trips[0]).toMatchObject({ id: 't1', overlapPlayers: 3 });
    expect(mockState.rpcCalls[0]).toEqual({ name: 'my_trips_overview', args: { p_today: '2026-06-01' } });
  });

  it('default today to the device date', async () => {
    const { result } = await renderHook(() => useTripsOverview('user-1'), { wrapper: wrapperFor(client()) });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(mockState.rpcCalls[0]!.args.p_today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('report a failure and recover on refetch', async () => {
    mockState.tripsError = new Error('boom');
    const { result } = await renderHook(() => useTripsOverview('user-1', '2026-06-01'), { wrapper: wrapperFor(client()) });
    await waitFor(() => expect(result.current.failed).toBe(true));
    mockState.tripsError = null;
    mockState.tripsOverview = [overviewRow];
    await act(async () => {
      await result.current.refetch();
    });
    await waitFor(() => expect(result.current.trips).toHaveLength(1));
    expect(result.current.failed).toBe(false);
  });

  it('refresh the list and the overview after a save', async () => {
    const queryClient = client();
    const wrapper = wrapperFor(queryClient);
    const trips = await renderHook(() => useTrips('user-1'), { wrapper });
    const overview = await renderHook(() => useTripsOverview('user-1', '2026-06-01'), { wrapper });
    const save = await renderHook(() => useSaveTrip(), { wrapper });
    await waitFor(() => expect(trips.result.current.data).toEqual([]));
    await waitFor(() => expect(overview.result.current.isLoading).toBe(false));

    mockState.tripsOverview = [overviewRow];
    await act(async () => {
      await save.result.current.mutateAsync({ userId: 'user-1', draft });
    });
    await waitFor(() => expect(trips.result.current.data).toHaveLength(1));
    await waitFor(() => expect(overview.result.current.trips).toHaveLength(1));

    const id = trips.result.current.data![0]!.id;
    await act(async () => {
      await save.result.current.mutateAsync({ userId: 'user-1', draft: { ...draft, id, visibility: 'members' } });
    });
    await waitFor(() => expect(trips.result.current.data![0]!.visibility).toBe('members'));
    expect(mockState.updates.filter((u) => u.table === 'trips')).toHaveLength(1);
  });

  it('refresh the list and the overview after a delete', async () => {
    mockState.trips = [{ id: 'a', profile_id: 'user-1', destination_id: 'm', start_date: '2026-06-14', end_date: '2026-06-21', visibility: 'hidden' }];
    mockState.tripsOverview = [overviewRow];
    const queryClient = client();
    const wrapper = wrapperFor(queryClient);
    const trips = await renderHook(() => useTrips('user-1'), { wrapper });
    const overview = await renderHook(() => useTripsOverview('user-1', '2026-06-01'), { wrapper });
    const remove = await renderHook(() => useDeleteTrip(), { wrapper });
    await waitFor(() => expect(trips.result.current.data).toHaveLength(1));
    await waitFor(() => expect(overview.result.current.trips).toHaveLength(1));

    mockState.tripsOverview = [];
    await act(async () => {
      await remove.result.current.mutateAsync({ userId: 'user-1', id: 'a' });
    });
    await waitFor(() => expect(trips.result.current.data).toEqual([]));
    await waitFor(() => expect(overview.result.current.trips).toEqual([]));
  });
});
