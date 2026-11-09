import { deriveStatus } from '@/auth/session';

jest.mock('@/lib/supabase', () => jest.requireActual('@/test/mock-supabase'));

const session = { user: { id: 'u' } } as never;

describe('deriveStatus', () => {
  it('is loading while the stored session is being read', () => {
    expect(deriveStatus(undefined, null)).toBe('loading');
  });
  it('is signed out with no session', () => {
    expect(deriveStatus(null, null)).toBe('signedOut');
  });
  it('is loading while the profile of a signed-in user is being checked', () => {
    expect(deriveStatus(session, null)).toBe('loading');
  });
  it('needs a profile when the profile is incomplete', () => {
    expect(deriveStatus(session, false)).toBe('needsProfile');
  });
  it('is ready when the profile is complete', () => {
    expect(deriveStatus(session, true)).toBe('ready');
  });
});
