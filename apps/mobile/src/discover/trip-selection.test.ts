import type { TripOverview } from '@padel/trips';

import { pickDefaultTrip, resolveSelectedTrip } from './trip-selection';

const trip = (id: string, startDate: string, endDate: string): TripOverview => ({
  id,
  destinationId: 'd',
  destinationName: 'Málaga',
  destinationCountry: 'Spain',
  startDate,
  endDate,
  visibility: 'hidden',
  days: 1,
  overlapPlayers: 0,
});

const soon = trip('soon', '2026-07-02', '2026-07-07');
const later = trip('later', '2026-08-10', '2026-08-15');
const now = trip('now', '2026-06-14', '2026-06-21');

describe('pickDefaultTrip', () => {
  it('prefers the trip under way today', () => {
    expect(pickDefaultTrip([now, soon, later], '2026-06-15')?.id).toBe('now');
  });

  it('counts the first and last day as under way', () => {
    expect(pickDefaultTrip([now, soon], '2026-06-14')?.id).toBe('now');
    expect(pickDefaultTrip([now, soon], '2026-06-21')?.id).toBe('now');
  });

  it('otherwise takes the soonest', () => {
    expect(pickDefaultTrip([soon, later], '2026-06-15')?.id).toBe('soon');
  });

  it('is null without trips', () => {
    expect(pickDefaultTrip([], '2026-06-15')).toBeNull();
  });
});

describe('resolveSelectedTrip', () => {
  it('keeps the chosen trip while it is still upcoming', () => {
    expect(resolveSelectedTrip([soon, later], 'later', '2026-06-15')?.id).toBe('later');
  });

  it('falls back to the default when the chosen trip is gone', () => {
    expect(resolveSelectedTrip([soon, later], 'deleted', '2026-06-15')?.id).toBe('soon');
    expect(resolveSelectedTrip([soon, later], null, '2026-06-15')?.id).toBe('soon');
  });
});
