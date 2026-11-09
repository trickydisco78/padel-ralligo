import { isTripActive, type IsoDate, type Trip } from '@repo/core';

import { supabase } from '@/lib/supabase';

export async function fetchTrip(userId: string): Promise<Trip | null> {
  const { data, error } = await supabase
    .from('profile_trips')
    .select('destination_id, start_date, end_date')
    .eq('profile_id', userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return { destinationId: data.destination_id, startDate: data.start_date, endDate: data.end_date };
}

export async function saveTrip(userId: string, trip: Trip) {
  const { error } = await supabase.from('profile_trips').upsert({
    profile_id: userId,
    destination_id: trip.destinationId,
    start_date: trip.startDate,
    end_date: trip.endDate,
  });
  if (error) throw error;
}

export async function clearTrip(userId: string) {
  const { error } = await supabase.from('profile_trips').delete().eq('profile_id', userId);
  if (error) throw error;
}

/** A saved trip only pre-filters Discover until its end date has passed. */
export function activeTrip(trip: Trip | null, today: IsoDate): Trip | null {
  return trip && isTripActive(trip, today) ? trip : null;
}
