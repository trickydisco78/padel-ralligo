import { useTranslation } from '@padel/i18n';
import { Pressable, View } from 'react-native';

import { Card, ThemedText, spacing, Badge } from '@padel/ui';

import type { DiscoverListing } from '../../domain/listing';
import { dateParts, formatRange } from '../format-date';

type Props = {
  listing: DiscoverListing;
  /** When set the card opens the match; the screen supplies the navigation so this package stays router-free. */
  onPress?: () => void;
};

export function ListingCard({ listing, onPress }: Props) {
  const { t } = useTranslation('listings');
  const from = dateParts(listing.startDate);
  const spots = t('common.spotsNeeded', { count: listing.spotsLeft });
  const range = formatRange(t, listing.startDate, listing.endDate);
  const when = listing.startTime ? t('common.atTime', { range, time: listing.startTime }) : range;
  const whenAndVenue = listing.venue ? t('common.withVenue', { summary: when, venue: listing.venue }) : when;
  const poster = listing.posterSkillTier
    ? t('common.withSkillTier', { name: listing.posterName, tier: listing.posterSkillTier })
    : listing.posterName;

  const card = (
    <Card style={{ flexDirection: 'row', gap: spacing.space4 }}>
      <View style={{ alignItems: 'center', minWidth: 48 }}>
        <ThemedText type="caption" themeColor="muted">{from.weekday}</ThemedText>
        <ThemedText type="headline">{from.day}</ThemedText>
        <ThemedText type="caption" themeColor="muted">{from.month}</ThemedText>
      </View>

      <View style={{ flex: 1, gap: spacing.space1 }}>
        <ThemedText type="label">{listing.destinationName}</ThemedText>
        <ThemedText type="caption" themeColor="muted">
          {whenAndVenue}
        </ThemedText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.space2 }}>
          <Badge label={listing.levelWanted === 'Any' ? t('common.anyLevel') : listing.levelWanted} />
          <Badge label={spots} />
        </View>
        {listing.description ? <ThemedText type="caption">{listing.description}</ThemedText> : null}
        <ThemedText type="caption" themeColor="muted">
          {poster}
        </ThemedText>
      </View>
    </Card>
  );

  if (!onPress) return card;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('listingCard.openLabel', { destination: listing.destinationName, when: range, spots })}
      accessibilityHint={t('listingCard.openHint')}
      onPress={onPress}>
      {card}
    </Pressable>
  );
}
