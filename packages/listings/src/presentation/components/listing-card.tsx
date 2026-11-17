import { Pressable, View } from 'react-native';

import { Card, Chip, ThemedText, Spacing } from '@padel/ui';

import type { DiscoverListing } from '../../domain/listing';
import { dateParts, formatRange } from '../format-date';

type Props = {
  listing: DiscoverListing;
  /** When set the card opens the match; the screen supplies the navigation so this package stays router-free. */
  onPress?: () => void;
};

export function ListingCard({ listing, onPress }: Props) {
  const from = dateParts(listing.startDate);
  const spots = `${listing.playersNeeded} ${listing.playersNeeded === 1 ? 'spot' : 'spots'} needed`;

  const card = (
    <Card style={{ flexDirection: 'row', gap: Spacing.three }}>
      <View style={{ alignItems: 'center', minWidth: 48 }}>
        <ThemedText type="small" themeColor="textSecondary">{from.weekday}</ThemedText>
        <ThemedText type="subtitle">{from.day}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">{from.month}</ThemedText>
      </View>

      <View style={{ flex: 1, gap: Spacing.one }}>
        <ThemedText type="smallBold">{listing.destinationName}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {formatRange(listing.startDate, listing.endDate)}
          {listing.startTime ? ` at ${listing.startTime}` : ''}
          {listing.venue ? ` · ${listing.venue}` : ''}
        </ThemedText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two }}>
          <Chip label={listing.levelWanted === 'Any' ? 'Any level' : listing.levelWanted} />
          <Chip label={spots} />
        </View>
        {listing.description ? <ThemedText type="small">{listing.description}</ThemedText> : null}
        <ThemedText type="small" themeColor="textSecondary">
          {listing.posterName}
          {listing.posterSkillTier ? ` · ${listing.posterSkillTier}` : ''}
        </ThemedText>
      </View>
    </Card>
  );

  if (!onPress) return card;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${listing.destinationName}, ${formatRange(listing.startDate, listing.endDate)}, ${spots}`}
      accessibilityHint="Opens the match details"
      onPress={onPress}>
      {card}
    </Pressable>
  );
}
