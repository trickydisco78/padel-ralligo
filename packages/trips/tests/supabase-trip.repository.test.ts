import type { TypedSupabaseClient } from '@padel/supabase';
import { mockState, resetMockSupabase, supabase as fakeClient } from '@padel/supabase/testing';

import { createSupabaseTripRepository } from '../src/infrastructure/supabase-trip.repository';

const repository = createSupabaseTripRepository(fakeClient as unknown as TypedSupabaseClient);
const draft = { destinationId: 'm', startDate: '2026-06-14', endDate: '2026-06-21', visibility: 'members' as const };

beforeEach(() => {
  resetMockSupabase();
  mockState.destinations = [{ id: 'm', name: 'Marbella', country: 'Spain' }];
});

describe('createSupabaseTripRepository', () => {
  it('lists only the member\'s trips with the destination name', async () => {
    mockState.trips = [
      { id: 'a', profile_id: 'user-1', destination_id: 'm', start_date: '2026-06-14', end_date: '2026-06-21', visibility: 'hidden' },
      { id: 'b', profile_id: 'someone-else', destination_id: 'm', start_date: '2026-06-14', end_date: '2026-06-21', visibility: 'members' },
    ];
    expect(await repository.list('user-1')).toEqual([
      { id: 'a', destinationId: 'm', destinationName: 'Marbella', startDate: '2026-06-14', endDate: '2026-06-21', visibility: 'hidden' },
    ]);
  });

  it('creates a trip for the member', async () => {
    await repository.create('user-1', draft);
    expect(mockState.trips).toEqual([
      expect.objectContaining({ profile_id: 'user-1', destination_id: 'm', start_date: '2026-06-14', end_date: '2026-06-21', visibility: 'members' }),
    ]);
  });

  it('updates only the member\'s own trip', async () => {
    mockState.trips = [
      { id: 'a', profile_id: 'user-1', destination_id: 'm', start_date: '2026-06-14', end_date: '2026-06-21', visibility: 'hidden' },
      { id: 'b', profile_id: 'someone-else', destination_id: 'm', start_date: '2026-06-14', end_date: '2026-06-21', visibility: 'hidden' },
    ];
    await repository.update('user-1', 'b', draft);
    expect(mockState.trips[1]).toMatchObject({ visibility: 'hidden' });
    await repository.update('user-1', 'a', draft);
    expect(mockState.trips[0]).toMatchObject({ visibility: 'members' });
  });

  it('deletes only the member\'s own trip', async () => {
    mockState.trips = [
      { id: 'a', profile_id: 'user-1' },
      { id: 'b', profile_id: 'someone-else' },
    ];
    await repository.remove('user-1', 'b');
    expect(mockState.trips).toHaveLength(2);
    await repository.remove('user-1', 'a');
    expect(mockState.trips).toEqual([{ id: 'b', profile_id: 'someone-else' }]);
  });

  it('reads the overview with today', async () => {
    mockState.tripsOverview = [
      { trip_id: 't1', destination_id: 'm', destination_name: 'Marbella', destination_country: 'Spain', start_date: '2026-06-14', end_date: '2026-06-21', visibility: 'hidden', days: 8, overlap_players: 2 },
      { trip_id: 't2', destination_id: 'm', destination_name: 'Marbella', destination_country: 'Spain', start_date: '2026-06-14', end_date: '2026-06-21', visibility: 'bad', days: 8, overlap_players: 0 },
    ];
    const trips = await repository.overview('2026-06-01');
    expect(mockState.rpcCalls).toEqual([{ name: 'my_trips_overview', args: { p_today: '2026-06-01' } }]);
    expect(trips).toHaveLength(1);
    expect(trips[0]).toMatchObject({ id: 't1', days: 8, overlapPlayers: 2 });
  });

  it('throws on errors', async () => {
    mockState.tripsError = new Error('boom');
    await expect(repository.list('user-1')).rejects.toThrow('boom');
    await expect(repository.create('user-1', draft)).rejects.toThrow('boom');
    await expect(repository.update('user-1', 'a', draft)).rejects.toThrow('boom');
    await expect(repository.remove('user-1', 'a')).rejects.toThrow('boom');
    await expect(repository.overview('2026-06-01')).rejects.toThrow('boom');
  });
});
