import { Stack } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator } from 'react-native';

import { useAppStatus, type AppStatus } from '@/session/app-status';
import { ThemedView, colors } from '@padel/ui';

/**
 * Chooses which screens exist for the user's session and profile state. Visitors browse the tabs
 * and reach the auth screens from them; signed-in users without a profile are held at setup.
 */
export function RootStack() {
  const current = useAppStatus();

  // The spinner is for the very first status only. Later `loading` moments (for example the profile
  // check right after a guest signs in) keep the previous status, so the screens underneath stay
  // mounted and the user's place, filters and scroll position are not thrown away.
  const [status, setStatus] = useState<AppStatus>(current);
  if (current !== 'loading' && current !== status) setStatus(current);

  if (status === 'loading') {
    return (
      <ThemedView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.pink500} />
      </ThemedView>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={status === 'signedOut' || status === 'ready'}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="match/[id]" />
        <Stack.Screen name="match/[id]/manage" />
      </Stack.Protected>
      <Stack.Protected guard={status === 'signedOut'}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={status === 'needsProfile'}>
        <Stack.Screen name="profile-setup" />
      </Stack.Protected>
    </Stack>
  );
}
