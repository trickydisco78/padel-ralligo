import type { IsoDate } from '@padel/core';
import type { TFunction } from '@padel/i18n';

function utcDate(iso: IsoDate) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y!, m! - 1, d!));
}

/** Weekday, day and month for a calendar date, independent of the device time zone. */
export function dateParts(iso: IsoDate) {
  const date = utcDate(iso);
  const format = (options: Intl.DateTimeFormatOptions) =>
    date.toLocaleDateString('en-GB', { ...options, timeZone: 'UTC' });
  return {
    weekday: format({ weekday: 'short' }).toUpperCase(),
    day: String(date.getUTCDate()),
    month: format({ month: 'short' }).toUpperCase(),
  };
}

export function formatRange(t: TFunction, start: IsoDate, end: IsoDate | null) {
  const from = dateParts(start);
  if (!end || end === start) return `${from.weekday} ${from.day} ${from.month}`;
  const to = dateParts(end);
  return t('dateRange.multiDay', {
    fromDay: from.day,
    fromMonth: from.month,
    toDay: to.day,
    toMonth: to.month,
  });
}
