import { toTrip, toTripOverview } from '../src/infrastructure/trip.mapper';

const row = {
  id: 't1',
  destination_id: 'd1',
  start_date: '2026-06-14',
  end_date: '2026-06-21',
  visibility: 'members',
  destinations: { name: 'Marbella' },
};

describe('toTrip', () => {
  it('maps a row with its destination name', () => {
    expect(toTrip(row)).toEqual({
      id: 't1',
      destinationId: 'd1',
      destinationName: 'Marbella',
      startDate: '2026-06-14',
      endDate: '2026-06-21',
      visibility: 'members',
    });
  });

  it('accepts the joined destination as a one-item array', () => {
    expect(toTrip({ ...row, destinations: [{ name: 'Tarifa' }] })?.destinationName).toBe('Tarifa');
  });

  it('drops a row with an unknown visibility', () => {
    expect(toTrip({ ...row, visibility: 'public' })).toBeNull();
  });
});

describe('toTripOverview', () => {
  const overview = {
    trip_id: 't1',
    destination_id: 'd1',
    destination_name: 'Marbella',
    destination_country: 'Spain',
    start_date: '2026-06-14',
    end_date: '2026-06-21',
    visibility: 'hidden',
    days: 8,
    overlap_players: 3,
  };

  it('maps an overview row', () => {
    expect(toTripOverview(overview)).toEqual({
      id: 't1',
      destinationId: 'd1',
      destinationName: 'Marbella',
      destinationCountry: 'Spain',
      startDate: '2026-06-14',
      endDate: '2026-06-21',
      visibility: 'hidden',
      days: 8,
      overlapPlayers: 3,
    });
  });

  it('reads numbers sent as strings and drops unknown visibility', () => {
    expect(toTripOverview({ ...overview, days: '8' as unknown as number })?.days).toBe(8);
    expect(toTripOverview({ ...overview, visibility: 'x' })).toBeNull();
  });
});
