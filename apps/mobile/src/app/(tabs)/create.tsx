import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useSession } from '@/auth/session';
import { ListingForm } from '@/components/listing-form';
import { SignInPrompt } from '@/components/sign-in-prompt';
import { ThemedText, ThemedView, Spacing } from '@padel/ui';

export default function CreateScreen() {
  const { status } = useSession();
  if (status === 'signedOut') return <SignInPrompt message="Create an account to post a game and find players." />;

  return (
    <ThemedView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ padding: Spacing.four, gap: Spacing.three }}>
            <ThemedText type="title">Post a game</ThemedText>
            <ListingForm />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}
