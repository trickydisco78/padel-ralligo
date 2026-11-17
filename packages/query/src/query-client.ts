import { QueryClient, type QueryClientConfig } from '@tanstack/react-query';

/**
 * App-wide QueryClient. Defaults deliberately match the behaviour of the hand-rolled
 * fetching it replaces: no automatic retries (errors surface immediately) and data is
 * refetched whenever a screen mounts.
 */
export function createQueryClient(overrides: { gcTime?: number } = {}) {
  const config: QueryClientConfig = {
    defaultOptions: {
      queries: { retry: false, staleTime: 0, ...overrides },
      mutations: { ...overrides },
    },
  };
  return new QueryClient(config);
}
