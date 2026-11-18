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

/**
 * One open, current match by id. `listing` is `undefined` while loading, `null` when the match is
 * closed, past or does not exist, and `failed` is set when the request itself fails.
 */
export function useDiscoverListing(id: string | undefined) {
  const query = useQuery({
    queryKey: [...discoverKey, id] as const,
    queryFn: () => listingRepository.getDiscoverable(id!),
    enabled: !!id,
  });
  const { refetch } = query;
  const retry = useCallback(() => refetch(), [refetch]);

  return { listing: query.data, loading: query.isPending && !!id, failed: query.isError, refetch: retry };
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
