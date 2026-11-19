import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTranslation } from '@padel/i18n';
import { useSession, SignInPrompt } from '@padel/auth';
import { ListingForm } from '@padel/listings';
import { ThemedText, ThemedView, spacing } from '@padel/ui';

export default function CreateScreen() {
  const { t } = useTranslation('app');
  const { status } = useSession();
  if (status === 'signedOut') return <SignInPrompt message={t('create.signInMessage')} intent={{ type: 'createMatch' }} />;

  return (
    <ThemedView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ padding: spacing.space6, gap: spacing.space4 }}>
            <ThemedText type="display">{t('create.title')}</ThemedText>
            <ListingForm />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}
