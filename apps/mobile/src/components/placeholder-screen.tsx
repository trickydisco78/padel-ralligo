import { SafeAreaView } from 'react-native-safe-area-context';

import { useTranslation } from '@padel/i18n';
import { ThemedText, ThemedView, spacing } from '@padel/ui';

export function PlaceholderScreen({ title }: { title: string }) {
  const { t } = useTranslation('app');
  return (
    <ThemedView style={{ flex: 1 }}>
      <SafeAreaView style={{ padding: spacing.space4, gap: spacing.space2 }}>
        <ThemedText type="display">{title}</ThemedText>
        <ThemedText themeColor="muted">{t('placeholder.comingSoon')}</ThemedText>
      </SafeAreaView>
    </ThemedView>
  );
}
