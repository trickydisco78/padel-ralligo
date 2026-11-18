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
