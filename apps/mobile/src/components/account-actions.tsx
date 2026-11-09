import { Link, useRouter } from 'expo-router';
import { View } from 'react-native';

import { PrimaryButton } from '@/components/primary-button';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

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
