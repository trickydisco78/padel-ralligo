import type { Database } from '@padel/supabase';

import type { Trip } from '../domain/trip';

type TripRow = Pick<Database['public']['Tables']['profile_trips']['Row'], 'destination_id' | 'start_date' | 'end_date'>;

export function toTrip(row: TripRow): Trip {
  return { destinationId: row.destination_id, startDate: row.start_date, endDate: row.end_date };
}
