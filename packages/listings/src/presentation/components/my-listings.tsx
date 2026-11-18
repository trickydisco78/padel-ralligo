import { useTranslation } from '@padel/i18n';
import { useState } from 'react';
import { View } from 'react-native';

import { useSession } from '@padel/auth';
import { Card, Chip, PrimaryButton, ThemedText, Spacing } from '@padel/ui';

import { formatRange } from '../format-date';
import { useCloseListing, useMyListings } from '../hooks/use-listings';
import { ListingForm } from './listing-form';

export function MyListings() {
  const { t } = useTranslation('listings');
  const { user } = useSession();
  const userId = user?.id;
  const { data: listings, isPending, isError } = useMyListings(userId);
  const closeListing = useCloseListing();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [closeError, setCloseError] = useState<string | null>(null);
  const error = closeError ?? (isError ? t('myListings.loadFailed') : null);

  async function close(id: string) {
    setCloseError(null);
    try {
      await closeListing.mutateAsync(id);
    } catch {
      setCloseError(t('myListings.closeFailed'));
    }
  }

  if (isPending && !error) return null;

  return (
    <View style={{ gap: Spacing.three }}>
      <ThemedText type="subtitle">{t('myListings.title')}</ThemedText>
      {error ? <ThemedText style={{ color: '#C62828' }}>{error}</ThemedText> : null}
      {listings?.length === 0 ? <ThemedText themeColor="textSecondary">{t('myListings.empty')}</ThemedText> : null}

      {listings?.map((l) =>
        editingId === l.id ? (
          <Card key={l.id}>
            <ListingForm
              existing={l}
              onPosted={() => {
                setEditingId(null);
              }}
            />
            <PrimaryButton title={t('myListings.cancel')} onPress={() => setEditingId(null)} />
          </Card>
        ) : (
          <Card key={l.id}>
            <ThemedText type="smallBold">{l.destinationName}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {l.venue
                ? t('common.withVenue', { summary: formatRange(t, l.startDate, l.endDate), venue: l.venue })
                : formatRange(t, l.startDate, l.endDate)}
            </ThemedText>
            <View style={{ flexDirection: 'row', gap: Spacing.two }}>
              <Chip label={l.status === 'open' ? t('myListings.open') : t('myListings.closed')} selected={l.status === 'open'} />
              <Chip label={t('myListings.playersNeeded', { count: l.playersNeeded })} />
            </View>
            {l.status === 'open' ? (
              <View style={{ gap: Spacing.two }}>
                <PrimaryButton title={t('myListings.edit', { destination: l.destinationName })} onPress={() => setEditingId(l.id)} />
                <PrimaryButton title={t('myListings.close', { destination: l.destinationName })} onPress={() => close(l.id)} />
              </View>
            ) : null}
          </Card>
        ),
      )}
    </View>
  );
}
