import type { IsoDate, LevelWanted, SkillTier } from '@repo/core';

import { supabase } from '@/lib/supabase';

export type DiscoverListing = {
  id: string;
  destinationId: string;
  destinationName: string;
  startDate: IsoDate;
  endDate: IsoDate | null;
  startTime: string | null;
  venue: string | null;
  levelWanted: LevelWanted;
  playersNeeded: number;
  description: string;
  posterName: string;
  posterSkillTier: SkillTier | null;
};

/** Open, current listings, soonest first. The view already hides closed and past listings. */
export async function fetchDiscoverListings(): Promise<DiscoverListing[]> {
  const { data, error } = await supabase
    .from('discover_listings')
    .select(
      'id, destination_id, destination_name, start_date, end_date, start_time, venue, level_wanted, players_needed, description, poster_name, poster_skill_tier',
    )
    .order('start_date');
  if (error) throw error;

  return (data ?? []).flatMap((row) =>
    row.id && row.destination_id && row.start_date
      ? [
          {
            id: row.id,
            destinationId: row.destination_id,
            destinationName: row.destination_name ?? '',
            startDate: row.start_date,
            endDate: row.end_date,
            startTime: row.start_time ? row.start_time.slice(0, 5) : null,
            venue: row.venue,
            levelWanted: (row.level_wanted ?? 'Any') as LevelWanted,
            playersNeeded: row.players_needed ?? 0,
            description: row.description ?? '',
            posterName: row.poster_name ?? 'Player',
            posterSkillTier: (row.poster_skill_tier as SkillTier | null) ?? null,
          },
        ]
      : [],
  );
}
