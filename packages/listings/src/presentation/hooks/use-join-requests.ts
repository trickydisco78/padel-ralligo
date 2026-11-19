import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { joinRequestRepository } from '../../composition';

const allListings = ['listings'] as const;

/**
 * Who the signed-in caller may see on a match, and their role in it. Keyed by user, so one member's
 * view is never served to another; guests never call it (it is disabled without a user).
 */
export function useMatchPeople(listingId: string | undefined, userId: string | undefined) {
  const query = useQuery({
    queryKey: [...allListings, 'people', listingId, userId] as const,
    queryFn: () => joinRequestRepository.getPeople(listingId!),
    enabled: !!listingId && !!userId,
  });
  return {
    /** `undefined` while loading or disabled, `null` when the match does not exist. */
    people: query.data,
    loading: query.isPending && !!listingId && !!userId,
    failed: query.isError,
    refetch: query.refetch,
  };
}

/** Every join action refreshes all listing queries (places left, people, Discover) before it resolves. */
function useRefreshListings() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: allListings });
}

export function useRequestToJoin() {
  const refresh = useRefreshListings();
  return useMutation({
    mutationFn: (listingId: string) => joinRequestRepository.request(listingId),
    onSuccess: refresh,
  });
}

export function useWithdrawRequest() {
  const refresh = useRefreshListings();
  return useMutation({
    mutationFn: (listingId: string) => joinRequestRepository.withdraw(listingId),
    onSuccess: refresh,
  });
}

export function useDecideRequest() {
  const refresh = useRefreshListings();
  return useMutation({
    mutationFn: ({ requestId, accept }: { requestId: string; accept: boolean }) =>
      joinRequestRepository.decide(requestId, accept),
    onSuccess: refresh,
  });
}
