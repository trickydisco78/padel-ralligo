import { useMemo, useReducer } from 'react';

import { initialProfileScreenState, profileScreenReducer, profileViewFor } from '../../domain/profile-screen';
import { useProfile } from './use-profile';

/**
 * What the Profile tab needs: what to show (`view`), the member's saved `profile`, whether they are viewing or
 * editing it (`mode`), and the `events` the screen sends. The screen renders and navigates; this decides.
 */
export function useProfileScreen(userId: string | undefined, session: 'loading' | 'signedOut' | 'signedIn') {
  const { data: profile, isPending } = useProfile(userId);
  const [state, dispatch] = useReducer(profileScreenReducer, initialProfileScreenState);

  const events = useMemo(
    () => ({
      startEdit: () => dispatch({ type: 'EDIT_STARTED' }),
      cancelEdit: () => dispatch({ type: 'EDIT_CANCELLED' }),
      saved: () => dispatch({ type: 'EDIT_SAVED' }),
      leave: () => dispatch({ type: 'SCREEN_LEFT' }),
    }),
    [],
  );

  return {
    view: profileViewFor({ session, profileLoading: !!userId && isPending }),
    profile: profile ?? null,
    mode: state.mode,
    events,
  };
}
