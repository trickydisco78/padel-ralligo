import { deriveSessionStatus } from '../src/domain/session-status';

describe('deriveSessionStatus', () => {
  it('is loading while the stored session is being read', () => {
    expect(deriveSessionStatus(undefined)).toBe('loading');
  });
  it('is signed out with no user', () => {
    expect(deriveSessionStatus(null)).toBe('signedOut');
  });
  it('is signed in with a user', () => {
    expect(deriveSessionStatus({ id: 'u', emailConfirmed: true })).toBe('signedIn');
  });
});
