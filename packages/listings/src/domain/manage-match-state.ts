import type { JoinErrorCode, MatchPerson } from './join-request';

export type ManageTab = 'players' | 'requests';

/** At most one sheet is open. `busy` is the close request being sent, while its sheet stays up. */
export type ManageOverlay =
  | { kind: 'none' }
  | { kind: 'reviewing'; person: MatchPerson }
  | { kind: 'confirmingClose'; busy: boolean };

export type ManageError = { kind: 'decide'; code: JoinErrorCode | 'unknown' } | { kind: 'close' };

/** What the organiser is doing on the Manage screen. The match and its people are server data, held by the queries. */
export type ManageMatchState = {
  tab: ManageTab;
  overlay: ManageOverlay;
  /** Ids of requests with a decision in flight. */
  deciding: readonly string[];
  error: ManageError | null;
};

export type ManageMatchEvent =
  | { type: 'TAB_SELECTED'; tab: ManageTab }
  | { type: 'REVIEW_OPENED'; person: MatchPerson }
  | { type: 'REVIEW_DISMISSED' }
  | { type: 'DECISION_STARTED'; requestId: string }
  | { type: 'DECISION_SUCCEEDED'; requestId: string }
  | { type: 'DECISION_FAILED'; requestId: string; code: JoinErrorCode | 'unknown' }
  | { type: 'CLOSE_REQUESTED' }
  | { type: 'CLOSE_DISMISSED' }
  | { type: 'CLOSE_STARTED' }
  | { type: 'CLOSE_SUCCEEDED' }
  | { type: 'CLOSE_FAILED' };

export const initialManageMatchState: ManageMatchState = {
  tab: 'requests',
  overlay: { kind: 'none' },
  deciding: [],
  error: null,
};

export const isDeciding = (state: ManageMatchState, person: MatchPerson) =>
  person.requestId !== null && state.deciding.includes(person.requestId);

const none: ManageOverlay = { kind: 'none' };

/** Deciding a request ends the review sheet that was showing it. */
function afterDecision(state: ManageMatchState, requestId: string): Pick<ManageMatchState, 'deciding' | 'overlay'> {
  const reviewingThis = state.overlay.kind === 'reviewing' && state.overlay.person.requestId === requestId;
  return { deciding: state.deciding.filter((id) => id !== requestId), overlay: reviewingThis ? none : state.overlay };
}

export function manageMatchReducer(state: ManageMatchState, event: ManageMatchEvent): ManageMatchState {
  switch (event.type) {
    case 'TAB_SELECTED':
      return { ...state, tab: event.tab };
    case 'REVIEW_OPENED':
      return { ...state, overlay: { kind: 'reviewing', person: event.person } };
    case 'REVIEW_DISMISSED':
    case 'CLOSE_DISMISSED':
      return { ...state, overlay: none };
    case 'DECISION_STARTED':
      return { ...state, error: null, deciding: [...state.deciding.filter((id) => id !== event.requestId), event.requestId] };
    case 'DECISION_SUCCEEDED':
      return { ...state, ...afterDecision(state, event.requestId) };
    case 'DECISION_FAILED':
      return { ...state, ...afterDecision(state, event.requestId), error: { kind: 'decide', code: event.code } };
    case 'CLOSE_REQUESTED':
      return { ...state, overlay: { kind: 'confirmingClose', busy: false } };
    case 'CLOSE_STARTED':
      return { ...state, error: null, overlay: { kind: 'confirmingClose', busy: true } };
    case 'CLOSE_SUCCEEDED':
      return { ...state, overlay: none };
    case 'CLOSE_FAILED':
      return { ...state, overlay: none, error: { kind: 'close' } };
  }
}
