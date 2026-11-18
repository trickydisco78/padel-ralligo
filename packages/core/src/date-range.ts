import type { IsoDate } from "./types";

function parts(date: IsoDate) {
  const [year, month, day] = date.split("-").map(Number) as [number, number, number];
  return { year, month, day, at: new Date(Date.UTC(year, month - 1, day)) };
}

function monthName(at: Date, locale: string) {
  return new Intl.DateTimeFormat(locale, { month: "short", timeZone: "UTC" }).format(at);
}

/** Whole days from `start` to `end`, counting both ends: 14 to 21 June is 8. */
export function inclusiveDays(start: IsoDate, end: IsoDate): number {
  return Math.round((parts(end).at.getTime() - parts(start).at.getTime()) / 86_400_000) + 1;
}

/**
 * A short range for cards: "Jun 14" for one day, "Jun 14–21" within a month, "Jun 28 – Jul 3" across
 * months and "Dec 30, 2026 – Jan 2, 2027" across years. This is the one place that words dates this way.
 */
export function formatDateRange(start: IsoDate, end: IsoDate, locale = "en-US"): string {
  const a = parts(start);
  const b = parts(end);
  const first = `${monthName(a.at, locale)} ${a.day}`;
  if (start === end) return first;
  if (a.year !== b.year) return `${first}, ${a.year} – ${monthName(b.at, locale)} ${b.day}, ${b.year}`;
  if (a.month !== b.month) return `${first} – ${monthName(b.at, locale)} ${b.day}`;
  return `${first}–${b.day}`;
}
