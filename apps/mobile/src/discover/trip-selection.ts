import type { IsoDate } from '@padel/core';
import type { TripOverview } from '@padel/trips';

/**
 * The trip to show first: the one under way today, otherwise the soonest. `trips` is expected soonest
 * first, as `my_trips_overview` returns it. Returns null when there is no upcoming trip.
 */
export function pickDefaultTrip(trips: readonly TripOverview[], today: IsoDate): TripOverview | null {
  const underWay = trips.find((trip) => trip.startDate <= today && today <= trip.endDate);
  return underWay ?? trips[0] ?? null;
}

/** The chosen trip if it is still among the upcoming trips, otherwise the default. */
export function resolveSelectedTrip(
  trips: readonly TripOverview[],
  selectedId: string | null,
  today: IsoDate,
): TripOverview | null {
  return trips.find((trip) => trip.id === selectedId) ?? pickDefaultTrip(trips, today);
}
