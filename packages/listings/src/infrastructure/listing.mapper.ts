import type { SkillTier } from '@padel/core';
import type { Database } from '@padel/supabase';

import type { DiscoverListing, LevelWanted, ListingStatus, MyListing, NewListing } from '../domain/listing';

type Tables = Database['public']['Tables'];
type Views = Database['public']['Views'];

/** `HH:MM:SS` from the database to `HH:MM`. */
const toTime = (value: string | null) => (value ? value.slice(0, 5) : null);

export type MyListingRow = Pick<
  Tables['listings']['Row'],
  | 'id'
  | 'destination_id'
  | 'start_date'
  | 'end_date'
  | 'start_time'
  | 'venue'
  | 'level_wanted'
  | 'players_needed'
  | 'description'
  | 'status'
> & { destinations: { name: string } | null };

export function toMyListing(row: MyListingRow): MyListing {
  return {
    id: row.id,
    destinationId: row.destination_id,
    destinationName: row.destinations?.name ?? '',
    startDate: row.start_date,
    endDate: row.end_date,
    startTime: toTime(row.start_time),
    venue: row.venue,
    levelWanted: row.level_wanted as LevelWanted,
    playersNeeded: row.players_needed,
    description: row.description,
    status: row.status as ListingStatus,
  };
}

export type DiscoverRow = Partial<Views['discover_listings']['Row']>;

/** Rows missing an id, destination or start date are dropped. */
export function toDiscoverListing(row: DiscoverRow): DiscoverListing | null {
  if (!row.id || !row.destination_id || !row.start_date) return null;
  return {
    id: row.id,
    destinationId: row.destination_id,
    destinationName: row.destination_name ?? '',
    destinationCountry: row.destination_country ?? '',
    startDate: row.start_date,
    endDate: row.end_date ?? null,
    startTime: toTime(row.start_time ?? null),
    venue: row.venue ?? null,
    levelWanted: (row.level_wanted ?? 'Any') as LevelWanted,
    playersNeeded: row.players_needed ?? 0,
    spotsLeft: row.spots_left ?? row.players_needed ?? 0,
    description: row.description ?? '',
    posterName: row.poster_name ?? 'Player',
    posterSkillTier: (row.poster_skill_tier as SkillTier | null | undefined) ?? null,
  };
}

/** The columns shared by creating and editing a listing. */
export function toListingColumns(listing: NewListing) {
  return {
    destination_id: listing.destinationId,
    start_date: listing.startDate,
    end_date: listing.endDate,
    start_time: listing.startTime,
    venue: listing.venue,
    level_wanted: listing.levelWanted,
    players_needed: listing.playersNeeded,
    description: listing.description,
  };
}
