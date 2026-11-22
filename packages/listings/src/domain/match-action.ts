import type { JoinStatus } from './join-request';

/** Who is looking. `loading` is a signed-in member whose role has not arrived yet. */
export type MatchViewer = 'guest' | 'loading' | 'organiser' | 'requester' | 'member';

/** The one action the pinned area of a match offers. */
export type MatchAction = 'manage' | 'loading' | 'withdraw' | 'findSimilar' | 'request' | 'none';

type Facts = {
  viewer: MatchViewer;
  /** The member's own request, if any. */
  ownStatus: JoinStatus | null;
  full: boolean;
  started: boolean;
};

/** Decides which action a match shows its viewer. Pure: the component only renders the answer. */
export function matchActionFor({ viewer, ownStatus, full, started }: Facts): MatchAction {
  if (viewer === 'organiser') return 'manage';
  if (viewer === 'loading') return 'loading';
  if (ownStatus === 'pending' || (ownStatus === 'accepted' && !started)) return 'withdraw';
  if (ownStatus === 'declined') return 'findSimilar';
  if (ownStatus === 'accepted') return 'none';
  return full ? 'none' : 'request';
}
