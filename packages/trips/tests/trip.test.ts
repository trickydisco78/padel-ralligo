import { isPastTrip, MAX_TRIPS, validateTrip } from '../src/domain/trip';

describe('validateTrip', () => {
  it('accepts a valid trip and a one-day trip', () => {
    expect(validateTrip({ destinationId: 'd1', startDate: '2026-02-15', endDate: '2026-02-22' })).toEqual({ ok: true });
    expect(validateTrip({ destinationId: 'd1', startDate: '2026-02-15', endDate: '2026-02-15' })).toEqual({ ok: true });
  });

  it('rejects an end date before the start date', () => {
    const result = validateTrip({ destinationId: 'd1', startDate: '2026-02-15', endDate: '2026-02-14' });
    expect(result.ok ? {} : result.errors).toEqual({ endDate: 'validation.endBeforeStart' });
  });

  it('requires destination and both dates, as translation keys', () => {
    const result = validateTrip({ destinationId: null, startDate: null, endDate: null });
    expect(result.ok ? {} : result.errors).toEqual({
      destinationId: 'validation.destinationRequired',
      startDate: 'validation.startDateRequired',
      endDate: 'validation.endDateRequired',
    });
  });
});

describe('MAX_TRIPS', () => {
  it('is 10', () => expect(MAX_TRIPS).toBe(10));
});

describe('isPastTrip', () => {
  it('is past only once the end date is before today', () => {
    expect(isPastTrip({ endDate: '2026-02-10' }, '2026-02-10')).toBe(false);
    expect(isPastTrip({ endDate: '2026-02-09' }, '2026-02-10')).toBe(true);
  });
});
