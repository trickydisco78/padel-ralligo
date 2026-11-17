import { toDestination } from '../src/infrastructure/destination.mapper';

describe('toDestination', () => {
  it('maps a full row to the domain model', () => {
    expect(
      toDestination({ id: 'b', name: 'Barcelona', country: 'Spain', tagline: 'City courts', open_listings: 2 }),
    ).toEqual({ id: 'b', name: 'Barcelona', country: 'Spain', tagline: 'City courts', openListings: 2 });
  });

  it('defaults missing optional columns', () => {
    expect(toDestination({ id: 'b', name: 'Barcelona', country: null, tagline: null, open_listings: null })).toEqual({
      id: 'b',
      name: 'Barcelona',
      country: '',
      tagline: '',
      openListings: 0,
    });
  });

  it.each([{ id: null, name: 'x' }, { id: 'x', name: null }, {}])('drops rows without an id or name: %j', (row) => {
    expect(toDestination(row)).toBeNull();
  });
});
