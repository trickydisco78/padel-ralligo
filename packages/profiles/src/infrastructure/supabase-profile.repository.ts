import type { TypedSupabaseClient } from '@padel/supabase';

import type { ProfileRepository } from '../domain/profile.repository';
import { toProfile } from './profile.mapper';

export function createSupabaseProfileRepository(client: TypedSupabaseClient): ProfileRepository {
  return {
    async get(userId) {
      const { data, error } = await client
        .from('profiles')
        .select('display_name, home_city, bio, home_destination_id, discoverable_at, profile_sports(skill_tier)')
        .eq('id', userId)
        .maybeSingle();
      if (error) throw error;
      return data ? toProfile(data) : null;
    },

    async save(userId, input) {
      // Keep the stored timestamp while the switch stays on, so resaving does not reset when they agreed.
      let discoverableAt: string | null = null;
      if (input.discoverable) {
        const { data: existing, error: existingError } = await client
          .from('profiles')
          .select('discoverable_at')
          .eq('id', userId)
          .maybeSingle();
        if (existingError) throw existingError;
        discoverableAt = existing?.discoverable_at ?? new Date().toISOString();
      }

      const { error: profileError } = await client.from('profiles').upsert({
        id: userId,
        display_name: input.displayName.trim(),
        home_city: input.homeCity.trim() || null,
        bio: input.bio,
        home_destination_id: input.homeDestinationId,
        discoverable_at: discoverableAt,
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
