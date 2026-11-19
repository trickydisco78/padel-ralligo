import { useTranslation } from '@padel/i18n';
import { borderWidth, Button, colors, fontFamily, spacing, ThemedText } from '@padel/ui';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  /** The total, already formatted ("€36"). `null` shows a dash until a date and start time are chosen. */
  price: string | null;
  /** The split, as a caption under the price: "€9 each when split by 4". */
  split?: string;
  /** The one action: "Reserve". */
  actionLabel: string;
  onAction: () => void;
  /** Disabled until a date and a start time are chosen. */
  actionDisabled?: boolean;
};

/** The bar docked at the bottom of a booking screen: the price on the left, one big action on the right. */
export function BookingBar({ price, split, actionLabel, onAction, actionDisabled = false }: Props) {
  const { t } = useTranslation('bookings');
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: spacing.space4,
        paddingHorizontal: spacing.space5,
        paddingTop: spacing.space4,
        paddingBottom: Math.max(insets.bottom, spacing.space4) + spacing.space3,
        backgroundColor: colors.surface,
        borderTopWidth: borderWidth,
        borderTopColor: colors.line,
      }}>
      <View accessible accessibilityLabel={`${price ?? '—'} ${t('bookingBar.total')}${split ? `, ${split}` : ''}`} style={{ flexShrink: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: spacing.space2 }}>
          <Text style={{ color: colors.ink, fontFamily: fontFamily[800], fontSize: 24, lineHeight: 28 }}>{price ?? '—'}</Text>
          <ThemedText type="label" themeColor="muted">
            {t('bookingBar.total')}
          </ThemedText>
        </View>
        {split ? (
          <ThemedText type="caption" themeColor="muted">
            {split}
          </ThemedText>
        ) : null}
      </View>
      <Button title={actionLabel} onPress={onAction} disabled={actionDisabled} />
    </View>
  );
}
