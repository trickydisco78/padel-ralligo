import { SafeAreaView } from 'react-native-safe-area-context';

import { useTranslation } from '@padel/i18n';
import { ThemedText, ThemedView, Spacing } from '@padel/ui';

export function PlaceholderScreen({ title }: { title: string }) {
  const { t } = useTranslation('app');
  return (
    <ThemedView style={{ flex: 1 }}>
      <SafeAreaView style={{ padding: Spacing.three, gap: Spacing.two }}>
        <ThemedText type="title">{title}</ThemedText>
        <ThemedText themeColor="textSecondary">{t('placeholder.comingSoon')}</ThemedText>
      </SafeAreaView>
    </ThemedView>
  );
}
