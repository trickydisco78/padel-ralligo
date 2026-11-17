import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { listingRepository } from '../../composition';
import type { NewListing } from '../../domain/listing';

const allListings = ['listings'] as const;
const discoverKey = [...allListings, 'discover'] as const;
const mineKey = (userId: string | undefined) => [...allListings, 'mine', userId] as const;

/** Open, current listings from every poster, soonest first. */
export function useDiscoverListings() {
  const query = useQuery({ queryKey: discoverKey, queryFn: () => listingRepository.listDiscoverable() });
  const { refetch } = query;
  /** Re-fetches without cancelling a fetch that is already in flight; the identity is stable. */
  const refetchListings = useCallback(() => refetch({ cancelRefetch: false }), [refetch]);

  return { listings: query.data ?? null, failed: query.isError, refetch: refetchListings };
}

export function useMyListings(userId: string | undefined) {
  return useQuery({
    queryKey: mineKey(userId),
    queryFn: () => listingRepository.listMine(userId!),
    enabled: !!userId,
  });
}

/** Every listing mutation refreshes all listing queries before it resolves. */
function useRefreshListings() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: allListings });
}

export function useCreateListing() {
  const refresh = useRefreshListings();
  return useMutation({
    mutationFn: ({ userId, listing }: { userId: string; listing: NewListing }) =>
      listingRepository.create(userId, listing),
    onSuccess: refresh,
  });
}

export function useUpdateListing() {
  const refresh = useRefreshListings();
  return useMutation({
    mutationFn: ({ id, listing }: { id: string; listing: NewListing }) => listingRepository.update(id, listing),
    onSuccess: refresh,
  });
}

export function useCloseListing() {
  const refresh = useRefreshListings();
  return useMutation({
    mutationFn: (id: string) => listingRepository.close(id),
    onSuccess: refresh,
  });
}
