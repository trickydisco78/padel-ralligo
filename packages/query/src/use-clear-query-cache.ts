import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

/** Returns a stable function that drops every cached query, e.g. when the signed-in user changes. */
export function useClearQueryCache() {
  const client = useQueryClient();
  return useCallback(() => client.clear(), [client]);
}
