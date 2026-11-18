import { isValidMatchId, parseAuthIntent } from '../src/domain/auth-intent';

describe('isValidMatchId', () => {
  it.each(['abc123', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'l1', 'match_1'])('accepts %j', (id) => {
    expect(isValidMatchId(id)).toBe(true);
  });

  it.each(['', ' ', 'a/b', '../etc', 'a b', 'x?y=1', 'x'.repeat(65), 'é', null, undefined, 42, {}])(
    'rejects %j',
    (id) => {
      expect(isValidMatchId(id)).toBe(false);
    },
  );
});

describe('parseAuthIntent', () => {
  it('accepts a join intent with a well-formed match id', () => {
    expect(parseAuthIntent({ type: 'joinMatch', matchId: 'abc-123' })).toEqual({ type: 'joinMatch', matchId: 'abc-123' });
  });

  it.each(['connectPlayer', 'createMatch', 'openMessages', 'openPersonalMatches', 'openProfile'])('accepts the %s intent', (type) => {
    expect(parseAuthIntent({ type })).toEqual({ type });
  });

  it('rejects a join intent without a usable match id', () => {
    expect(parseAuthIntent({ type: 'joinMatch' })).toBeNull();
    expect(parseAuthIntent({ type: 'joinMatch', matchId: '../admin' })).toBeNull();
    expect(parseAuthIntent({ type: 'joinMatch', matchId: 7 })).toBeNull();
  });

  it('rejects unknown types, non-objects and routes', () => {
    expect(parseAuthIntent({ type: 'deleteEverything' })).toBeNull();
    expect(parseAuthIntent({ route: '/profile' })).toBeNull();
    expect(parseAuthIntent('openProfile')).toBeNull();
    expect(parseAuthIntent(null)).toBeNull();
    expect(parseAuthIntent(undefined)).toBeNull();
  });

  it('keeps no player id on a connect intent', () => {
    expect(parseAuthIntent({ type: 'connectPlayer', playerId: 'p1' })).toEqual({ type: 'connectPlayer' });
  });

  it('drops extra properties, including any callback', () => {
    const parsed = parseAuthIntent({ type: 'openProfile', onSuccess: () => {}, route: '/x' });
    expect(parsed).toEqual({ type: 'openProfile' });
  });
});
