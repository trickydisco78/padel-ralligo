import type { ReactNode } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { Card, Chip, PrimaryButton, ThemedText, Spacing, Colors } from '@padel/ui';

import type { DiscoverListing } from '../../domain/listing';
import { formatRange } from '../format-date';

type Props = {
  /** `undefined` while loading, `null` when the match is closed, past or missing. */
  listing: DiscoverListing | null | undefined;
  loading: boolean;
  failed: boolean;
  onRetry: () => void;
  onBackToDiscover: () => void;
  /** Shown under the details, e.g. the Join action, which the screen owns because it needs navigation. */
  footer?: ReactNode;
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ gap: Spacing.half }}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText>{value}</ThemedText>
    </View>
  );
}

/**
 * The public details of one match: only what the Discover read model exposes, and only the fields
 * that are set. Never a user id, contact detail or participant list.
 */
export function MatchDetail({ listing, loading, failed, onRetry, onBackToDiscover, footer }: Props) {
  if (loading) return <ActivityIndicator accessibilityLabel="Loading match" color={Colors.light.primary} />;

  if (failed && !listing) {
    return (
      <View style={{ gap: Spacing.three }}>
        <ThemedText accessibilityRole="alert" style={{ color: '#C62828' }}>
          Could not load this match.
        </ThemedText>
        <PrimaryButton title="Try again" onPress={onRetry} />
      </View>
    );
  }

  if (!listing) {
    return (
      <View style={{ gap: Spacing.three }}>
        <ThemedText type="subtitle">This match is no longer available</ThemedText>
        <ThemedText themeColor="textSecondary">It may have closed or already been played.</ThemedText>
        <PrimaryButton title="Back to Discover" onPress={onBackToDiscover} />
      </View>
    );
  }

  const spots = `${listing.playersNeeded} ${listing.playersNeeded === 1 ? 'spot' : 'spots'} needed`;
  const where = [listing.destinationName, listing.destinationCountry].filter(Boolean).join(', ');
  const when = `${formatRange(listing.startDate, listing.endDate)}${listing.startTime ? ` at ${listing.startTime}` : ''}`;

  return (
    <View style={{ gap: Spacing.three }}>
      <ThemedText type="title" accessibilityRole="header">
        {listing.destinationName}
      </ThemedText>
      <Card style={{ gap: Spacing.three }}>
        <Row label="Where" value={where} />
        {listing.venue ? <Row label="Venue" value={listing.venue} /> : null}
        <Row label="When" value={when} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two }}>
          <Chip label={listing.levelWanted === 'Any' ? 'Any level' : listing.levelWanted} />
          <Chip label={spots} />
        </View>
        {listing.description ? <Row label="About this match" value={listing.description} /> : null}
        <Row
          label="Posted by"
          value={`${listing.posterName}${listing.posterSkillTier ? ` · ${listing.posterSkillTier}` : ''}`}
        />
      </Card>
      {footer}
    </View>
  );
}
