import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export function PlaceholderScreen({ title }: { title: string }) {
  return (
    <ThemedView style={{ flex: 1 }}>
      <SafeAreaView style={{ padding: Spacing.three, gap: Spacing.two }}>
        <ThemedText type="title">{title}</ThemedText>
        <ThemedText themeColor="textSecondary">Coming soon</ThemedText>
      </SafeAreaView>
    </ThemedView>
  );
}
