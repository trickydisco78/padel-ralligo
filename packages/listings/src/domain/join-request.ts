import type { SkillTier } from '@padel/core';

export type JoinStatus = 'pending' | 'accepted' | 'declined' | 'withdrawn';

/** Who is looking: the organiser, a member who has asked for a place, or any other member. */
export type ViewerRole = 'organiser' | 'requester' | 'member';

export type PersonKind = 'organiser' | 'player' | 'request';

/** A person on a match as the viewer may see them: first name with last initial and skill tier only. */
export type MatchPerson = {
  kind: PersonKind;
  /** Set only for a request the organiser can decide. */
  requestId: string | null;
  name: string;
  skillTier: SkillTier | null;
};

export type MatchPeople = {
  viewerRole: ViewerRole;
  /** The viewer's own request, if they have one. Never anyone else's. */
  ownStatus: JoinStatus | null;
  playersNeeded: number;
  acceptedCount: number;
  /** Organiser only; 0 for everyone else. */
  pendingCount: number;
  /** The organiser first, then accepted players, then (organiser only) pending requests. */
  people: MatchPerson[];
};

/** Stable reasons a join action can fail, raised by the database functions and translated by the app. */
export const JOIN_ERROR_CODES = [
  'not_signed_in',
  'email_not_confirmed',
  'profile_incomplete',
  'not_found',
  'own_match',
  'match_closed',
  'match_past',
  'match_full',
  'already_requested',
  'declined',
  'not_organiser',
  'not_pending',
  'players_below_accepted',
] as const;
export type JoinErrorCode = (typeof JOIN_ERROR_CODES)[number];

export class JoinRequestError extends Error {
  constructor(readonly code: JoinErrorCode | 'unknown') {
    super(code);
    this.name = 'JoinRequestError';
  }
}

/** The error code behind a failed join action, or 'unknown' when it is not one of ours. */
export function joinErrorCode(error: unknown): JoinErrorCode | 'unknown' {
  if (error instanceof JoinRequestError) return error.code;
  const message = error instanceof Error ? error.message : (error as { message?: unknown } | null)?.message;
  return JOIN_ERROR_CODES.find((code) => code === message) ?? 'unknown';
}

/** Players on the match (organiser plus accepted) out of those it wants (organiser plus players needed). */
export function playersProgress(people: Pick<MatchPeople, 'acceptedCount' | 'playersNeeded'>) {
  return { current: 1 + people.acceptedCount, total: 1 + people.playersNeeded };
}

export const placesLeft = (people: Pick<MatchPeople, 'acceptedCount' | 'playersNeeded'>) =>
  Math.max(people.playersNeeded - people.acceptedCount, 0);
