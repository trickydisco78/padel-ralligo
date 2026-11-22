import { matchActionFor } from '../src/domain/match-action';

const base = { viewer: 'member', ownStatus: null, full: false, started: false } as const;

describe('matchActionFor', () => {
  it('gives the organiser Manage, whatever else is true', () => {
    expect(matchActionFor({ ...base, viewer: 'organiser', full: true, started: true })).toBe('manage');
  });

  it('holds a disabled request button while the viewer role is loading', () => {
    expect(matchActionFor({ ...base, viewer: 'loading' })).toBe('loading');
  });

  it('lets a member with a pending request withdraw it, even once the match has started', () => {
    expect(matchActionFor({ ...base, ownStatus: 'pending' })).toBe('withdraw');
    expect(matchActionFor({ ...base, ownStatus: 'pending', started: true })).toBe('withdraw');
  });

  it('lets an accepted member withdraw only before the match starts', () => {
    expect(matchActionFor({ ...base, ownStatus: 'accepted' })).toBe('withdraw');
    expect(matchActionFor({ ...base, ownStatus: 'accepted', started: true })).toBe('none');
  });

  it('points a declined member at similar matches', () => {
    expect(matchActionFor({ ...base, ownStatus: 'declined', full: true })).toBe('findSimilar');
  });

  it('offers a request to a guest or a member with no live request while there is room', () => {
    expect(matchActionFor({ ...base, viewer: 'guest' })).toBe('request');
    expect(matchActionFor({ ...base })).toBe('request');
    expect(matchActionFor({ ...base, ownStatus: 'withdrawn' })).toBe('request');
  });

  it('offers nothing on a full match', () => {
    expect(matchActionFor({ ...base, full: true })).toBe('none');
    expect(matchActionFor({ ...base, viewer: 'guest', full: true })).toBe('none');
  });
});
