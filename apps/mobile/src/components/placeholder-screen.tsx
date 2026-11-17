import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText, ThemedView, Spacing } from '@padel/ui';

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
