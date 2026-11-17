import { BottomSheet, SecondaryButton, ThemedText } from '@padel/ui';

import { useOptionalAuthIntent } from '../auth-intent-context';
import { copyForIntent } from '../intent-copy';
import { AccountActions } from './account-actions';

/** The contextual sheet shown when a guest attempts an action that needs an account. */
export function AuthPromptSheet() {
  const state = useOptionalAuthIntent();
  if (!state) return null;

  const { intent, sheetOpen, returnFocusRef, closeSheet, dismissSheet } = state;
  // Keep the last copy while the sheet animates away.
  const copy = intent ? copyForIntent(intent) : null;

  return (
    <BottomSheet
      visible={sheetOpen && copy !== null}
      title={copy?.title ?? ''}
      onDismiss={dismissSheet}
      returnFocusRef={returnFocusRef}>
      <ThemedText themeColor="textSecondary">{copy?.body}</ThemedText>
      <AccountActions intent={intent ?? undefined} onNavigate={closeSheet} />
      <SecondaryButton title="Dismiss" onPress={dismissSheet} />
    </BottomSheet>
  );
}
