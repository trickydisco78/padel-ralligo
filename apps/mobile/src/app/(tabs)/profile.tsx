import { useRouter } from 'expo-router';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTranslation } from '@padel/i18n';
import { useSession, SignInPrompt } from '@padel/auth';
import { ProfileForm, TripSection, useProfile } from '@padel/profiles';
import { MyListings } from '@padel/listings';
import { PrimaryButton, ThemedText, ThemedView, Spacing } from '@padel/ui';

export default function ProfileScreen() {
  const { t } = useTranslation('app');
  const { status, user, signOut } = useSession();
  const router = useRouter();
  const userId = user?.id;
  const { data: profile, isPending } = useProfile(userId);

  if (status === 'signedOut') {
    return (
      <SignInPrompt
        title={t('profile.signInTitle')}
        message={t('profile.signInMessage')}
        intent={{ type: 'openProfile' }}
      />
    );
  }

  return (
    <ThemedView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ padding: Spacing.four, gap: Spacing.four }}>
            <ThemedText type="title">{t('profile.title')}</ThemedText>
            {isPending ? null : <ProfileForm key={userId} initial={profile ?? null} submitLabel={t('profile.save')} />}
            <TripSection />
            <MyListings />
            <PrimaryButton
              title={t('profile.signOut')}
              onPress={async () => {
                await signOut();
                router.replace('/');
              }}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}
