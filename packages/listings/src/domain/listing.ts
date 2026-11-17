import {
  SKILL_TIERS,
  validationResult,
  type FieldErrors,
  type IsoDate,
  type ValidationResult,
} from '@padel/core';

export const LEVELS_WANTED = ['Any', ...SKILL_TIERS] as const;
export type LevelWanted = (typeof LEVELS_WANTED)[number];

export type Sport = 'padel';

export type ListingStatus = 'open' | 'closed';

export type Listing = {
  id: string;
  posterId: string;
  destinationId: string;
  sport: Sport;
  startDate: IsoDate;
  endDate: IsoDate | null;
  startTime: string | null;
  venue: string | null;
  levelWanted: LevelWanted;
  playersNeeded: number;
  description: string;
  status: ListingStatus;
};

/** What a poster enters when creating or editing a listing. */
export type NewListing = {
  destinationId: string;
  startDate: IsoDate;
  endDate: IsoDate | null;
  startTime: string | null;
  venue: string | null;
  levelWanted: LevelWanted;
  playersNeeded: number;
  description: string;
};

/** A listing as its poster sees it. */
export type MyListing = NewListing & {
  id: string;
  destinationName: string;
  status: ListingStatus;
};

/** An open, current listing as shown in Discover and on Home. */
export type DiscoverListing = {
  id: string;
  destinationId: string;
  destinationName: string;
  startDate: IsoDate;
  endDate: IsoDate | null;
  startTime: string | null;
  venue: string | null;
  levelWanted: LevelWanted;
  playersNeeded: number;
  description: string;
  posterName: string;
  posterSkillTier: (typeof SKILL_TIERS)[number] | null;
};

export const MAX_DESCRIPTION_LENGTH = 500;
export const MIN_PLAYERS_NEEDED = 1;
export const MAX_PLAYERS_NEEDED = 3;

export type ListingInput = {
  destinationId: string | null;
  startDate: IsoDate | null;
  endDate: IsoDate | null;
  levelWanted: LevelWanted | null;
  playersNeeded: number | null;
  description: string;
};

/** `today` is passed in so the rule stays pure and testable. */
export function validateListing(input: ListingInput, today: IsoDate): ValidationResult {
  const errors: FieldErrors = {};

  if (!input.destinationId) errors.destinationId = 'Choose a destination';

  if (!input.startDate) {
    errors.startDate = 'Choose a start date';
  } else if (input.startDate < today) {
    errors.startDate = "Start date can't be in the past";
  }

  if (input.endDate && input.startDate && input.endDate < input.startDate) {
    errors.endDate = "End date can't be before the start date";
  }

  if (!input.levelWanted || !LEVELS_WANTED.includes(input.levelWanted)) {
    errors.levelWanted = 'Choose a level';
  }

  const players = input.playersNeeded;
  if (
    players === null ||
    !Number.isInteger(players) ||
    players < MIN_PLAYERS_NEEDED ||
    players > MAX_PLAYERS_NEEDED
  ) {
    errors.playersNeeded = `Players needed must be ${MIN_PLAYERS_NEEDED} to ${MAX_PLAYERS_NEEDED}`;
  }

  if (input.description.length > MAX_DESCRIPTION_LENGTH) {
    errors.description = `Description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer`;
  }

  return validationResult(errors);
}
