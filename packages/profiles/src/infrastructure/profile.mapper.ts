import type { SkillTier } from '@padel/core';
import type { Database } from '@padel/supabase';

import type { Profile } from '../domain/profile';

type ProfileRow = Pick<Database['public']['Tables']['profiles']['Row'], 'display_name' | 'home_city' | 'bio' | 'home_destination_id' | 'discoverable_at'
> & {
  profile_sports: { skill_tier: string }[];
};

export function toProfile(row: ProfileRow): Profile {
  return {
    displayName: row.display_name,
    homeCity: row.home_city ?? '',
    bio: row.bio,
    homeDestinationId: row.home_destination_id,
    discoverableAt: row.discoverable_at,
    skillTier: (row.profile_sports[0]?.skill_tier as SkillTier | undefined) ?? null,
  };
}
