import { useTranslation } from '@padel/i18n';
import { BottomSheet, Button, ThemedText } from '@padel/ui';

import { useOptionalAuthIntent } from '../auth-intent-context';
import { copyKeysForIntent } from '../intent-copy';
import { AccountActions } from './account-actions';

/** The contextual sheet shown when a guest attempts an action that needs an account. */
export function AuthPromptSheet() {
  const { t } = useTranslation('auth');
  const state = useOptionalAuthIntent();
  if (!state) return null;

  const { intent, sheetOpen, returnFocusRef, closeSheet, dismissSheet } = state;
  // Keep the last copy while the sheet animates away.
  const copy = intent ? copyKeysForIntent(intent) : null;

  return (
    <BottomSheet
      visible={sheetOpen && copy !== null}
      title={copy ? t(copy.title) : ''}
      onDismiss={dismissSheet}
      returnFocusRef={returnFocusRef}>
      <ThemedText themeColor="muted">{copy ? t(copy.body) : null}</ThemedText>
      <AccountActions intent={intent ?? undefined} onNavigate={closeSheet} />
      <Button variant="secondary" title={t('actions.dismiss')} onPress={dismissSheet} />
    </BottomSheet>
  );
}
