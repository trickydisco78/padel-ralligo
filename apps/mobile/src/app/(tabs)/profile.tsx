import { useRouter } from 'expo-router';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useSession, SignInPrompt } from '@padel/auth';
import { ProfileForm, TripSection, useProfile } from '@padel/profiles';
import { MyListings } from '@padel/listings';
import { PrimaryButton, ThemedText, ThemedView, Spacing } from '@padel/ui';

export default function ProfileScreen() {
  const { status, user, signOut } = useSession();
  const router = useRouter();
  const userId = user?.id;
  const { data: profile, isPending } = useProfile(userId);

  if (status === 'signedOut') return <SignInPrompt message="Sign in to view and edit your profile." />;

  return (
    <ThemedView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ padding: Spacing.four, gap: Spacing.four }}>
            <ThemedText type="title">Profile</ThemedText>
            {isPending ? null : <ProfileForm key={userId} initial={profile ?? null} submitLabel="Save profile" />}
            <TripSection />
            <MyListings />
            <PrimaryButton
              title="Sign out"
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
