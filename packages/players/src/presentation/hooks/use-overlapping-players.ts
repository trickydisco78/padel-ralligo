import { useSession } from '@padel/auth';
import { toIsoDate } from '@padel/core';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useCallback } from 'react';

import { playerRepository } from '../../composition';
import type { OverlapFilters } from '../../domain/player';

const PAGE_SIZE = 50;
/** The server returns nothing from this offset on, so the app never asks for it. */
const MAX_OFFSET = 100;

/** Players sharing a destination and dates with one of the member's trips: 50 at a time, never more than 100. Guests make no request. */
export function useOverlappingPlayers(tripId: string | null, filters: OverlapFilters) {
  const { user } = useSession();
  const userId = user?.id ?? null;

  const query = useInfiniteQuery({
    queryKey: ['overlapping-players', userId ?? 'guest', tripId, filters] as const,
    queryFn: ({ pageParam }) =>
      playerRepository.searchOverlapping(tripId as string, filters, pageParam, toIsoDate(new Date())),
    enabled: tripId !== null && userId !== null,
    initialPageParam: 0,
    getNextPageParam: (last, all) => {
      const next = all.length * PAGE_SIZE;
      return next < MAX_OFFSET && last.total > next ? next : undefined;
    },
  });
  const { refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = query;

  const fetchMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);
  const refetchPlayers = useCallback(() => refetch({ cancelRefetch: false }), [refetch]);

  const pages = query.data?.pages ?? [];
  return {
    players: pages.flatMap((page) => page.players),
    total: pages[0]?.total ?? 0,
    isLoading: query.isLoading,
    failed: query.isError,
    hasMore: !!hasNextPage,
    fetchMore,
    isFetchingMore: isFetchingNextPage,
    refetch: refetchPlayers,
  };
}
