import { isTripActive, validateTrip, activeTrip } from '../src/domain/trip';
import { validateProfile } from '../src/domain/profile';

describe('validateTrip', () => {
  it('accepts a valid trip', () => {
    expect(
      validateTrip({ destinationId: 'd1', startDate: '2026-02-15', endDate: '2026-02-22' }),
    ).toEqual({ ok: true });
  });

  it('accepts a one-day trip', () => {
    expect(
      validateTrip({ destinationId: 'd1', startDate: '2026-02-15', endDate: '2026-02-15' }),
    ).toEqual({ ok: true });
  });

  it('rejects an end date before the start date', () => {
    const result = validateTrip({
      destinationId: 'd1',
      startDate: '2026-02-15',
      endDate: '2026-02-14',
    });
    expect(result.ok ? {} : result.errors).toEqual({ endDate: 'validation.endBeforeStart' });
  });

  it('requires destination and both dates', () => {
    const result = validateTrip({ destinationId: null, startDate: null, endDate: null });
    expect(result.ok ? [] : Object.keys(result.errors).sort()).toEqual([
      'destinationId',
      'endDate',
      'startDate',
    ]);
    expect(result.ok ? {} : result.errors).toEqual({
      destinationId: 'validation.destinationRequired',
      startDate: 'validation.startDateRequired',
      endDate: 'validation.endDateRequired',
    });
  });
});

describe('isTripActive', () => {
  it('is active until the end date has passed', () => {
    expect(isTripActive({ endDate: '2026-02-10' }, '2026-02-10')).toBe(true);
    expect(isTripActive({ endDate: '2026-02-09' }, '2026-02-10')).toBe(false);
  });
});

describe('validateProfile', () => {
  const valid = { displayName: 'Leon', bio: '', skillTier: 'Intermediate' as const };

  it('accepts a minimal profile', () => {
    expect(validateProfile(valid)).toEqual({ ok: true });
  });

  it.each(['', ' ', 'A'])('rejects a display name of %j', (displayName) => {
    const result = validateProfile({ ...valid, displayName });
    expect(result.ok ? {} : result.errors).toEqual({ displayName: 'validation.nameLength' });
  });

  it('limits display name to 40 characters', () => {
    expect(validateProfile({ ...valid, displayName: 'a'.repeat(40) })).toEqual({ ok: true });
    const result = validateProfile({ ...valid, displayName: 'a'.repeat(41) });
    expect(result.ok ? {} : result.errors).toEqual({ displayName: 'validation.nameLength' });
  });

  it('limits bio to 300 characters', () => {
    expect(validateProfile({ ...valid, bio: 'a'.repeat(300) })).toEqual({ ok: true });
    const result = validateProfile({ ...valid, bio: 'a'.repeat(301) });
    expect(result.ok ? {} : result.errors).toEqual({ bio: 'validation.bioTooLong' });
  });

  it('limits home city to 80 characters', () => {
    expect(validateProfile({ ...valid, homeCity: 'a'.repeat(80) })).toEqual({ ok: true });
    const result = validateProfile({ ...valid, homeCity: 'a'.repeat(81) });
    expect(result.ok ? {} : result.errors).toEqual({ homeCity: 'validation.homeCityTooLong' });
  });

  it('requires a skill tier', () => {
    const result = validateProfile({ ...valid, skillTier: null });
    expect(result.ok ? {} : result.errors).toEqual({ skillTier: 'validation.skillTierRequired' });
  });
});

describe('activeTrip', () => {
  const trip = { destinationId: 't', startDate: '2026-02-01', endDate: '2026-02-10' };

  it('keeps a trip until its end date has passed', () => {
    expect(activeTrip(trip, '2026-02-10')).toEqual(trip);
    expect(activeTrip(trip, '2026-02-11')).toBeNull();
  });

  it('returns null when there is no trip', () => {
    expect(activeTrip(null, '2026-02-10')).toBeNull();
  });
});
