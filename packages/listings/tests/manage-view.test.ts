import type { MatchPeople } from '../src/domain/join-request';
import type { DiscoverListing } from '../src/domain/listing';
import { manageViewFor } from '../src/domain/manage-view';

const people = (viewerRole: MatchPeople['viewerRole']): MatchPeople => ({
  viewerRole,
  ownStatus: null,
  playersNeeded: 2,
  acceptedCount: 0,
  pendingCount: 0,
  people: [],
});
const listing = { id: 'm1' } as DiscoverListing;

const ready = {
  session: 'signedIn',
  listingLoading: false,
  peopleLoading: false,
  failed: false,
  people: people('organiser'),
  listing,
} as const;

describe('manageViewFor', () => {
  it('is ready for the organiser of an open match', () => {
    expect(manageViewFor(ready)).toBe('ready');
  });

  it('waits while the session, the listing or the people are loading', () => {
    expect(manageViewFor({ ...ready, session: 'loading' })).toBe('loading');
    expect(manageViewFor({ ...ready, listingLoading: true })).toBe('loading');
    expect(manageViewFor({ ...ready, peopleLoading: true })).toBe('loading');
  });

  it('sends a guest or a non-organiser away, showing nothing meanwhile', () => {
    expect(manageViewFor({ ...ready, session: 'signedOut', people: undefined })).toBe('forbidden');
    expect(manageViewFor({ ...ready, people: people('member') })).toBe('forbidden');
    expect(manageViewFor({ ...ready, people: people('requester') })).toBe('forbidden');
    expect(manageViewFor({ ...ready, people: null })).toBe('forbidden');
  });

  it('reports a failed or missing people load as an error', () => {
    expect(manageViewFor({ ...ready, failed: true, people: undefined })).toBe('error');
  });

  it('says the match is closed when the organiser has no listing for it', () => {
    expect(manageViewFor({ ...ready, listing: undefined })).toBe('closed');
    expect(manageViewFor({ ...ready, listing: null })).toBe('closed');
  });
});
