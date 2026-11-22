import { profileViewFor } from '../src/domain/profile-screen';

describe('profileViewFor', () => {
  it('is guest for a visitor, whatever the profile is doing', () => {
    expect(profileViewFor({ session: 'signedOut', profileLoading: false })).toBe('guest');
    expect(profileViewFor({ session: 'signedOut', profileLoading: true })).toBe('guest');
  });

  it('is loading while the session or the signed-in profile is loading', () => {
    expect(profileViewFor({ session: 'loading', profileLoading: false })).toBe('loading');
    expect(profileViewFor({ session: 'signedIn', profileLoading: true })).toBe('loading');
  });

  it('is ready for a signed-in member whose profile has loaded', () => {
    expect(profileViewFor({ session: 'signedIn', profileLoading: false })).toBe('ready');
  });
});
