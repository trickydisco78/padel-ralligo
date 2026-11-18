import type { TypedSupabaseClient } from '@padel/supabase';

import type { PlayerRepository } from '../domain/player.repository';
import { toPlayer, toTotal, type PlayerRow } from './player.mapper';

export const PAGE_SIZE = 50;

export function createSupabasePlayerRepository(client: TypedSupabaseClient): PlayerRepository {
  return {
    async search(filters, offset) {
      const { data, error } = await client.rpc('search_players', {
        p_destination_id: filters.destinationId ?? undefined,
        p_query: filters.query.trim() || undefined,
        p_level: filters.level ?? undefined,
        p_limit: PAGE_SIZE,
        p_offset: offset,
      });
      if (error) throw error;

      const rows = (data ?? []) as PlayerRow[];
      return { players: rows.flatMap((row) => toPlayer(row) ?? []), total: toTotal(rows) };
    },
  };
}
