import type { IsoDate, LevelWanted } from '@repo/core';

import { supabase } from '@/lib/supabase';

export type NewListing = {
  destinationId: string;
  startDate: IsoDate;
  endDate: IsoDate | null;
  startTime: string | null;
  venue: string | null;
  levelWanted: LevelWanted;
  playersNeeded: number;
  description: string;
};

export async function createListing(userId: string, listing: NewListing) {
  const { error } = await supabase.from('listings').insert({
    poster_id: userId,
    destination_id: listing.destinationId,
    start_date: listing.startDate,
    end_date: listing.endDate,
    start_time: listing.startTime,
    venue: listing.venue,
    level_wanted: listing.levelWanted,
    players_needed: listing.playersNeeded,
    description: listing.description,
  });
  if (error) throw error;
}

export type MyListing = NewListing & {
  id: string;
  destinationName: string;
  status: 'open' | 'closed';
};

export async function fetchMyListings(userId: string): Promise<MyListing[]> {
  const { data, error } = await supabase
    .from('listings')
    .select(
      'id, destination_id, start_date, end_date, start_time, venue, level_wanted, players_needed, description, status, destinations(name)',
    )
    .eq('poster_id', userId)
    .order('start_date');
  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    destinationId: row.destination_id,
    destinationName: row.destinations?.name ?? '',
    startDate: row.start_date,
    endDate: row.end_date,
    startTime: row.start_time ? row.start_time.slice(0, 5) : null,
    venue: row.venue,
    levelWanted: row.level_wanted as LevelWanted,
    playersNeeded: row.players_needed,
    description: row.description,
    status: row.status as 'open' | 'closed',
  }));
}

export async function updateListing(id: string, listing: NewListing) {
  const { error } = await supabase
    .from('listings')
    .update({
      destination_id: listing.destinationId,
      start_date: listing.startDate,
      end_date: listing.endDate,
      start_time: listing.startTime,
      venue: listing.venue,
      level_wanted: listing.levelWanted,
      players_needed: listing.playersNeeded,
      description: listing.description,
    })
    .eq('id', id);
  if (error) throw error;
}

export async function closeListing(id: string) {
  const { error } = await supabase.from('listings').update({ status: 'closed' }).eq('id', id);
  if (error) throw error;
}
