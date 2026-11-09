import { View } from 'react-native';

import { Card } from '@/components/card';
import { Chip } from '@/components/chip';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import type { DiscoverListing } from '@/data/discover';
import { dateParts, formatRange } from '@/lib/format';

export function ListingCard({ listing }: { listing: DiscoverListing }) {
  const from = dateParts(listing.startDate);
  const spots = `${listing.playersNeeded} ${listing.playersNeeded === 1 ? 'spot' : 'spots'} needed`;

  return (
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
}
