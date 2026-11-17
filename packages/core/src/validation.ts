import type { IsoDate, LevelWanted } from "./types";
import { LEVELS_WANTED } from "./types";

export type FieldErrors = Record<string, string>;

export type ValidationResult = { ok: true } | { ok: false; errors: FieldErrors };

export const MAX_DESCRIPTION_LENGTH = 500;
export const MIN_PLAYERS_NEEDED = 1;
export const MAX_PLAYERS_NEEDED = 3;

/** `{ ok: true }` when there are no field errors, otherwise `{ ok: false, errors }`. */
export function validationResult(errors: FieldErrors): ValidationResult {
  return Object.keys(errors).length === 0 ? { ok: true } : { ok: false, errors };
}

const result = validationResult;

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

  if (!input.destinationId) errors.destinationId = "Choose a destination";

  if (!input.startDate) {
    errors.startDate = "Choose a start date";
  } else if (input.startDate < today) {
    errors.startDate = "Start date can't be in the past";
  }

  if (input.endDate && input.startDate && input.endDate < input.startDate) {
    errors.endDate = "End date can't be before the start date";
  }

  if (!input.levelWanted || !LEVELS_WANTED.includes(input.levelWanted)) {
    errors.levelWanted = "Choose a level";
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

  return result(errors);
}

/** Returns the date if `text` is a real calendar date written as YYYY-MM-DD, otherwise null. */
export function parseIsoDate(text: string): IsoDate | null {
  const trimmed = text.trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (!match) return null;

  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(Date.UTC(year, month - 1, day));
  const real =
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  return real ? trimmed : null;
}

/** Today's date in the device's local time zone, as YYYY-MM-DD. */
export function toIsoDate(date: Date): IsoDate {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Returns `HH:MM` (24-hour) if `text` is a valid time, otherwise null. */
export function parseTime(text: string): string | null {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(text.trim());
  return match ? `${match[1]}:${match[2]}` : null;
}
