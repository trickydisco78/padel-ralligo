import { useQuery, useQueryClient } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import { QueryTestProvider } from '../src/testing';
import { useClearQueryCache } from '../src/use-clear-query-cache';

describe('useClearQueryCache', () => {
  it('drops every cached query', async () => {
    const { result } = await renderHook(
      () => ({
        clear: useClearQueryCache(),
        client: useQueryClient(),
        query: useQuery({ queryKey: ['profile', 'user-a'], queryFn: async () => 'private data' }),
      }),
      { wrapper: QueryTestProvider },
    );
    await waitFor(() => expect(result.current.query.data).toBe('private data'));
    expect(result.current.client.getQueryData(['profile', 'user-a'])).toBe('private data');

    await act(async () => result.current.clear());
    expect(result.current.client.getQueryCache().getAll()).toHaveLength(0);
    expect(result.current.client.getQueryData(['profile', 'user-a'])).toBeUndefined();
  });

  it('returns the same function across renders', async () => {
    const { result, rerender } = await renderHook(() => useClearQueryCache(), { wrapper: QueryTestProvider });
    const first = result.current;
    await rerender({});
    expect(result.current).toBe(first);
  });
});
