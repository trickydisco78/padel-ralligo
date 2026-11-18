import { validateListing, type ListingInput } from '../src/domain/listing';

const today = '2026-02-10';

const validListing: ListingInput = {
  destinationId: 'd1',
  startDate: '2026-02-15',
  endDate: null,
  levelWanted: 'Any',
  playersNeeded: 2,
  description: 'Friendly doubles',
};

function errorsOf(result: ReturnType<typeof validateListing>) {
  return result.ok ? {} : result.errors;
}

describe('validateListing', () => {
  it('accepts a fixed match', () => {
    expect(validateListing(validListing, today)).toEqual({ ok: true });
  });

  it('accepts a loose invite with a date range', () => {
    expect(validateListing({ ...validListing, endDate: '2026-02-20' }, today)).toEqual({ ok: true });
  });

  it('accepts a start date of today', () => {
    expect(validateListing({ ...validListing, startDate: today }, today)).toEqual({ ok: true });
  });

  it('requires a destination', () => {
    expect(errorsOf(validateListing({ ...validListing, destinationId: null }, today))).toHaveProperty(
      'destinationId',
      'validation.destination',
    );
  });

  it('requires a start date', () => {
    expect(errorsOf(validateListing({ ...validListing, startDate: null }, today))).toHaveProperty(
      'startDate',
    );
  });

  it('rejects a start date in the past', () => {
    expect(
      errorsOf(validateListing({ ...validListing, startDate: '2026-02-09' }, today)),
    ).toHaveProperty('startDate', 'validation.startInPast');
  });

  it('rejects an end date before the start date', () => {
    expect(
      errorsOf(validateListing({ ...validListing, endDate: '2026-02-14' }, today)),
    ).toHaveProperty('endDate', 'validation.endBeforeStart');
  });

  it.each([0, 4, 1.5, -1])('rejects players needed of %s', (playersNeeded) => {
    expect(errorsOf(validateListing({ ...validListing, playersNeeded }, today))).toHaveProperty(
      'playersNeeded',
    );
  });

  it.each([1, 3])('accepts players needed of %s', (playersNeeded) => {
    expect(validateListing({ ...validListing, playersNeeded }, today)).toEqual({ ok: true });
  });

  it('requires players needed', () => {
    expect(
      errorsOf(validateListing({ ...validListing, playersNeeded: null }, today)),
    ).toHaveProperty('playersNeeded');
  });

  it('accepts a description of exactly 500 characters and rejects 501', () => {
    expect(validateListing({ ...validListing, description: 'a'.repeat(500) }, today)).toEqual({
      ok: true,
    });
    expect(
      errorsOf(validateListing({ ...validListing, description: 'a'.repeat(501) }, today)),
    ).toHaveProperty('description', 'validation.descriptionLength');
  });

  it('requires a level wanted', () => {
    expect(errorsOf(validateListing({ ...validListing, levelWanted: null }, today))).toHaveProperty(
      'levelWanted',
    );
  });

  it('reports several errors at once', () => {
    const errors = errorsOf(
      validateListing({ ...validListing, destinationId: null, playersNeeded: 9 }, today),
    );
    expect(Object.keys(errors).sort()).toEqual(['destinationId', 'playersNeeded']);
  });
});
