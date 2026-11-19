import { SafeAreaView } from 'react-native-safe-area-context';

import { useTranslation } from '@padel/i18n';
import { ThemedText, ThemedView, spacing } from '@padel/ui';

import type { AuthIntent } from '../../domain/auth-intent';
import { AccountActions } from './account-actions';

type Props = {
  message: string;
  /** Defaults to the translated "Sign in to continue". */
  title?: string;
  /** What the guest was trying to open; kept through sign-in or sign-up so they can be taken back. */
  intent?: AuthIntent;
};

/** Shown in place of an account feature when the visitor is signed out. */
export function SignInPrompt({ message, title, intent }: Props) {
  const { t } = useTranslation('auth');
  return (
    <ThemedView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', padding: spacing.space6, gap: spacing.space4 }}>
        <ThemedText type="display">{title ?? t('prompt.defaultTitle')}</ThemedText>
        <ThemedText themeColor="muted">{message}</ThemedText>
        <AccountActions intent={intent} />
      </SafeAreaView>
    </ThemedView>
  );
}
