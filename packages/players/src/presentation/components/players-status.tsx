import { Button, spacing, ThemedText } from '@padel/ui';
import { ActivityIndicator, View } from 'react-native';
import { useTranslation } from '@padel/i18n';

type Props = {
  state: 'loading' | 'empty' | 'error';
  onRetry?: () => void;
  onClearFilters?: () => void;
};

/** What the list shows instead of cards: a spinner, an empty message or an error with a retry. */
export function PlayersStatus({ state, onRetry, onClearFilters }: Props) {
  const { t } = useTranslation('players');

  if (state === 'loading') {
    return (
      <View style={{ padding: spacing.space6, alignItems: 'center' }}>
        <ActivityIndicator accessibilityRole="progressbar" testID="players-loading" />
      </View>
    );
  }
  const empty = state === 'empty';
  return (
    <View style={{ padding: spacing.space6, alignItems: 'center', gap: spacing.space4 }}>
      <ThemedText type="bodyLg" accessibilityRole={empty ? undefined : 'alert'}>
        {t(empty ? 'empty' : 'error')}
      </ThemedText>
      <Button variant="secondary"
        title={t(empty ? 'clearFilters' : 'retry')}
        onPress={() => (empty ? onClearFilters : onRetry)?.()}
      />
    </View>
  );
}
