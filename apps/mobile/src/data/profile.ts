import type { SkillTier } from '@repo/core';

import { supabase } from '@/lib/supabase';

export type ProfileData = {
  displayName: string;
  homeCity: string;
  bio: string;
  skillTier: SkillTier | null;
};

export async function fetchProfile(userId: string): Promise<ProfileData | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('display_name, home_city, bio, profile_sports(skill_tier)')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  return {
    displayName: data.display_name,
    homeCity: data.home_city ?? '',
    bio: data.bio,
    skillTier: (data.profile_sports[0]?.skill_tier as SkillTier | undefined) ?? null,
  };
}

/** Creates or updates the signed-in user's profile and their padel skill tier. */
export async function saveProfile(userId: string, input: ProfileData & { skillTier: SkillTier }) {
  const { error: profileError } = await supabase.from('profiles').upsert({
    id: userId,
    display_name: input.displayName.trim(),
    home_city: input.homeCity.trim() || null,
    bio: input.bio,
  });
  if (profileError) throw profileError;

  const { error: skillError } = await supabase
    .from('profile_sports')
    .upsert({ profile_id: userId, sport: 'padel', skill_tier: input.skillTier });
  if (skillError) throw skillError;
}
