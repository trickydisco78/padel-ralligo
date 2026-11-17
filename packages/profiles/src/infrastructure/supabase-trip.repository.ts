import type { TypedSupabaseClient } from '@padel/supabase';

import type { TripRepository } from '../domain/trip.repository';
import { toTrip } from './trip.mapper';

export function createSupabaseTripRepository(client: TypedSupabaseClient): TripRepository {
  return {
    async get(userId) {
      const { data, error } = await client
        .from('profile_trips')
        .select('destination_id, start_date, end_date')
        .eq('profile_id', userId)
        .maybeSingle();
      if (error) throw error;
      return data ? toTrip(data) : null;
    },

    async save(userId, trip) {
      const { error } = await client.from('profile_trips').upsert({
        profile_id: userId,
        destination_id: trip.destinationId,
        start_date: trip.startDate,
        end_date: trip.endDate,
      });
      if (error) throw error;
    },

    async clear(userId) {
      const { error } = await client.from('profile_trips').delete().eq('profile_id', userId);
      if (error) throw error;
    },
  };
}
