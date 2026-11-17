import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { tripRepository } from '../../composition';
import type { Trip } from '../../domain/trip';

const tripKey = (userId: string | undefined) => ['trip', userId] as const;

/** The user's saved trip, or null when they have none. */
export function useTrip(userId: string | undefined) {
  return useQuery({
    queryKey: tripKey(userId),
    queryFn: () => tripRepository.get(userId!),
    enabled: !!userId,
  });
}

export function useSaveTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, trip }: { userId: string; trip: Trip }) => tripRepository.save(userId, trip),
    onSuccess: (_data, { userId, trip }) => queryClient.setQueryData(tripKey(userId), trip),
  });
}

export function useClearTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => tripRepository.clear(userId),
    onSuccess: (_data, userId) => queryClient.setQueryData(tripKey(userId), null),
  });
}
