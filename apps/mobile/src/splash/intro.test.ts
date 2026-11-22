import { introFor } from './intro';

const base = { seen: false, reducedMotion: false, native: true } as const;

describe('introFor', () => {
  it('plays the full intro on the first launch of a native build', () => {
    expect(introFor({ ...base })).toBe('full');
  });

  it('shows the short version once the intro has been seen', () => {
    expect(introFor({ ...base, seen: true })).toBe('short');
  });

  it('shows the short version when the flag could not be read', () => {
    expect(introFor({ ...base, seen: null })).toBe('short');
  });

  it('shows the short version for reduced motion, even on a first launch', () => {
    expect(introFor({ ...base, reducedMotion: true })).toBe('short');
  });

  it('shows the short version off native platforms', () => {
    expect(introFor({ ...base, native: false })).toBe('short');
  });
});
