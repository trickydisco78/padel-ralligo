import type { NewListing } from '../src/domain/listing';
import { toDiscoverListing, toListingColumns, toMyListing } from '../src/infrastructure/listing.mapper';

describe('toMyListing', () => {
  it('maps a row, trimming the time to HH:MM and naming the destination', () => {
    expect(
      toMyListing({
        id: 'l1',
        destination_id: 'm',
        start_date: '2026-02-20',
        end_date: null,
        start_time: '18:30:00',
        venue: 'Club',
        level_wanted: 'Any',
        players_needed: 2,
        description: 'Doubles',
        status: 'open',
        destinations: { name: 'Marbella' },
      }),
    ).toEqual({
      id: 'l1',
      destinationId: 'm',
      destinationName: 'Marbella',
      startDate: '2026-02-20',
      endDate: null,
      startTime: '18:30',
      venue: 'Club',
      levelWanted: 'Any',
      playersNeeded: 2,
      description: 'Doubles',
      status: 'open',
    });
  });

  it('falls back to an empty destination name and no time', () => {
    const listing = toMyListing({
      id: 'l1',
      destination_id: 'm',
      start_date: '2026-02-20',
      end_date: null,
      start_time: null,
      venue: null,
      level_wanted: 'Any',
      players_needed: 1,
      description: '',
      status: 'closed',
      destinations: null,
    });
    expect(listing.destinationName).toBe('');
    expect(listing.startTime).toBeNull();
  });
});

describe('toDiscoverListing', () => {
  const row = {
    id: 'l1',
    destination_id: 'm',
    destination_name: 'Marbella',
    destination_country: 'Spain',
    start_date: '2026-02-20',
    end_date: '2026-02-22',
    start_time: '09:00:00',
    venue: null,
    level_wanted: 'Advanced',
    players_needed: 3,
    description: 'Early game',
    poster_name: 'Leon',
    poster_skill_tier: 'Intermediate',
  };

  it('maps a full row', () => {
    expect(toDiscoverListing(row)).toEqual({
      id: 'l1',
      destinationId: 'm',
      destinationName: 'Marbella',
      destinationCountry: 'Spain',
      startDate: '2026-02-20',
      endDate: '2026-02-22',
      startTime: '09:00',
      venue: null,
      levelWanted: 'Advanced',
      playersNeeded: 3,
      description: 'Early game',
      posterName: 'Leon',
      posterSkillTier: 'Intermediate',
    });
  });

  it('defaults missing optional columns', () => {
    const listing = toDiscoverListing({
      id: 'l1',
      destination_id: 'm',
      start_date: '2026-02-20',
      level_wanted: null,
      players_needed: null,
      poster_name: null,
      poster_skill_tier: null,
    });
    expect(listing).toMatchObject({
      destinationName: '',
      destinationCountry: '',
      levelWanted: 'Any',
      playersNeeded: 0,
      description: '',
      posterName: 'Player',
      posterSkillTier: null,
    });
  });

  it.each([{ ...row, id: null }, { ...row, destination_id: null }, { ...row, start_date: null }])(
    'drops rows missing an id, destination or start date: %j',
    (incomplete) => {
      expect(toDiscoverListing(incomplete)).toBeNull();
    },
  );
});

describe('toListingColumns', () => {
  it('maps a new listing to database columns', () => {
    const listing: NewListing = {
      destinationId: 'm',
      startDate: '2026-02-20',
      endDate: null,
      startTime: '18:30',
      venue: 'Club',
      levelWanted: 'Beginner',
      playersNeeded: 2,
      description: 'Hi',
    };
    expect(toListingColumns(listing)).toEqual({
      destination_id: 'm',
      start_date: '2026-02-20',
      end_date: null,
      start_time: '18:30',
      venue: 'Club',
      level_wanted: 'Beginner',
      players_needed: 2,
      description: 'Hi',
    });
  });
});
