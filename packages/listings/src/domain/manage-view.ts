import type { MatchPeople } from './join-request';
import type { DiscoverListing } from './listing';

/**
 * What the organiser's Manage screen shows. `forbidden` is a visitor who is about to be redirected to the
 * public details: the screen shows the loading state, never the organiser's data.
 */
export type ManageView = 'loading' | 'forbidden' | 'error' | 'closed' | 'ready';

type Facts = {
  session: 'loading' | 'signedOut' | 'signedIn';
  listingLoading: boolean;
  peopleLoading: boolean;
  failed: boolean;
  /** `undefined` while loading or disabled, `null` when the match does not exist. */
  people: MatchPeople | null | undefined;
  listing: DiscoverListing | null | undefined;
};

export function manageViewFor({ session, listingLoading, peopleLoading, failed, people, listing }: Facts): ManageView {
  if (session === 'loading') return 'loading';
  // A missing match (`null`) is also "not the organiser": the public screen explains it.
  if (session !== 'signedIn' || (people !== undefined && people?.viewerRole !== 'organiser')) return 'forbidden';
  if (listingLoading || peopleLoading) return 'loading';
  if (failed || !people) return 'error';
  if (!listing) return 'closed';
  return 'ready';
}
