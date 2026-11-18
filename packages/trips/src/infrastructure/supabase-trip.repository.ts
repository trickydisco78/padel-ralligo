import type { TypedSupabaseClient } from '@padel/supabase';

import type { TripDraft } from '../domain/trip';
import type { TripRepository } from '../domain/trip.repository';
import { toTrip, toTripOverview } from './trip.mapper';

const values = (draft: TripDraft) => ({
  destination_id: draft.destinationId,
  start_date: draft.startDate,
  end_date: draft.endDate,
  visibility: draft.visibility,
});

export function createSupabaseTripRepository(client: TypedSupabaseClient): TripRepository {
  return {
    async list(userId) {
      const { data, error } = await client
        .from('trips')
        .select('id, destination_id, start_date, end_date, visibility, destinations(name)')
        .eq('profile_id', userId)
        .order('start_date');
      if (error) throw error;
      return (data ?? []).flatMap((row) => toTrip(row) ?? []);
    },

    async create(userId, draft) {
      const { error } = await client.from('trips').insert({ profile_id: userId, ...values(draft) });
      if (error) throw error;
    },

    async update(userId, id, draft) {
      const { error } = await client.from('trips').update(values(draft)).eq('id', id).eq('profile_id', userId);
      if (error) throw error;
    },

    async remove(userId, id) {
      const { error } = await client.from('trips').delete().eq('id', id).eq('profile_id', userId);
      if (error) throw error;
    },

    async overview(today) {
      const { data, error } = await client.rpc('my_trips_overview', { p_today: today });
      if (error) throw error;
      return (data ?? []).flatMap((row) => toTripOverview(row) ?? []);
    },
  };
}
