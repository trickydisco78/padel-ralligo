import { createQueryClient } from '../src/query-client';

describe('createQueryClient', () => {
  it('does not retry failed queries and always refetches on mount', () => {
    const { queries } = createQueryClient().getDefaultOptions();
    expect(queries?.retry).toBe(false);
    expect(queries?.staleTime).toBe(0);
  });

  it('returns an independent client each time', () => {
    expect(createQueryClient()).not.toBe(createQueryClient());
  });
});
