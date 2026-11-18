import { formatDateRange, type IsoDate } from '@padel/core';
import { InitialsTile, SecondaryButton, Spacing, ThemedText, ThemedView } from '@padel/ui';
import { View } from 'react-native';
import { useTranslation } from '@padel/i18n';

import type { Player } from '../../domain/player';

type Props = {
  player: Player;
  onConnect?: () => void;
  connectDisabled?: boolean;
  /** Explains why Connect is disabled (defaults to "not available yet"); only announced while it is. */
  connectHint?: string;
  /** A Guest sees "Sign in" instead of "Connect". */
  guest?: boolean;
  /** The other player's trip dates and how many days overlap the member's trip (of `tripDays`). */
  overlap?: { startDate: IsoDate; endDate: IsoDate; days: number; tripDays: number };
};

/** A player's public card. Not pressable as a whole: there is no profile page, only Connect. */
export function PlayerCard({ player, onConnect, connectDisabled = false, connectHint, guest = false, overlap }: Props) {
  const { t } = useTranslation('players');
  const sport = t('sport');
  const dates = overlap ? formatDateRange(overlap.startDate, overlap.endDate) : '';
  const overlapText = overlap
    ? overlap.days === overlap.tripDays && overlap.days > 1
      ? t('overlapAll', { count: overlap.days })
      : t('overlap', { count: overlap.days })
    : '';
  const label = overlap
    ? t('cardLabelOverlap', {
        name: player.displayName,
        destination: player.destinationName,
        dates,
        overlap: overlapText,
        tier: player.skillTier,
      })
    : t('cardLabel', { name: player.displayName, destination: player.destinationName, tier: player.skillTier });

  return (
    <ThemedView
      type="backgroundElement"
      style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.three, padding: Spacing.three, borderRadius: 20 }}>
      <InitialsTile name={player.displayName} />
      <View
        accessible
        accessibilityLabel={label}
        style={{ flex: 1 }}>
        <ThemedText type="smallBold">{player.displayName}</ThemedText>
        {overlap ? (
          <>
            <ThemedText type="small" themeColor="textSecondary">
              {t('tripLine', { destination: player.destinationName, dates })}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {t('overlapLine', { overlap: overlapText, tier: player.skillTier })}
            </ThemedText>
          </>
        ) : (
          <ThemedText type="small" themeColor="textSecondary">
            {t('detail', { destination: player.destinationName, sport, tier: player.skillTier })}
          </ThemedText>
        )}
      </View>
      <SecondaryButton
        title={guest ? t('signIn') : t('connect')}
        onPress={() => onConnect?.()}
        disabled={connectDisabled}
        accessibilityHint={connectDisabled ? (connectHint ?? t('connectUnavailableHint')) : undefined}
      />
    </ThemedView>
  );
}
