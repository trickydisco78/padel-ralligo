import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTranslation } from '@padel/i18n';
import { useSession, SignInPrompt } from '@padel/auth';
import { ProfileForm, ProfileView, useProfileScreen } from '@padel/profiles';
import { TripsSection } from '@padel/trips';
import { MyListings } from '@padel/listings';
import { Button, ThemedText, ThemedView, spacing } from '@padel/ui';

export default function ProfileScreen() {
  const { t } = useTranslation('app');
  const { status, user, signOut } = useSession();
  const router = useRouter();
  const userId = user?.id;
  const { view, profile, mode, events } = useProfileScreen(userId, status);

  // Tabs stay mounted, so leaving one does not reset it; come back to the view, not a half-edited form.
  const { leave } = events;
  useFocusEffect(useCallback(() => leave, [leave]));

  if (view === 'guest') {
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
            contentContainerStyle={{ padding: spacing.space6, gap: spacing.space6 }}>
            <ThemedText type="display">{t('profile.title')}</ThemedText>
            {view !== 'ready' ? null : mode === 'editing' ? (
              <ProfileForm
                key={userId}
                initial={profile}
                submitLabel={t('profile.save')}
                onSaved={events.saved}
                onCancel={events.cancelEdit}
              />
            ) : profile ? (
              <ProfileView profile={profile} onEdit={events.startEdit} />
            ) : (
              <ProfileForm key={userId} initial={null} submitLabel={t('profile.save')} />
            )}
            <TripsSection />
            <MyListings onManage={(id) => router.push({ pathname: '/match/[id]/manage', params: { id } })} />
            <Button
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
