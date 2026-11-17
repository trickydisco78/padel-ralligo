import type { TypedSupabaseClient } from '@padel/supabase';

import type { ProfileRepository } from '../domain/profile.repository';
import { toProfile } from './profile.mapper';

export function createSupabaseProfileRepository(client: TypedSupabaseClient): ProfileRepository {
  return {
    async get(userId) {
      const { data, error } = await client
        .from('profiles')
        .select('display_name, home_city, bio, profile_sports(skill_tier)')
        .eq('id', userId)
        .maybeSingle();
      if (error) throw error;
      return data ? toProfile(data) : null;
    },

    async save(userId, input) {
      const { error: profileError } = await client.from('profiles').upsert({
        id: userId,
        display_name: input.displayName.trim(),
        home_city: input.homeCity.trim() || null,
        bio: input.bio,
      });
      if (profileError) throw profileError;

      const { error: skillError } = await client
        .from('profile_sports')
        .upsert({ profile_id: userId, sport: 'padel', skill_tier: input.skillTier });
      if (skillError) throw skillError;
    },

    async isComplete(userId) {
      const { data, error } = await client
        .from('profiles')
        .select('id, profile_sports(skill_tier)')
        .eq('id', userId)
        .maybeSingle();
      if (error) throw error;
      return !!data && data.profile_sports.length > 0;
    },
  };
}
