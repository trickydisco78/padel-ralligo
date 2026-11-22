/** What the Profile tab shows. `ready` is a signed-in member whose profile has loaded. */
export type ProfileView = 'guest' | 'loading' | 'ready';

type Facts = {
  session: 'loading' | 'signedOut' | 'signedIn';
  profileLoading: boolean;
};

export function profileViewFor({ session, profileLoading }: Facts): ProfileView {
  if (session === 'signedOut') return 'guest';
  if (session === 'loading' || profileLoading) return 'loading';
  return 'ready';
}

export type ProfileMode = 'viewing' | 'editing';

export type ProfileScreenState = { mode: ProfileMode };

export type ProfileScreenEvent =
  | { type: 'EDIT_STARTED' }
  | { type: 'EDIT_CANCELLED' }
  | { type: 'EDIT_SAVED' }
  /** The member has switched to another tab; they come back to the view, not a half-edited form. */
  | { type: 'SCREEN_LEFT' };

export const initialProfileScreenState: ProfileScreenState = { mode: 'viewing' };

const editing: ProfileScreenState = { mode: 'editing' };

export function profileScreenReducer(state: ProfileScreenState, event: ProfileScreenEvent): ProfileScreenState {
  switch (event.type) {
    case 'EDIT_STARTED':
      return state.mode === 'viewing' ? editing : state;
    case 'EDIT_CANCELLED':
    case 'EDIT_SAVED':
    case 'SCREEN_LEFT':
      return state.mode === 'editing' ? initialProfileScreenState : state;
  }
}
