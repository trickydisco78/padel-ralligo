import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTranslation } from '@padel/i18n';
import { AppBar, Card, colors, Button, radius, ThemedText, ThemedView, spacing } from '@padel/ui';
import { useDestinations } from '@padel/destinations';
import { ListingCard, useDiscoverListings } from '@padel/listings';

import { useCollapsingHeader } from '@/hooks/use-collapsing-header';

const UPCOMING_GAMES = 5;

export default function HomeScreen() {
  const { t } = useTranslation('app');
  const router = useRouter();
  const { destinations, failed: destinationsFailed, refetch: refetchDestinations } = useDestinations();
  const { listings, failed: listingsFailed, refetch: refetchListings } = useDiscoverListings();
  const [refreshing, setRefreshing] = useState(false);
  const { scrollY, onScroll, scrollEventThrottle } = useCollapsingHeader();

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
      <AppBar title={t('home.title')} subtitle={t('home.subtitle')} scrollY={scrollY} />
      {/* The bar pads for the status bar itself, so the safe area here covers the sides and bottom only. */}
      <SafeAreaView edges={['left', 'right', 'bottom']} style={{ flex: 1 }}>
        <ScrollView
          testID="home-scroll"
          onScroll={onScroll}
          scrollEventThrottle={scrollEventThrottle}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
          contentContainerStyle={{ padding: spacing.space4, gap: spacing.space6 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('home.searchLabel')}
            accessibilityHint={t('home.searchHint')}
            onPress={() => router.push({ pathname: '/discover', params: { focusSearch: '1' } })}
            style={{
              borderWidth: 1,
              borderColor: colors.line,
              borderRadius: radius.pill,
              backgroundColor: colors.surfaceSoft,
              paddingVertical: spacing.space4,
              paddingHorizontal: spacing.space4,
              minHeight: 48,
              justifyContent: 'center',
            }}>
            <ThemedText themeColor="muted">{t('home.searchPlaceholder')}</ThemedText>
          </Pressable>

          <View style={{ gap: spacing.space2 }}>
            <ThemedText type="headline">{t('home.destinations')}</ThemedText>
            {destinationsFailed && destinations === null ? (
              <ThemedText themeColor="error600">{t('home.destinationsError')}</ThemedText>
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
                      <ThemedText type="label">{d.name}</ThemedText>
                      {d.tagline ? (
                        <ThemedText type="caption" themeColor="muted">
                          {d.tagline}
                        </ThemedText>
                      ) : null}
                    </View>
                    <ThemedText type="caption" themeColor="pink700">
                      {t('home.openGames', { count: d.openListings })}
                    </ThemedText>
                  </Card>
                </Pressable>
              ))
            )}
          </View>

          <View style={{ gap: spacing.space4 }}>
            <ThemedText type="headline">{t('home.upcoming')}</ThemedText>
            {listingsFailed && listings === null ? (
              <ThemedText themeColor="error600">{t('home.gamesError')}</ThemedText>
            ) : listings === null ? (
              <ActivityIndicator />
            ) : upcoming.length === 0 ? (
              <ThemedText themeColor="muted">{t('home.noGames')}</ThemedText>
            ) : (
              <>
                {upcoming.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    onPress={() => router.push({ pathname: '/match/[id]', params: { id: listing.id } })}
                  />
                ))}
                <Button title={t('home.seeAll')} onPress={() => router.push('/discover')} />
              </>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}
