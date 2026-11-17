import { Link, useRouter } from 'expo-router';
import { View } from 'react-native';

import { PrimaryButton, ThemedText, Spacing } from '@padel/ui';

/** Sign in and create-account actions, shown wherever a visitor needs an account. */
export function AccountActions() {
  const router = useRouter();

  return (
    <View style={{ gap: Spacing.three }}>
      <PrimaryButton title="Sign in" onPress={() => router.push('/sign-in')} />
      <Link href="/sign-up">
        <ThemedText type="link" themeColor="primary">
          Create an account
        </ThemedText>
      </Link>
    </View>
  );
}
