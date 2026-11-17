import type { TypedSupabaseClient } from '@padel/supabase';

import type { DestinationRepository } from '../domain/destination.repository';
import { toDestination } from './destination.mapper';

export function createSupabaseDestinationRepository(client: TypedSupabaseClient): DestinationRepository {
  return {
    async list() {
      const { data, error } = await client
        .from('destinations_with_counts')
        .select('id, name, country, tagline, open_listings')
        .order('name');
      if (error) throw error;

      return (data ?? []).flatMap((row) => toDestination(row) ?? []);
    },
  };
}
