import type { Database } from '@padel/supabase';

import type { Trip, TripOverview, TripVisibility } from '../domain/trip';

type TripRow = Pick<Database['public']['Tables']['trips']['Row'], 'id' | 'destination_id' | 'start_date' | 'end_date' | 'visibility'> & {
  destinations: { name: string } | { name: string }[] | null;
};
type OverviewRow = Database['public']['Functions']['my_trips_overview']['Returns'][number];

function toVisibility(value: string): TripVisibility | null {
  return value === 'hidden' || value === 'members' ? value : null;
}

/** Null when the row is not one this app understands (unknown visibility). */
export function toTrip(row: TripRow): Trip | null {
  const visibility = toVisibility(row.visibility);
  if (!visibility) return null;
  const destination = Array.isArray(row.destinations) ? row.destinations[0] : row.destinations;
  return {
    id: row.id,
    destinationId: row.destination_id,
    destinationName: destination?.name ?? '',
    startDate: row.start_date,
    endDate: row.end_date,
    visibility,
  };
}

export function toTripOverview(row: OverviewRow): TripOverview | null {
  const visibility = toVisibility(row.visibility);
  if (!visibility) return null;
  return {
    id: row.trip_id,
    destinationId: row.destination_id,
    destinationName: row.destination_name,
    destinationCountry: row.destination_country,
    startDate: row.start_date,
    endDate: row.end_date,
    visibility,
    days: Number(row.days),
    overlapPlayers: Number(row.overlap_players),
  };
}
