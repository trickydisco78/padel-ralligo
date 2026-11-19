import { useTranslation } from '@padel/i18n';
import { useState } from 'react';
import { View } from 'react-native';

import { useSession } from '@padel/auth';
import { Card, Button, ThemedText, spacing, Badge } from '@padel/ui';

import { formatRange } from '../format-date';
import { useCloseListing, useMyListings } from '../hooks/use-listings';
import { ListingForm } from './listing-form';

type Props = {
  /** Opens Manage match for a listing; the screen supplies the navigation so this package stays router-free. */
  onManage?: (listingId: string) => void;
};

export function MyListings({ onManage }: Props) {
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
    <View style={{ gap: spacing.space4 }}>
      <ThemedText type="headline">{t('myListings.title')}</ThemedText>
      {error ? <ThemedText themeColor="error600">{error}</ThemedText> : null}
      {listings?.length === 0 ? <ThemedText themeColor="muted">{t('myListings.empty')}</ThemedText> : null}

      {listings?.map((l) =>
        editingId === l.id ? (
          <Card key={l.id}>
            <ListingForm
              existing={l}
              onPosted={() => {
                setEditingId(null);
              }}
            />
            <Button title={t('myListings.cancel')} onPress={() => setEditingId(null)} />
          </Card>
        ) : (
          <Card key={l.id}>
            <ThemedText type="label">{l.destinationName}</ThemedText>
            <ThemedText type="caption" themeColor="muted">
              {l.venue
                ? t('common.withVenue', { summary: formatRange(t, l.startDate, l.endDate), venue: l.venue })
                : formatRange(t, l.startDate, l.endDate)}
            </ThemedText>
            <View style={{ flexDirection: 'row', gap: spacing.space2 }}>
              <Badge label={l.status === 'open' ? t('myListings.open') : t('myListings.closed')} variant={l.status === 'open' ? 'success' : 'neutral'} />
              <Badge label={t('myListings.playersNeeded', { count: l.playersNeeded })} />
            </View>
            {l.status === 'open' ? (
              <View style={{ gap: spacing.space2 }}>
                {onManage ? (
                  <Button
                    icon="people"
                    title={t('myListings.manage', { destination: l.destinationName })}
                    onPress={() => onManage(l.id)}
                  />
                ) : null}
                <Button variant="secondary" title={t('myListings.edit', { destination: l.destinationName })} onPress={() => setEditingId(l.id)} />
                <Button title={t('myListings.close', { destination: l.destinationName })} onPress={() => close(l.id)} />
              </View>
            ) : null}
          </Card>
        ),
      )}
    </View>
  );
}
