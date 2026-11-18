import { validateProfile } from '../src/domain/profile';

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

describe('validateProfile discoverability', () => {
  const valid = { displayName: 'Leon', bio: '', skillTier: 'Intermediate' as const };

  it('allows the switch off without a home destination', () => {
    expect(validateProfile({ ...valid, discoverable: false, homeDestinationId: null })).toEqual({ ok: true });
  });

  it('requires a home destination when the switch is on', () => {
    const result = validateProfile({ ...valid, discoverable: true, homeDestinationId: null });
    expect(result.ok ? {} : result.errors).toEqual({
      homeDestinationId: 'validation.homeDestinationRequired',
    });
    expect(validateProfile({ ...valid, discoverable: true, homeDestinationId: 'd1' })).toEqual({ ok: true });
  });
});
