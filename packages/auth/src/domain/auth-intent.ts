/**
 * What a guest was trying to do when they were asked to sign in. A fixed set of plain values, never a
 * callback or a route, so the app decides where each one leads and nothing can be smuggled in.
 */
export type AuthIntent =
  | { type: 'joinMatch'; matchId: string }
  | { type: 'connectPlayer' }
  | { type: 'createMatch' }
  | { type: 'openMessages' }
  | { type: 'openPersonalMatches' }
  | { type: 'openProfile' };

export type AuthIntentType = AuthIntent['type'];

/** Ids are used to build a route, so they are limited to letters, digits, `-` and `_`. UUIDs pass. */
const MATCH_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

export function isValidMatchId(value: unknown): value is string {
  return typeof value === 'string' && MATCH_ID_PATTERN.test(value);
}

const SIMPLE_INTENTS: readonly AuthIntentType[] = ['connectPlayer', 'createMatch', 'openMessages', 'openPersonalMatches', 'openProfile'];

/** Returns the intent if `value` is a well-formed one, otherwise null. Extra properties are dropped. */
export function parseAuthIntent(value: unknown): AuthIntent | null {
  if (typeof value !== 'object' || value === null) return null;
  const { type } = value as { type?: unknown };

  if (type === 'joinMatch') {
    const { matchId } = value as { matchId?: unknown };
    return isValidMatchId(matchId) ? { type, matchId } : null;
  }
  if (typeof type === 'string' && (SIMPLE_INTENTS as readonly string[]).includes(type)) {
    return { type } as AuthIntent;
  }
  return null;
}
