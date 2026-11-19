import { useTranslation } from '@padel/i18n';
import { colors, fontFamily, spacing } from '@padel/ui';
import { Text, View } from 'react-native';

type Props = {
  /** Players on the match, counting the organiser. */
  current: number;
  /** Players the match wants, counting the organiser. */
  total: number;
};

/** "Players 3 of 4" with a pink progress bar. */
export function PlayersProgress({ current, total }: Props) {
  const { t } = useTranslation('listings');
  const share = total > 0 ? Math.min(current / total, 1) : 0;
  const label = t('playersProgress.value', { current, total });
  const text = { color: colors.ink, fontFamily: fontFamily[700], fontSize: 15, lineHeight: 20 };
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`${t('playersProgress.label')}, ${label}`}
      accessibilityValue={{ min: 0, max: total, now: current }}
      style={{ gap: spacing.space2 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={text}>{t('playersProgress.label')}</Text>
        <Text style={text}>{label}</Text>
      </View>
      <View style={{ height: 10, borderRadius: 5, backgroundColor: colors.line }}>
        <View style={{ width: `${Math.round(share * 100)}%`, height: 10, borderRadius: 5, backgroundColor: colors.pink500 }} />
      </View>
    </View>
  );
}
