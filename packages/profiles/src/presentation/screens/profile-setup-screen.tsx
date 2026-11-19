import { useTranslation } from '@padel/i18n';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProfileForm } from '../components/profile-form';
import { ThemedText, ThemedView, spacing } from '@padel/ui';

/** Shown after first sign in; saving the profile moves the user on to the tabs. */
export function ProfileSetupScreen() {
  const { t } = useTranslation('profiles');
  return (
    <ThemedView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ padding: spacing.space6, gap: spacing.space4 }}>
            <ThemedText type="display">{t('profileSetup.title')}</ThemedText>
            <ThemedText themeColor="muted">
              {t('profileSetup.intro')}
            </ThemedText>
            <ProfileForm submitLabel={t('profileSetup.submit')} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}
