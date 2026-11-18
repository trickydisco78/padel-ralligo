import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTranslation } from '@padel/i18n';
import { Card, Colors, Logo, PrimaryButton, Radius, ThemedText, ThemedView, Spacing } from '@padel/ui';
import { useDestinations } from '@padel/destinations';
import { ListingCard, useDiscoverListings } from '@padel/listings';

const UPCOMING_GAMES = 5;

export default function HomeScreen() {
  const { t } = useTranslation('app');
  const router = useRouter();
  const { destinations, failed: destinationsFailed, refetch: refetchDestinations } = useDestinations();
  const { listings, failed: listingsFailed, refetch: refetchListings } = useDiscoverListings();
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    await Promise.all([
      refetchDestinations(),
      refetchListings(),
    ]);
  }, [refetchDestinations, refetchListings]);

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
          <Logo />
          <View style={{ gap: Spacing.two }}>
            <ThemedText type="title">{t('home.title')}</ThemedText>
            <ThemedText themeColor="textSecondary">
              {t('home.subtitle')}
            </ThemedText>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('home.searchLabel')}
            accessibilityHint={t('home.searchHint')}
            onPress={() => router.push({ pathname: '/discover', params: { focusSearch: '1' } })}
            style={{
              borderWidth: 1,
              borderColor: Colors.light.border,
              borderRadius: Radius.button,
              backgroundColor: Colors.light.backgroundElement,
              paddingVertical: Spacing.three,
              paddingHorizontal: Spacing.three,
              minHeight: 48,
              justifyContent: 'center',
            }}>
            <ThemedText themeColor="textSecondary">{t('home.searchPlaceholder')}</ThemedText>
          </Pressable>

          <View style={{ gap: Spacing.two }}>
            <ThemedText type="subtitle">{t('home.destinations')}</ThemedText>
            {destinationsFailed && destinations === null ? (
              <ThemedText style={{ color: '#C62828' }}>{t('home.destinationsError')}</ThemedText>
            ) : destinations === null ? (
              <ActivityIndicator />
            ) : (
              destinations.map((d) => (
                <Pressable
                  key={d.id}
                  accessibilityRole="button"
                  accessibilityLabel={t('home.destinationLabel', { name: d.name, count: d.openListings })}
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
                      {t('home.openGames', { count: d.openListings })}
                    </ThemedText>
                  </Card>
                </Pressable>
              ))
            )}
          </View>

          <View style={{ gap: Spacing.three }}>
            <ThemedText type="subtitle">{t('home.upcoming')}</ThemedText>
            {listingsFailed && listings === null ? (
              <ThemedText style={{ color: '#C62828' }}>{t('home.gamesError')}</ThemedText>
            ) : listings === null ? (
              <ActivityIndicator />
            ) : upcoming.length === 0 ? (
              <ThemedText themeColor="textSecondary">{t('home.noGames')}</ThemedText>
            ) : (
              <>
                {upcoming.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    onPress={() => router.push({ pathname: '/match/[id]', params: { id: listing.id } })}
                  />
                ))}
                <PrimaryButton title={t('home.seeAll')} onPress={() => router.push('/discover')} />
              </>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}
