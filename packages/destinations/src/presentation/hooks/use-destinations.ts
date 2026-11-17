import { useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';

import { listDestinations } from '../../application/list-destinations';
import { destinationRepository } from '../../composition';

export const destinationsQueryKey = ['destinations'] as const;

export function useDestinations() {
  const query = useQuery({
    queryKey: destinationsQueryKey,
    queryFn: () => listDestinations(destinationRepository),
  });
  const { refetch } = query;
  /** Re-fetches without cancelling a fetch that is already in flight; the identity is stable. */
  const refetchDestinations = useCallback(() => refetch({ cancelRefetch: false }), [refetch]);

  return {
    destinations: query.data ?? null,
    loading: query.isPending,
    failed: query.isError,
    refetch: refetchDestinations,
  };
}
