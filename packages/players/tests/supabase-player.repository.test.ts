import type { TypedSupabaseClient } from '@padel/supabase';
import { mockState, resetMockSupabase, supabase as fakeClient } from '@padel/supabase/testing';

import { createSupabasePlayerRepository } from '../src/infrastructure/supabase-player.repository';

const repository = createSupabasePlayerRepository(fakeClient as unknown as TypedSupabaseClient);
const none = { destinationId: null, level: null, query: '' };

beforeEach(resetMockSupabase);

describe('createSupabasePlayerRepository', () => {
  it('sends empty filters as undefined with the page size and offset', async () => {
    await repository.search(none, 50);
    expect(mockState.rpcCalls).toEqual([
      {
        name: 'search_players',
        args: {
          p_destination_id: undefined,
          p_query: undefined,
          p_level: undefined,
          p_limit: 50,
          p_offset: 50,
        },
      },
    ]);
  });

  it('sends the filters, trimming the query', async () => {
    await repository.search({ destinationId: 'd1', level: 'Beginner', query: '  spain ' }, 0);
    expect(mockState.rpcCalls[0]!.args).toMatchObject({ p_destination_id: 'd1', p_level: 'Beginner', p_query: 'spain' });
  });

  it('maps rows, dropping unknown tiers, and reads the total', async () => {
    mockState.players = [
      { player_id: null, display_name: 'Ana', destination_id: 'd1', destination_name: 'Marbella', skill_tier: 'Beginner', total_count: '2' },
      { player_id: null, display_name: 'Bo', destination_id: 'd1', destination_name: 'Marbella', skill_tier: 'Elite', total_count: '2' },
    ];
    const page = await repository.search(none, 0);
    expect(page.players).toHaveLength(1);
    expect(page.players[0]).toMatchObject({ id: null, displayName: 'Ana' });
    expect(page.total).toBe(2);
  });

  it('returns an empty page', async () => {
    expect(await repository.search(none, 0)).toEqual({ players: [], total: 0 });
  });

  it('throws on an RPC error', async () => {
    mockState.playersError = new Error('boom');
    await expect(repository.search(none, 0)).rejects.toThrow('boom');
  });
});

describe('searchOverlapping', () => {
  const filters = { myLevel: false, thisWeek: false, query: '' };

  it('sends the trip, flags, page size, offset and today, with an empty query as undefined', async () => {
    await repository.searchOverlapping('trip-1', filters, 50, '2026-11-18');
    expect(mockState.rpcCalls).toEqual([
      {
        name: 'find_overlapping_players',
        args: {
          p_trip_id: 'trip-1',
          p_my_level: false,
          p_this_week: false,
          p_query: undefined,
          p_today: '2026-11-18',
          p_limit: 50,
          p_offset: 50,
        },
      },
    ]);
  });

  it('sends the flags and a trimmed query; a blank query is undefined', async () => {
    await repository.searchOverlapping('t', { myLevel: true, thisWeek: true, query: '  jor ' }, 0, '2026-11-18');
    expect(mockState.rpcCalls[0]!.args).toMatchObject({ p_my_level: true, p_this_week: true, p_query: 'jor' });
    await repository.searchOverlapping('t', { ...filters, query: '   ' }, 0, '2026-11-18');
    expect(mockState.rpcCalls[1]!.args.p_query).toBeUndefined();
  });

  it('maps rows, dropping unknown tiers, and reads the total', async () => {
    const r = { player_id: 'p', destination_id: 'd1', destination_name: 'Marbella', trip_start: '2026-06-17', trip_end: '2026-06-23', overlap_days: 5, total_count: '2' };
    mockState.overlapPlayers = [
      { ...r, display_name: 'Ana', skill_tier: 'Beginner' },
      { ...r, display_name: 'Bo', skill_tier: 'Elite' },
    ];
    const page = await repository.searchOverlapping('t', filters, 0, '2026-11-18');
    expect(page.players).toHaveLength(1);
    expect(page.players[0]).toMatchObject({ displayName: 'Ana', tripStart: '2026-06-17', overlapDays: 5 });
    expect(page.total).toBe(2);
  });

  it('returns an empty page', async () => {
    expect(await repository.searchOverlapping('t', filters, 0, '2026-11-18')).toEqual({ players: [], total: 0 });
  });

  it('throws on an RPC error', async () => {
    mockState.overlapPlayersError = new Error('boom');
    await expect(repository.searchOverlapping('t', filters, 0, '2026-11-18')).rejects.toThrow('boom');
  });
});
