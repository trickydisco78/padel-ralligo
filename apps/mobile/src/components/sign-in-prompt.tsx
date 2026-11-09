import { SafeAreaView } from 'react-native-safe-area-context';

import { AccountActions } from '@/components/account-actions';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

/** Shown in place of an account feature when the visitor is signed out. */
export function SignInPrompt({ message }: { message: string }) {
  return (
    <ThemedView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', padding: Spacing.four, gap: Spacing.three }}>
        <ThemedText type="title">Sign in to continue</ThemedText>
        <ThemedText themeColor="textSecondary">{message}</ThemedText>
        <AccountActions />
      </SafeAreaView>
    </ThemedView>
  );
}
