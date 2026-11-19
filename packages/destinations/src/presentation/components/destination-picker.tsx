import { useTranslation } from '@padel/i18n';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { borderWidth, colors, HelperText, radius, spacing, ThemedText } from '@padel/ui';
import { useDestinations } from '../hooks/use-destinations';

type Props = {
  value: string | null;
  onChange: (destinationId: string | null) => void;
  /** Lets the user clear the selection, e.g. for a filter. */
  allowClear?: boolean;
  error?: string;
  /** Heading above the list. Defaults to "Destination". */
  label?: string;
};

export function DestinationPicker({ value, onChange, allowClear = false, error, label }: Props) {
  const { t } = useTranslation('destinations');
  const { destinations, loading, failed } = useDestinations();

  return (
    <View style={{ gap: spacing.space1 }}>
      <ThemedText type="label">{label ?? t('destinationPicker.label')}</ThemedText>
      {loading ? <ActivityIndicator color={colors.pink500} /> : null}
      {failed ? <HelperText error>{t('destinationPicker.loadFailed')}</HelperText> : null}
      <View style={{ gap: spacing.space2 }}>
        {destinations?.map((d) => {
          const selected = d.id === value;
          return (
            <Pressable
              key={d.id}
              accessibilityRole="button"
              accessibilityLabel={d.name}
              accessibilityState={{ selected }}
              onPress={() => onChange(allowClear && selected ? null : d.id)}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: spacing.space4,
                borderRadius: radius.md,
                borderWidth,
                borderColor: selected ? colors.pink500 : colors.line,
                backgroundColor: selected ? colors.pink100 : colors.surfaceSoft,
              }}>
              <View>
                <ThemedText type="label">{d.name}</ThemedText>
                <ThemedText type="caption" themeColor="muted">
                  {d.country}
                </ThemedText>
              </View>
              <ThemedText type="caption" themeColor="muted">
                {t('destinationPicker.games', { count: d.openListings })}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
      {error ? <HelperText error>{error}</HelperText> : null}
    </View>
  );
}
