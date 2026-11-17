import { useCallback, useMemo, useState, type ReactNode, type RefObject } from 'react';

import { parseAuthIntent, type AuthIntent } from '../domain/auth-intent';
import { AuthIntentContext, useAuthIntent, type AuthIntentValue, type RequestOptions } from './auth-intent-context';
import { AuthPromptSheet } from './components/auth-prompt-sheet';
import { useSession } from './session';

/**
 * Holds the pending authentication intent in memory (never storage) and renders the contextual
 * sheet. Mount it inside `SessionProvider`. It knows no routes: the app decides where an intent leads.
 */
export function AuthIntentProvider({ children }: { children: ReactNode }) {
  const { user } = useSession();
  const userId = user?.id ?? null;

  const [intent, setIntentState] = useState<AuthIntent | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [returnFocusRef, setReturnFocusRef] = useState<RefObject<unknown> | undefined>(undefined);

  // Signing out discards whatever was pending. Adjusted during render, keyed on the user.
  const [previousUserId, setPreviousUserId] = useState(userId);
  if (previousUserId !== userId) {
    setPreviousUserId(userId);
    if (previousUserId && !userId) {
      setIntentState(null);
      setSheetOpen(false);
    }
  }

  const setIntent = useCallback((next: AuthIntent | null) => {
    // Re-validated here so nothing malformed is ever held, whatever the caller passes.
    setIntentState(next === null ? null : parseAuthIntent(next));
  }, []);

  const requestAuth = useCallback((next: AuthIntent, options?: RequestOptions) => {
    const parsed = parseAuthIntent(next);
    if (!parsed) return;
    setIntentState(parsed);
    setReturnFocusRef(options?.returnFocusRef);
    setSheetOpen(true);
  }, []);

  const closeSheet = useCallback(() => setSheetOpen(false), []);

  const clearIntent = useCallback(() => {
    setIntentState(null);
    setSheetOpen(false);
  }, []);

  const value = useMemo<AuthIntentValue>(
    () => ({
      intent,
      sheetOpen,
      returnFocusRef,
      setIntent,
      requestAuth,
      closeSheet,
      dismissSheet: clearIntent,
      clearIntent,
    }),
    [intent, sheetOpen, returnFocusRef, setIntent, requestAuth, closeSheet, clearIntent],
  );

  return (
    <AuthIntentContext.Provider value={value}>
      {children}
      <AuthPromptSheet />
    </AuthIntentContext.Provider>
  );
}

/**
 * Guards a protected action. Returns a function that answers whether to go ahead:
 * `true` for a signed-in user; `false` while the session is still loading (neither proceeding
 * nor prompting); and for a guest it records the intent, opens the sheet and returns `false`.
 */
export function useRequireAuth() {
  const { status } = useSession();
  const { requestAuth } = useAuthIntent();

  return useCallback(
    (intent: AuthIntent, options?: RequestOptions): boolean => {
      if (status === 'signedIn') return true;
      if (status === 'signedOut') requestAuth(intent, options);
      return false;
    },
    [status, requestAuth],
  );
}
