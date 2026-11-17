import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { profileRepository } from '../../composition';
import type { SaveProfileInput } from '../../domain/profile.repository';

const profileKey = (userId: string | undefined) => ['profile', userId] as const;
const profileCompleteKey = (userId: string | undefined) => ['profile-complete', userId] as const;

/** The signed-in user's profile, or null when they have none yet. */
export function useProfile(userId: string | undefined) {
  return useQuery({
    queryKey: profileKey(userId),
    queryFn: () => profileRepository.get(userId!),
    enabled: !!userId,
  });
}

/** `complete` is null until known; an unreadable profile counts as incomplete so it can be filled in. */
export function useProfileComplete(userId: string | undefined) {
  const query = useQuery({
    queryKey: profileCompleteKey(userId),
    queryFn: () => profileRepository.isComplete(userId!).catch(() => false),
    enabled: !!userId,
  });
  return { complete: query.data ?? null };
}

/** Resolves once the profile and the profile-complete check have been refreshed. */
export function useSaveProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, input }: { userId: string; input: SaveProfileInput }) =>
      profileRepository.save(userId, input),
    onSuccess: (_data, { userId }) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: profileKey(userId) }),
        queryClient.invalidateQueries({ queryKey: ['profile-complete'] }),
      ]),
  });
}
