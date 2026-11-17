import type { Database } from '@padel/supabase';

import type { DestinationWithCount } from '../domain/destination';

export type DestinationRow = Partial<Database['public']['Views']['destinations_with_counts']['Row']>;

/** Maps a `destinations_with_counts` row to the domain model; rows without an id or name are dropped. */
export function toDestination(row: DestinationRow): DestinationWithCount | null {
  if (row.id == null || row.name == null) return null;
  return {
    id: row.id,
    name: row.name,
    country: row.country ?? '',
    tagline: row.tagline ?? '',
    openListings: row.open_listings ?? 0,
  };
}
