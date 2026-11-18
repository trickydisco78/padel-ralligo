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
};

/** A player's public card. Not pressable as a whole: there is no profile page, only Connect. */
export function PlayerCard({ player, onConnect, connectDisabled = false, connectHint }: Props) {
  const { t } = useTranslation('players');
  const detail = `${player.destinationName} · ${player.skillTier}`;

  return (
    <ThemedView
      type="backgroundElement"
      style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.three, padding: Spacing.three, borderRadius: 20 }}>
      <InitialsTile name={player.displayName} />
      <View
        accessible
        accessibilityLabel={t('cardLabel', {
          name: player.displayName,
          destination: player.destinationName,
          tier: player.skillTier,
        })}
        style={{ flex: 1 }}>
        <ThemedText type="smallBold">{player.displayName}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {detail}
        </ThemedText>
      </View>
      <SecondaryButton
        title={t('connect')}
        onPress={() => onConnect?.()}
        disabled={connectDisabled}
        accessibilityHint={connectDisabled ? (connectHint ?? t('connectUnavailableHint')) : undefined}
      />
    </ThemedView>
  );
}
