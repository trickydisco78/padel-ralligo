import type { IsoDate } from "./types";

export type FieldErrors = Record<string, string>;

export type ValidationResult = { ok: true } | { ok: false; errors: FieldErrors };

/** `{ ok: true }` when there are no field errors, otherwise `{ ok: false, errors }`. */
export function validationResult(errors: FieldErrors): ValidationResult {
  return Object.keys(errors).length === 0 ? { ok: true } : { ok: false, errors };
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
