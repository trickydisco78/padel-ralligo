import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';

import { useSession } from '@/auth/session';
import { Card } from '@/components/card';
import { Chip } from '@/components/chip';
import { ListingForm } from '@/components/listing-form';
import { PrimaryButton } from '@/components/primary-button';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { closeListing, fetchMyListings, type MyListing } from '@/data/listings';
import { formatRange } from '@/lib/format';

export function MyListings() {
  const { user } = useSession();
  const userId = user?.id;
  const [listings, setListings] = useState<MyListing[] | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      setListings(await fetchMyListings(userId));
    } catch {
      setError('Could not load your listings.');
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    fetchMyListings(userId)
      .then((rows) => !cancelled && setListings(rows))
      .catch(() => !cancelled && setError('Could not load your listings.'));
    return () => {
      cancelled = true;
    };
  }, [userId]);

  async function close(id: string) {
    setError(null);
    try {
      await closeListing(id);
      await load();
    } catch {
      setError('Could not close that listing. Please try again.');
    }
  }

  if (listings === null && !error) return null;

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
                load();
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
