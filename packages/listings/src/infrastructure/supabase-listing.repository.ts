import type { TypedSupabaseClient } from '@padel/supabase';

import type { ListingRepository } from '../domain/listing.repository';
import { toDiscoverListing, toListingColumns, toMyListing } from './listing.mapper';

/** The only columns a visitor can read; the view has no user ids, emails or private fields. */
const DISCOVER_COLUMNS =
  'id, destination_id, destination_name, destination_country, start_date, end_date, start_time, venue, level_wanted, players_needed, spots_left, description, poster_name, poster_skill_tier';

/** Postgres error code for a value that is not valid for its type, such as a malformed uuid. */
const INVALID_TEXT_REPRESENTATION = '22P02';

export function createSupabaseListingRepository(client: TypedSupabaseClient): ListingRepository {
  return {
    async create(userId, listing) {
      const { error } = await client.from('listings').insert({ poster_id: userId, ...toListingColumns(listing) });
      if (error) throw error;
    },

    async update(id, listing) {
      const { error } = await client.from('listings').update(toListingColumns(listing)).eq('id', id);
      if (error) throw error;
    },

    async close(id) {
      const { error } = await client.from('listings').update({ status: 'closed' }).eq('id', id);
      if (error) throw error;
    },

    async listMine(userId) {
      const { data, error } = await client
        .from('listings')
        .select(
          'id, destination_id, start_date, end_date, start_time, venue, level_wanted, players_needed, description, status, destinations(name)',
        )
        .eq('poster_id', userId)
        .order('start_date');
      if (error) throw error;
      return (data ?? []).map(toMyListing);
    },

    async listDiscoverable() {
      // The view already hides closed and past listings; full matches (no places left) are hidden here.
      const { data, error } = await client
        .from('discover_listings')
        .select(DISCOVER_COLUMNS)
        .gt('spots_left', 0)
        .order('start_date');
      if (error) throw error;
      return (data ?? []).flatMap((row) => toDiscoverListing(row) ?? []);
    },

    async getDiscoverable(id) {
      // The view hides closed and past listings, so those simply return no row.
      const { data, error } = await client.from('discover_listings').select(DISCOVER_COLUMNS).eq('id', id).maybeSingle();
      // An id that is not a valid uuid (a mistyped or stale link) cannot match anything: that is "not found", not a failure.
      if (error?.code === INVALID_TEXT_REPRESENTATION) return null;
      if (error) throw error;
      return data ? toDiscoverListing(data) : null;
    },
  };
}
