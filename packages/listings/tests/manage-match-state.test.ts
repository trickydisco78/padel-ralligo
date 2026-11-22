import type { MatchPerson } from '../src/domain/join-request';
import {
  initialManageMatchState,
  isDeciding,
  manageMatchReducer,
  type ManageMatchEvent,
  type ManageMatchState,
} from '../src/domain/manage-match-state';

const david: MatchPerson = { kind: 'request', requestId: 'r1', name: 'David K.', skillTier: 'Beginner' };
const anna: MatchPerson = { kind: 'request', requestId: 'r2', name: 'Anna P.', skillTier: 'Advanced' };

const run = (events: ManageMatchEvent[], from: ManageMatchState = initialManageMatchState) =>
  events.reduce(manageMatchReducer, from);

describe('manageMatchReducer', () => {
  it('starts on the Requests tab with nothing open, nothing in flight and no error', () => {
    expect(initialManageMatchState).toEqual({ tab: 'requests', overlay: { kind: 'none' }, deciding: [], error: null });
  });

  it('switches tab', () => {
    expect(run([{ type: 'TAB_SELECTED', tab: 'players' }]).tab).toBe('players');
  });

  describe('reviewing a request', () => {
    it('opens and dismisses the review sheet', () => {
      const open = run([{ type: 'REVIEW_OPENED', person: david }]);
      expect(open.overlay).toEqual({ kind: 'reviewing', person: david });
      expect(run([{ type: 'REVIEW_DISMISSED' }], open).overlay).toEqual({ kind: 'none' });
    });
  });

  describe('deciding a request', () => {
    it('marks only that request as in flight and clears an earlier error', () => {
      const failed = run([{ type: 'DECISION_STARTED', requestId: 'r1' }, { type: 'DECISION_FAILED', requestId: 'r1', code: 'match_full' }]);
      const state = run([{ type: 'DECISION_STARTED', requestId: 'r2' }], failed);
      expect(state.error).toBeNull();
      expect(isDeciding(state, anna)).toBe(true);
      expect(isDeciding(state, david)).toBe(false);
    });

    it('can have several requests in flight at once, each ending on its own', () => {
      const both = run([{ type: 'DECISION_STARTED', requestId: 'r1' }, { type: 'DECISION_STARTED', requestId: 'r2' }]);
      const one = run([{ type: 'DECISION_SUCCEEDED', requestId: 'r1' }], both);
      expect(isDeciding(one, david)).toBe(false);
      expect(isDeciding(one, anna)).toBe(true);
    });

    it('closes the review sheet when the request it shows has been decided', () => {
      const state = run([
        { type: 'REVIEW_OPENED', person: david },
        { type: 'DECISION_STARTED', requestId: 'r1' },
        { type: 'DECISION_SUCCEEDED', requestId: 'r1' },
      ]);
      expect(state.overlay).toEqual({ kind: 'none' });
      expect(state.deciding).toEqual([]);
    });

    it('leaves the review sheet alone when a different request is decided', () => {
      const state = run([
        { type: 'REVIEW_OPENED', person: david },
        { type: 'DECISION_STARTED', requestId: 'r2' },
        { type: 'DECISION_SUCCEEDED', requestId: 'r2' },
      ]);
      expect(state.overlay).toEqual({ kind: 'reviewing', person: david });
    });

    it('keeps the code of a failed decision, and closes the sheet it came from', () => {
      const state = run([
        { type: 'REVIEW_OPENED', person: david },
        { type: 'DECISION_STARTED', requestId: 'r1' },
        { type: 'DECISION_FAILED', requestId: 'r1', code: 'match_full' },
      ]);
      expect(state.error).toEqual({ kind: 'decide', code: 'match_full' });
      expect(state.overlay).toEqual({ kind: 'none' });
      expect(state.deciding).toEqual([]);
    });
  });

  describe('closing the match', () => {
    it('asks first, and keeping the match open dismisses the question', () => {
      const asking = run([{ type: 'CLOSE_REQUESTED' }]);
      expect(asking.overlay).toEqual({ kind: 'confirmingClose', busy: false });
      expect(run([{ type: 'CLOSE_DISMISSED' }], asking).overlay).toEqual({ kind: 'none' });
    });

    it('stays open and busy while closing, then dismisses on success', () => {
      const busy = run([{ type: 'CLOSE_REQUESTED' }, { type: 'CLOSE_STARTED' }]);
      expect(busy.overlay).toEqual({ kind: 'confirmingClose', busy: true });
      expect(run([{ type: 'CLOSE_SUCCEEDED' }], busy).overlay).toEqual({ kind: 'none' });
    });

    it('dismisses and reports a failure to close', () => {
      const state = run([{ type: 'CLOSE_REQUESTED' }, { type: 'CLOSE_STARTED' }, { type: 'CLOSE_FAILED' }]);
      expect(state.overlay).toEqual({ kind: 'none' });
      expect(state.error).toEqual({ kind: 'close' });
    });

    it('clears an earlier error when a new close starts', () => {
      const state = run([{ type: 'DECISION_FAILED', requestId: 'r1', code: 'unknown' }, { type: 'CLOSE_REQUESTED' }, { type: 'CLOSE_STARTED' }]);
      expect(state.error).toBeNull();
    });
  });
});
