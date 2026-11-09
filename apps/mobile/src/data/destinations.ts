import type { Destination } from '@repo/core';

import { supabase } from '@/lib/supabase';

export type DestinationWithCount = Destination & { openListings: number };

export async function fetchDestinations(): Promise<DestinationWithCount[]> {
  const { data, error } = await supabase
    .from('destinations_with_counts')
    .select('id, name, country, tagline, open_listings')
    .order('name');
  if (error) throw error;

  return (data ?? [])
    .filter((d) => d.id !== null && d.name !== null)
    .map((d) => ({
      id: d.id!,
      name: d.name!,
      country: d.country ?? '',
      tagline: d.tagline ?? '',
      openListings: d.open_listings ?? 0,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
