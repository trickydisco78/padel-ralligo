import { useCallback, useMemo, useReducer, useRef } from 'react';

import { joinErrorCode, type MatchPerson } from '../../domain/join-request';
import { manageViewFor } from '../../domain/manage-view';
import { initialManageMatchState, isDeciding, manageMatchReducer, type ManageTab } from '../../domain/manage-match-state';
import { useDecideRequest, useMatchPeople } from './use-join-requests';
import { useCloseListing, useDiscoverListing } from './use-listings';

type Params = {
  listingId: string | undefined;
  session: 'loading' | 'signedOut' | 'signedIn';
  userId: string | undefined;
};

/**
 * Everything the organiser's Manage screen needs: what to show (`view`), the people to show it with, the
 * interaction `state`, and the `events` the screen sends. The screen renders and navigates; this decides.
 * The match and its people stay in the queries; the reducer holds only what the organiser is doing.
 */
export function useManageMatch({ listingId, session, userId }: Params) {
  const { listing, loading: listingLoading, refetch: refetchListing } = useDiscoverListing(listingId);
  const { people, loading: peopleLoading, failed, refetch: refetchPeople } = useMatchPeople(listingId, session === 'signedIn' ? userId : undefined);
  const { mutateAsync: decideAsync } = useDecideRequest();
  const { mutateAsync: closeAsync } = useCloseListing();
  const [state, dispatch] = useReducer(manageMatchReducer, initialManageMatchState);

  // Answers a second tap in the same frame, before a re-render has disabled the buttons.
  const inFlight = useRef(new Set<string>());

  const view = manageViewFor({ session, listingLoading, peopleLoading, failed, people, listing });

  const decideRequest = useCallback(
    async (person: MatchPerson, accept: boolean) => {
      const { requestId } = person;
      if (!requestId || inFlight.current.has(requestId)) return;
      inFlight.current.add(requestId);
      dispatch({ type: 'DECISION_STARTED', requestId });
      try {
        await decideAsync({ requestId, accept });
        dispatch({ type: 'DECISION_SUCCEEDED', requestId });
      } catch (error) {
        dispatch({ type: 'DECISION_FAILED', requestId, code: joinErrorCode(error) });
      } finally {
        inFlight.current.delete(requestId);
      }
    },
    [decideAsync],
  );

  const confirmClose = useCallback(async () => {
    if (!listingId) return;
    dispatch({ type: 'CLOSE_STARTED' });
    try {
      await closeAsync(listingId);
      dispatch({ type: 'CLOSE_SUCCEEDED' });
    } catch {
      dispatch({ type: 'CLOSE_FAILED' });
    }
  }, [closeAsync, listingId]);

  const events = useMemo(
    () => ({
      selectTab: (tab: ManageTab) => dispatch({ type: 'TAB_SELECTED', tab }),
      openReview: (person: MatchPerson) => dispatch({ type: 'REVIEW_OPENED', person }),
      dismissReview: () => dispatch({ type: 'REVIEW_DISMISSED' }),
      accept: (person: MatchPerson) => decideRequest(person, true),
      decline: (person: MatchPerson) => decideRequest(person, false),
      requestClose: () => dispatch({ type: 'CLOSE_REQUESTED' }),
      dismissClose: () => dispatch({ type: 'CLOSE_DISMISSED' }),
      confirmClose,
    }),
    [decideRequest, confirmClose],
  );

  const refresh = useCallback(() => {
    refetchPeople();
    refetchListing();
  }, [refetchPeople, refetchListing]);

  const all = people?.people ?? [];
  return {
    view,
    listing,
    organiser: all.find((p) => p.kind === 'organiser'),
    players: all.filter((p) => p.kind === 'player'),
    requests: all.filter((p) => p.kind === 'request'),
    state,
    isDeciding: (person: MatchPerson) => isDeciding(state, person),
    events,
    /** Re-reads the people and the match; for coming back to the screen. */
    refresh,
    /** Re-reads the people; for the load-failed retry. */
    retry: refetchPeople,
  };
}
