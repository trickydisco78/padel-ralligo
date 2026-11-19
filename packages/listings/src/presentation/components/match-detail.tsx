import { useTranslation } from '@padel/i18n';
import type { ReactNode } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { Badge, Button, colors, Icon, spacing, ThemedText } from '@padel/ui';

import type { DiscoverListing } from '../../domain/listing';
import { formatRange } from '../format-date';
import { DateTile } from './date-tile';
import { PlayersProgress } from './players-progress';

type Props = {
  /** `undefined` while loading, `null` when the match is closed, past or missing. */
  listing: DiscoverListing | null | undefined;
  loading: boolean;
  failed: boolean;
  onRetry: () => void;
  onBackToDiscover: () => void;
  /** A status banner for a member's own request, shown first. */
  banner?: ReactNode;
  /** The organiser row. The screen supplies it because the row component belongs to another package. */
  organiser?: ReactNode;
  /** The accepted players, shown under the progress bar. Signed-in members only. */
  players?: ReactNode;
};

/**
 * The content of the white sheet over the hero: date tile, title, place and time, level, the organiser,
 * the description, and players progress. Only what the Discover read model exposes, and only the fields
 * that are set. Never a user id or a contact detail.
 */
export function MatchDetail({ listing, loading, failed, onRetry, onBackToDiscover, banner, organiser, players }: Props) {
  const { t } = useTranslation('listings');
  if (loading) return <ActivityIndicator accessibilityLabel={t('matchDetail.loading')} color={colors.pink500} />;

  if (failed && !listing) {
    return (
      <View style={{ gap: spacing.space4 }}>
        <ThemedText accessibilityRole="alert" themeColor="error600">
          {t('matchDetail.loadFailed')}
        </ThemedText>
        <Button title={t('matchDetail.retry')} onPress={onRetry} />
      </View>
    );
  }

  if (!listing) {
    return (
      <View style={{ gap: spacing.space4 }}>
        <ThemedText type="headline">{t('matchDetail.unavailableTitle')}</ThemedText>
        <ThemedText themeColor="muted">{t('matchDetail.unavailableBody')}</ThemedText>
        <Button title={t('matchDetail.backToDiscover')} onPress={onBackToDiscover} />
      </View>
    );
  }

  const where = [listing.venue, listing.destinationName, listing.destinationCountry].filter(Boolean).join(', ');
  const range = formatRange(t, listing.startDate, listing.endDate);
  const when = listing.startTime ? t('common.atTime', { range, time: listing.startTime }) : range;
  const accepted = Math.max(listing.playersNeeded - listing.spotsLeft, 0);

  return (
    <View style={{ gap: spacing.space4 }}>
      {banner}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.space4 }}>
        <DateTile date={listing.startDate} />
        <View style={{ flex: 1, gap: spacing.space1 }}>
          <ThemedText type="headline" accessibilityRole="header">
            {listing.destinationName}
          </ThemedText>
          <View accessible accessibilityLabel={`${t('matchDetail.where')}: ${where}`} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.space1 + 2 }}>
            <Icon name="pin" color="muted" size={16} />
            <ThemedText type="caption" themeColor="muted" style={{ flex: 1 }}>
              {where}
            </ThemedText>
          </View>
          <View accessible accessibilityLabel={`${t('matchDetail.when')}: ${when}`} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.space1 + 2 }}>
            <Icon name="clock" color="muted" size={16} />
            <ThemedText type="caption" themeColor="muted" style={{ flex: 1 }}>
              {when}
            </ThemedText>
          </View>
        </View>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.space2 }}>
        <Badge label={listing.levelWanted === 'Any' ? t('common.anyLevel') : listing.levelWanted} />
      </View>

      {organiser}

      {listing.description ? (
        <View style={{ gap: spacing.space1 }}>
          <ThemedText type="section" accessibilityRole="header">
            {t('matchDetail.about')}
          </ThemedText>
          <ThemedText themeColor="inkSoft">{listing.description}</ThemedText>
        </View>
      ) : null}

      <PlayersProgress current={1 + accepted} total={1 + listing.playersNeeded} />
      {players}
    </View>
  );
}
