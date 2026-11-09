import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useSession } from '@/auth/session';
import { AccountActions } from '@/components/account-actions';
import { Card } from '@/components/card';
import { ListingCard } from '@/components/listing-card';
import { PrimaryButton } from '@/components/primary-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { fetchDestinations, type DestinationWithCount } from '@/data/destinations';
import { fetchDiscoverListings, type DiscoverListing } from '@/data/discover';

const UPCOMING_GAMES = 5;

export default function HomeScreen() {
  const { status } = useSession();
  const router = useRouter();
  const [destinations, setDestinations] = useState<DestinationWithCount[] | null>(null);
  const [listings, setListings] = useState<DiscoverListing[] | null>(null);
  const [destinationsFailed, setDestinationsFailed] = useState(false);
  const [listingsFailed, setListingsFailed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    await Promise.all([
      fetchDestinations().then(
        (list) => {
          setDestinations(list);
          setDestinationsFailed(false);
        },
        () => setDestinationsFailed(true),
      ),
      fetchDiscoverListings().then(
        (list) => {
          setListings(list);
          setListingsFailed(false);
        },
        () => setListingsFailed(true),
      ),
    ]);
  }, []);

  // Reload whenever the tab gains focus, so counts and games stay current.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function refresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  const upcoming = (listings ?? []).slice(0, UPCOMING_GAMES);

  return (
    <ThemedView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
          contentContainerStyle={{ padding: Spacing.three, gap: Spacing.four }}>
          <View style={{ gap: Spacing.two }}>
            <ThemedText type="title">Find your next padel game</ThemedText>
            <ThemedText themeColor="textSecondary">
              Meet players at your level, at home or on holiday.
            </ThemedText>
          </View>

          {status === 'signedOut' ? (
            <Card>
              <ThemedText type="smallBold">Join in</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Create an account to post a game, message players and build your profile.
              </ThemedText>
              <AccountActions />
            </Card>
          ) : null}

          <View style={{ gap: Spacing.two }}>
            <ThemedText type="subtitle">Destinations</ThemedText>
            {destinationsFailed && destinations === null ? (
              <ThemedText style={{ color: '#C62828' }}>Could not load destinations. Pull down to retry.</ThemedText>
            ) : destinations === null ? (
              <ActivityIndicator />
            ) : (
              destinations.map((d) => (
                <Pressable
                  key={d.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${d.name}, ${d.openListings} open ${d.openListings === 1 ? 'game' : 'games'}`}
                  onPress={() => router.push({ pathname: '/discover', params: { destinationId: d.id } })}>
                  <Card style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flex: 1 }}>
                      <ThemedText type="smallBold">{d.name}</ThemedText>
                      {d.tagline ? (
                        <ThemedText type="small" themeColor="textSecondary">
                          {d.tagline}
                        </ThemedText>
                      ) : null}
                    </View>
                    <ThemedText type="small" themeColor="primary">
                      {d.openListings} open {d.openListings === 1 ? 'game' : 'games'}
                    </ThemedText>
                  </Card>
                </Pressable>
              ))
            )}
          </View>

          <View style={{ gap: Spacing.three }}>
            <ThemedText type="subtitle">Upcoming games</ThemedText>
            {listingsFailed && listings === null ? (
              <ThemedText style={{ color: '#C62828' }}>Could not load games. Pull down to retry.</ThemedText>
            ) : listings === null ? (
              <ActivityIndicator />
            ) : upcoming.length === 0 ? (
              <ThemedText themeColor="textSecondary">No games yet. Check back soon.</ThemedText>
            ) : (
              <>
                {upcoming.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
                <PrimaryButton title="See all games" onPress={() => router.push('/discover')} />
              </>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}
