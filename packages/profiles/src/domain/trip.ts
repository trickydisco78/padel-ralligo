import { validationResult, type FieldErrors, type IsoDate, type ValidationResult } from '@padel/core';

export type Trip = {
  destinationId: string;
  startDate: IsoDate;
  endDate: IsoDate;
};

export type TripInput = {
  destinationId: string | null;
  startDate: IsoDate | null;
  endDate: IsoDate | null;
};

/** Field errors are translation keys in the `profiles` namespace; none take params. */
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

/** A saved trip only pre-filters Discover until its end date has passed. */
export function isTripActive(trip: { endDate: IsoDate }, today: IsoDate): boolean {
  return trip.endDate >= today;
}

/** The trip if it is still active on `today`, otherwise null. */
export function activeTrip(trip: Trip | null, today: IsoDate): Trip | null {
  return trip && isTripActive(trip, today) ? trip : null;
}
