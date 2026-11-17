import type { TypedSupabaseClient } from '@padel/supabase';
import { mockState, resetMockSupabase, supabase as fakeClient } from '@padel/supabase/testing';

import { createSupabaseDestinationRepository } from '../src/infrastructure/supabase-destination.repository';

const repository = createSupabaseDestinationRepository(fakeClient as unknown as TypedSupabaseClient);

beforeEach(resetMockSupabase);

describe('createSupabaseDestinationRepository', () => {
  it('maps destinations_with_counts rows and drops incomplete ones', async () => {
    mockState.destinations = [
      { id: 'm', name: 'Marbella', country: 'Spain', tagline: 'Sun', open_listings: 3 },
      { id: null, name: 'Broken', country: null, tagline: null, open_listings: null },
    ];
    expect(await repository.list()).toEqual([
      { id: 'm', name: 'Marbella', country: 'Spain', tagline: 'Sun', openListings: 3 },
    ]);
  });

  it('throws when Supabase reports an error', async () => {
    mockState.destinationsError = { message: 'down' };
    await expect(repository.list()).rejects.toEqual({ message: 'down' });
  });
});
