import { Stack } from 'expo-router';
import { ActivityIndicator } from 'react-native';

import { useAppStatus } from '@/session/app-status';
import { ThemedView, Colors } from '@padel/ui';

/**
 * Chooses which screens exist for the user's session and profile state. Visitors browse the tabs
 * and reach the auth screens from them; signed-in users without a profile are held at setup.
 */
export function RootStack() {
  const status = useAppStatus();

  if (status === 'loading') {
    return (
      <ThemedView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={Colors.light.primary} />
      </ThemedView>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={status === 'signedOut' || status === 'ready'}>
        <Stack.Screen name="(tabs)" />
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
