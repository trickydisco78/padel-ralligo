import { useSession } from '@padel/auth';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useCallback } from 'react';

import { playerRepository } from '../../composition';
import type { PlayerFilters } from '../../domain/player';

const PAGE_SIZE = 50;
/** The server returns nothing from this offset on, so the app never asks for it. */
const MAX_OFFSET = 100;

/** Players matching the filters, 50 at a time and never more than 100 in total. */
export function usePlayers(filters: PlayerFilters) {
  const { user } = useSession();
  const userId = user?.id ?? 'guest';

  const query = useInfiniteQuery({
    queryKey: ['players', userId, filters] as const,
    queryFn: ({ pageParam }) => playerRepository.search(filters, pageParam),
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
    isLoading: query.isPending,
    failed: query.isError,
    hasMore: !!hasNextPage,
    fetchMore,
    isFetchingMore: isFetchingNextPage,
    refetch: refetchPlayers,
  };
}
