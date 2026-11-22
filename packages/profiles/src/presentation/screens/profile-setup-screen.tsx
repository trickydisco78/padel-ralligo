import { useSession } from '@padel/auth';
import { useTranslation } from '@padel/i18n';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProfileForm } from '../components/profile-form';
import { useProfile } from '../hooks/use-profile';
import { ThemedText, ThemedView, spacing } from '@padel/ui';

/**
 * Shown after first sign in; saving the profile moves the user on to the tabs. Asks only for name, skill level
 * and city, and starts from any profile the member already has so the fields it hides are kept.
 */
export function ProfileSetupScreen({ suggestedName }: { suggestedName?: string }) {
  const { t } = useTranslation('profiles');
  const { user } = useSession();
  const { data: profile, isPending } = useProfile(user?.id);
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
            {user && isPending ? null : (
              <ProfileForm key={user?.id} fields="setup" suggestedName={suggestedName} initial={profile ?? null} submitLabel={t('profileSetup.submit')} />
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}
