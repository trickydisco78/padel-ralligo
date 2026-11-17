import { useState } from 'react';
import { View } from 'react-native';

import { useSession } from '@padel/auth';
import { Card, Chip, PrimaryButton, ThemedText, Spacing } from '@padel/ui';

import { formatRange } from '../format-date';
import { useCloseListing, useMyListings } from '../hooks/use-listings';
import { ListingForm } from './listing-form';

export function MyListings() {
  const { user } = useSession();
  const userId = user?.id;
  const { data: listings, isPending, isError } = useMyListings(userId);
  const closeListing = useCloseListing();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [closeError, setCloseError] = useState<string | null>(null);
  const error = closeError ?? (isError ? 'Could not load your listings.' : null);

  async function close(id: string) {
    setCloseError(null);
    try {
      await closeListing.mutateAsync(id);
    } catch {
      setCloseError('Could not close that listing. Please try again.');
    }
  }

  if (isPending && !error) return null;

  return (
    <View style={{ gap: Spacing.three }}>
      <ThemedText type="subtitle">Your listings</ThemedText>
      {error ? <ThemedText style={{ color: '#C62828' }}>{error}</ThemedText> : null}
      {listings?.length === 0 ? <ThemedText themeColor="textSecondary">You haven&apos;t posted any games yet.</ThemedText> : null}

      {listings?.map((l) =>
        editingId === l.id ? (
          <Card key={l.id}>
            <ListingForm
              existing={l}
              onPosted={() => {
                setEditingId(null);
              }}
            />
            <PrimaryButton title="Cancel" onPress={() => setEditingId(null)} />
          </Card>
        ) : (
          <Card key={l.id}>
            <ThemedText type="smallBold">{l.destinationName}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {formatRange(l.startDate, l.endDate)}
              {l.venue ? ` · ${l.venue}` : ''}
            </ThemedText>
            <View style={{ flexDirection: 'row', gap: Spacing.two }}>
              <Chip label={l.status === 'open' ? 'Open' : 'Closed'} selected={l.status === 'open'} />
              <Chip label={`${l.playersNeeded} needed`} />
            </View>
            {l.status === 'open' ? (
              <View style={{ gap: Spacing.two }}>
                <PrimaryButton title={`Edit ${l.destinationName} listing`} onPress={() => setEditingId(l.id)} />
                <PrimaryButton title={`Close ${l.destinationName} listing`} onPress={() => close(l.id)} />
              </View>
            ) : null}
          </Card>
        ),
      )}
    </View>
  );
}
