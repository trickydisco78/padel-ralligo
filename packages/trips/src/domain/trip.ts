import { validationResult, type FieldErrors, type IsoDate, type ValidationResult } from '@padel/core';

export type TripVisibility = 'hidden' | 'members';

/** A member's own trip. Past, active and upcoming are derived from the dates, never stored. */
export type Trip = {
  id: string;
  destinationId: string;
  destinationName: string;
  startDate: IsoDate;
  endDate: IsoDate;
  visibility: TripVisibility;
};

/** A saved trip with its length and how many listed players overlap it (from `my_trips_overview`). */
export type TripOverview = {
  id: string;
  destinationId: string;
  destinationName: string;
  destinationCountry: string;
  startDate: IsoDate;
  endDate: IsoDate;
  visibility: TripVisibility;
  days: number;
  overlapPlayers: number;
};

export type TripInput = {
  destinationId: string | null;
  startDate: IsoDate | null;
  endDate: IsoDate | null;
};

/** What a save sends: a valid input plus the sharing choice. `id` is set when editing. */
export type TripDraft = {
  id?: string;
  destinationId: string;
  startDate: IsoDate;
  endDate: IsoDate;
  visibility: TripVisibility;
};

/** A member can keep this many trips; the database refuses the next one too. */
export const MAX_TRIPS = 10;

/** Field errors are translation keys in the `trips` namespace; none take params. */
export function validateTrip(input: TripInput): ValidationResult {
  const errors: FieldErrors = {};

  if (!input.destinationId) errors.destinationId = 'validation.destinationRequired';
  if (!input.startDate) errors.startDate = 'validation.startDateRequired';
  if (!input.endDate) errors.endDate = 'validation.endDateRequired';
  if (input.startDate && input.endDate && input.endDate < input.startDate) {
    errors.endDate = 'validation.endBeforeStart';
  }

  return validationResult(errors);
}

/** A trip is past once its end date is before today. */
export function isPastTrip(trip: { endDate: IsoDate }, today: IsoDate): boolean {
  return trip.endDate < today;
}
