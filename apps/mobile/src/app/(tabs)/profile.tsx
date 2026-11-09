import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useSession } from '@/auth/session';
import { MyListings } from '@/components/my-listings';
import { PrimaryButton } from '@/components/primary-button';
import { ProfileForm } from '@/components/profile-form';
import { SignInPrompt } from '@/components/sign-in-prompt';
import { TripSection } from '@/components/trip-section';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { fetchProfile, type ProfileData } from '@/data/profile';

export default function ProfileScreen() {
  const { status, user, signOut } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null | undefined>(undefined);
  const userId = user?.id;

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    fetchProfile(userId)
      .then((data) => !cancelled && setProfile(data))
      .catch(() => !cancelled && setProfile(null));
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (status === 'signedOut') return <SignInPrompt message="Sign in to view and edit your profile." />;

  return (
    <ThemedView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ padding: Spacing.four, gap: Spacing.four }}>
            <ThemedText type="title">Profile</ThemedText>
            {profile !== undefined ? (
              <ProfileForm key={userId} initial={profile} submitLabel="Save profile" />
            ) : null}
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
