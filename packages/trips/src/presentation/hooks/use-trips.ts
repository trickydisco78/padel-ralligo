import { toIsoDate, type IsoDate } from '@padel/core';
import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';

import { tripRepository } from '../../composition';
import type { TripDraft } from '../../domain/trip';

const tripsKey = (userId: string | undefined) => ['trips', userId] as const;
const overviewKey = (userId: string | undefined, today: IsoDate) => ['trips-overview', userId, today] as const;

/** Saving or deleting changes the list and every overlap count, so both are refreshed. */
function invalidateTrips(queryClient: QueryClient, userId: string) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: tripsKey(userId) }),
    queryClient.invalidateQueries({ queryKey: ['trips-overview', userId] }),
  ]);
}

/** The member's own trips (upcoming and ended), soonest first. Disabled without a user. */
export function useTrips(userId: string | undefined) {
  return useQuery({
    queryKey: tripsKey(userId),
    queryFn: () => tripRepository.list(userId!),
    enabled: !!userId,
  });
}

/** Upcoming trips with length and overlap counts. Guests (no user) make no request. */
export function useTripsOverview(userId: string | undefined, today: IsoDate = toIsoDate(new Date())) {
  const query = useQuery({
    queryKey: overviewKey(userId, today),
    queryFn: () => tripRepository.overview(today),
    enabled: !!userId,
  });
  const { refetch } = query;
  return {
    trips: query.data ?? [],
    isLoading: !!userId && query.isPending,
    failed: query.isError,
    refetch: () => refetch({ cancelRefetch: false }),
  };
}

/** Creates the trip, or updates it when the draft has an id. */
export function useSaveTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, draft }: { userId: string; draft: TripDraft }) =>
      draft.id ? tripRepository.update(userId, draft.id, draft) : tripRepository.create(userId, draft),
    onSuccess: (_data, { userId }) => invalidateTrips(queryClient, userId),
  });
}

export function useDeleteTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, id }: { userId: string; id: string }) => tripRepository.remove(userId, id),
    onSuccess: (_data, { userId }) => invalidateTrips(queryClient, userId),
  });
}
