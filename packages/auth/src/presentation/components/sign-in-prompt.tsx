import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText, ThemedView, Spacing } from '@padel/ui';

import type { AuthIntent } from '../../domain/auth-intent';
import { AccountActions } from './account-actions';

type Props = {
  message: string;
  /** Defaults to "Sign in to continue". */
  title?: string;
  /** What the guest was trying to open; kept through sign-in or sign-up so they can be taken back. */
  intent?: AuthIntent;
};

/** Shown in place of an account feature when the visitor is signed out. */
export function SignInPrompt({ message, title = 'Sign in to continue', intent }: Props) {
  return (
    <ThemedView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', padding: Spacing.four, gap: Spacing.three }}>
        <ThemedText type="title">{title}</ThemedText>
        <ThemedText themeColor="textSecondary">{message}</ThemedText>
        <AccountActions intent={intent} />
      </SafeAreaView>
    </ThemedView>
  );
}
