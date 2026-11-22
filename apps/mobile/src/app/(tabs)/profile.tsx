import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTranslation } from '@padel/i18n';
import { useSession, SignInPrompt } from '@padel/auth';
import { ProfileForm, ProfileView, useProfileScreen } from '@padel/profiles';
import { TripsSection } from '@padel/trips';
import { MyListings } from '@padel/listings';
import { BottomTabInset, Button, ThemedText, ThemedView, spacing } from '@padel/ui';

export default function ProfileScreen() {
  const { t } = useTranslation('app');
  const { status, user, signOut } = useSession();
  const router = useRouter();
  const insets = useSafeAreaInsets();
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

  // The view runs edge to edge so its pink band reaches the top of the screen; everything else is padded.
  const viewing = view === 'ready' && mode === 'viewing' && profile ? profile : null;

  return (
    <ThemedView style={{ flex: 1 }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView keyboardShouldPersistTaps="handled" // The tab bar floats over the content, so leave room under the last item for it.
          contentContainerStyle={{ paddingBottom: insets.bottom + BottomTabInset + spacing.space6 }}>
          {viewing ? (
            <ProfileView profile={viewing} onEdit={events.startEdit} topInset={insets.top} />
          ) : (
            <View style={{ paddingTop: insets.top + spacing.space6, paddingHorizontal: spacing.space6, gap: spacing.space6 }}>
              <ThemedText type="display">{t('profile.title')}</ThemedText>
              {view !== 'ready' ? null : mode === 'editing' ? (
                <ProfileForm
                  key={userId}
                  initial={profile}
                  submitLabel={t('profile.save')}
                  onSaved={events.saved}
                  onCancel={events.cancelEdit}
                />
              ) : (
                <ProfileForm key={userId} initial={null} submitLabel={t('profile.save')} />
              )}
            </View>
          )}
          <View style={{ padding: spacing.space6, gap: spacing.space6 }}>
            <TripsSection />
            <MyListings onManage={(id) => router.push({ pathname: '/match/[id]/manage', params: { id } })} />
            <Button
              title={t('profile.signOut')}
              onPress={async () => {
                await signOut();
                router.replace('/');
              }}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}
