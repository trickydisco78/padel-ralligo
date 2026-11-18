import { useTranslation } from '@padel/i18n';
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
  const { t } = useTranslation('listings');
  if (loading) return <ActivityIndicator accessibilityLabel={t('matchDetail.loading')} color={Colors.light.primary} />;

  if (failed && !listing) {
    return (
      <View style={{ gap: Spacing.three }}>
        <ThemedText accessibilityRole="alert" style={{ color: '#C62828' }}>
          {t('matchDetail.loadFailed')}
        </ThemedText>
        <PrimaryButton title={t('matchDetail.retry')} onPress={onRetry} />
      </View>
    );
  }

  if (!listing) {
    return (
      <View style={{ gap: Spacing.three }}>
        <ThemedText type="subtitle">{t('matchDetail.unavailableTitle')}</ThemedText>
        <ThemedText themeColor="textSecondary">{t('matchDetail.unavailableBody')}</ThemedText>
        <PrimaryButton title={t('matchDetail.backToDiscover')} onPress={onBackToDiscover} />
      </View>
    );
  }

  const spots = t('common.spotsNeeded', { count: listing.playersNeeded });
  const where = [listing.destinationName, listing.destinationCountry].filter(Boolean).join(', ');
  const range = formatRange(t, listing.startDate, listing.endDate);
  const when = listing.startTime ? t('common.atTime', { range, time: listing.startTime }) : range;
  const poster = listing.posterSkillTier
    ? t('common.withSkillTier', { name: listing.posterName, tier: listing.posterSkillTier })
    : listing.posterName;

  return (
    <View style={{ gap: Spacing.three }}>
      <ThemedText type="title" accessibilityRole="header">
        {listing.destinationName}
      </ThemedText>
      <Card style={{ gap: Spacing.three }}>
        <Row label={t('matchDetail.where')} value={where} />
        {listing.venue ? <Row label={t('matchDetail.venue')} value={listing.venue} /> : null}
        <Row label={t('matchDetail.when')} value={when} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two }}>
          <Chip label={listing.levelWanted === 'Any' ? t('common.anyLevel') : listing.levelWanted} />
          <Chip label={spots} />
        </View>
        {listing.description ? <Row label={t('matchDetail.about')} value={listing.description} /> : null}
        <Row
          label={t('matchDetail.postedBy')}
          value={poster}
        />
      </Card>
      {footer}
    </View>
  );
}
