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

export function validateTrip(input: TripInput): ValidationResult {
  const errors: FieldErrors = {};

  if (!input.destinationId) errors.destinationId = 'Choose a destination';
  if (!input.startDate) errors.startDate = 'Choose a start date';
  if (!input.endDate) errors.endDate = 'Choose an end date';
  if (input.startDate && input.endDate && input.endDate < input.startDate) {
    errors.endDate = "End date can't be before the start date";
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
