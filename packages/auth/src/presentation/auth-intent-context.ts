import { createContext, useContext, type RefObject } from 'react';

import type { AuthIntent } from '../domain/auth-intent';

export type RequestOptions = {
  /** The control that triggered the request; screen-reader focus returns to it if the sheet is dismissed. */
  returnFocusRef?: RefObject<unknown>;
};

export type AuthIntentValue = {
  /** What the guest was trying to do, until they authenticate, dismiss, leave or sign out. */
  intent: AuthIntent | null;
  sheetOpen: boolean;
  returnFocusRef: RefObject<unknown> | undefined;
  /** Records the intent without opening the sheet, for screens that show their own prompt. */
  setIntent: (intent: AuthIntent | null) => void;
  /** Records the intent and opens the contextual sheet. */
  requestAuth: (intent: AuthIntent, options?: RequestOptions) => void;
  /** Hides the sheet and keeps the intent, for when the user moves on to sign in or sign up. */
  closeSheet: () => void;
  /** Hides the sheet and discards the intent. */
  dismissSheet: () => void;
  clearIntent: () => void;
};

export const AuthIntentContext = createContext<AuthIntentValue | null>(null);

/** Like `useAuthIntent`, but returns null outside the provider, for components that also work without one. */
export function useOptionalAuthIntent(): AuthIntentValue | null {
  return useContext(AuthIntentContext);
}

export function useAuthIntent(): AuthIntentValue {
  const value = useContext(AuthIntentContext);
  if (!value) throw new Error('useAuthIntent must be used inside AuthIntentProvider');
  return value;
}
