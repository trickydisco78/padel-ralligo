import type { MatchPeople } from './join-request';

export interface JoinRequestRepository {
  /** Who the signed-in caller may see on a match; null when the match does not exist. */
  getPeople(listingId: string): Promise<MatchPeople | null>;
  /** Asks for a place. Throws a `JoinRequestError` with a stable code when the database refuses. */
  request(listingId: string): Promise<void>;
  /** Withdraws the caller's own pending or accepted request. */
  withdraw(listingId: string): Promise<void>;
  /** The organiser accepts or declines a pending request. */
  decide(requestId: string, accept: boolean): Promise<void>;
}
