import type { TypedSupabaseClient } from '@padel/supabase';
import { mockState, resetMockSupabase, supabase as fakeClient } from '@padel/supabase/testing';

import type { NewListing } from '../src/domain/listing';
import { createSupabaseListingRepository } from '../src/infrastructure/supabase-listing.repository';

const repository = createSupabaseListingRepository(fakeClient as unknown as TypedSupabaseClient);

const listing: NewListing = {
  destinationId: 'm',
  startDate: '2026-02-20',
  endDate: null,
  startTime: null,
  venue: null,
  levelWanted: 'Any',
  playersNeeded: 2,
  description: 'Doubles',
};

beforeEach(resetMockSupabase);

describe('createSupabaseListingRepository', () => {
  it('creates a listing owned by the poster', async () => {
    await repository.create('user-1', listing);
    expect(mockState.inserts).toEqual([
      {
        table: 'listings',
        values: expect.objectContaining({ poster_id: 'user-1', destination_id: 'm', players_needed: 2 }),
      },
    ]);
  });

  it('throws when creating fails', async () => {
    mockState.insertError = { message: 'boom' };
    await expect(repository.create('user-1', listing)).rejects.toEqual({ message: 'boom' });
  });

  it('updates the listing columns for the given id', async () => {
    await repository.update('l1', { ...listing, venue: 'Club' });
    expect(mockState.updates).toEqual([
      { table: 'listings', id: 'l1', values: expect.objectContaining({ venue: 'Club' }) },
    ]);
  });

  it('closes a listing', async () => {
    await repository.close('l1');
    expect(mockState.updates).toEqual([{ table: 'listings', id: 'l1', values: { status: 'closed' } }]);
  });

  it('throws when closing fails', async () => {
    mockState.updateError = { message: 'boom' };
    await expect(repository.close('l1')).rejects.toEqual({ message: 'boom' });
  });

  it('lists the poster’s own listings', async () => {
    mockState.myListings = [
      {
        id: 'l1',
        destination_id: 'm',
        start_date: '2026-02-20',
        end_date: null,
        start_time: '18:30:00',
        venue: null,
        level_wanted: 'Any',
        players_needed: 2,
        description: '',
        status: 'open',
        destinations: { name: 'Marbella' },
      },
    ];
    expect(await repository.listMine('user-1')).toMatchObject([
      { id: 'l1', destinationName: 'Marbella', startTime: '18:30' },
    ]);
  });

  it('lists discoverable listings and drops incomplete rows', async () => {
    mockState.listings = [
      { id: 'l1', destination_id: 'm', destination_name: 'Marbella', start_date: '2026-02-20' },
      { id: null, destination_id: 'm', start_date: '2026-02-21' },
    ];
    const listings = await repository.listDiscoverable();
    expect(listings.map((l) => l.id)).toEqual(['l1']);
  });

  it('throws when discovery fails', async () => {
    mockState.listingsError = { message: 'down' };
    await expect(repository.listDiscoverable()).rejects.toEqual({ message: 'down' });
  });

  describe('getDiscoverable', () => {
    const row = {
      id: 'm1',
      destination_id: 'd1',
      destination_name: 'Marbella',
      destination_country: 'Spain',
      start_date: '2026-02-20',
      level_wanted: 'Any',
      players_needed: 2,
      poster_name: 'Leon',
    };

    it('returns the public match with that id', async () => {
      mockState.listings = [row, { ...row, id: 'm2' }];
      expect(await repository.getDiscoverable('m1')).toMatchObject({
        id: 'm1',
        destinationName: 'Marbella',
        destinationCountry: 'Spain',
        posterName: 'Leon',
      });
    });

    it('returns null for an id the view does not show (closed, past or unknown)', async () => {
      mockState.listings = [row];
      expect(await repository.getDiscoverable('closed-or-missing')).toBeNull();
    });

    it('returns null when the row lacks the fields a match needs', async () => {
      mockState.listings = [{ id: 'm9', destination_id: null, start_date: null }];
      expect(await repository.getDiscoverable('m9')).toBeNull();
    });

    it('treats a malformed id (invalid uuid) as not found rather than a failure', async () => {
      mockState.listingsError = { code: '22P02', message: 'invalid input syntax for type uuid: "nope"' };
      expect(await repository.getDiscoverable('nope')).toBeNull();
    });

    it('throws when the request fails', async () => {
      mockState.listingsError = { message: 'down' };
      await expect(repository.getDiscoverable('m1')).rejects.toEqual({ message: 'down' });
    });

    it('only asks the public view for its permitted columns', async () => {
      const select = jest.fn(() => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }));
      const from = jest.fn(() => ({ select }));
      await createSupabaseListingRepository({ from } as unknown as TypedSupabaseClient).getDiscoverable('m1');

      expect(from).toHaveBeenCalledWith('discover_listings');
      const columns = (select.mock.calls[0] as unknown as [string])[0].split(',').map((column) => column.trim());
      expect(columns).not.toContain('poster_id');
      expect(columns.every((column) => !/email|user_id|poster_id|consent/i.test(column))).toBe(true);
    });
  });
});
