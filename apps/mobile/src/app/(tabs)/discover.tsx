import { SKILL_TIERS, matchesFilters, toIsoDate, type IsoDate, type SkillTier } from '@repo/core';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useSession } from '@/auth/session';
import { Chip } from '@/components/chip';
import { DateField } from '@/components/date-field';
import { ListingCard } from '@/components/listing-card';
import { PrimaryButton } from '@/components/primary-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { fetchDiscoverListings, type DiscoverListing } from '@/data/discover';
import { useDestinations } from '@/data/use-destinations';
import { activeTrip, fetchTrip } from '@/data/trip';

type Filters = {
  destinationId: string | null;
  startDate: IsoDate | null;
  endDate: IsoDate | null;
  level: SkillTier | null;
};

const NO_FILTERS: Filters = { destinationId: null, startDate: null, endDate: null, level: null };

export default function DiscoverScreen() {
  const { user } = useSession();
  const userId = user?.id;
  const { destinationId: destinationParam } = useLocalSearchParams<{ destinationId?: string }>();
  const { destinations } = useDestinations();
  const [listings, setListings] = useState<DiscoverListing[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  // Bumped when filters are replaced from outside, so the typed date fields pick up the new values.
  const [filterVersion, setFilterVersion] = useState(0);
  const tripApplied = useRef(false);

  const load = useCallback(async () => {
    try {
      setListings(await fetchDiscoverListings());
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, []);

  // Reload whenever the tab gains focus, so a listing just posted shows up.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  // A destination chosen elsewhere (e.g. a Home shortcut) replaces the filters and wins over the
  // saved trip. Adjusted during render, keyed on the param, so it applies once per new value.
  const [appliedParam, setAppliedParam] = useState<string | undefined>(undefined);
  if (destinationParam && destinationParam !== appliedParam) {
    setAppliedParam(destinationParam);
    setFilters({ ...NO_FILTERS, destinationId: destinationParam });
    setFilterVersion((v) => v + 1);
  }
  useEffect(() => {
    if (destinationParam) tripApplied.current = true;
  }, [destinationParam]);

  // Open pre-filtered to the saved trip, once, unless its end date has passed.
  useEffect(() => {
    if (!userId || tripApplied.current) return;
    let cancelled = false;
    fetchTrip(userId)
      .then((trip) => {
        const current = activeTrip(trip, toIsoDate(new Date()));
        if (cancelled || !current || tripApplied.current) return;
        tripApplied.current = true;
        setFilters({
          destinationId: current.destinationId,
          startDate: current.startDate,
          endDate: current.endDate,
          level: null,
        });
        setFilterVersion((v) => v + 1);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [userId]);

  async function refresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  function clearFilters() {
    setFilters(NO_FILTERS);
    setFilterVersion((v) => v + 1);
  }

  const visible = (listings ?? []).filter((l) => matchesFilters(l, filters));

  const header = (
    <View style={{ gap: Spacing.three }}>
      <ThemedText type="title">Discover</ThemedText>

      <View style={{ gap: Spacing.one }}>
        <ThemedText type="smallBold">Destination</ThemedText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two }}>
          <Chip
            label="All destinations"
            selected={filters.destinationId === null}
            onPress={() => setFilters((f) => ({ ...f, destinationId: null }))}
          />
          {destinations?.map((d) => (
            <Chip
              key={d.id}
              label={d.name}
              selected={filters.destinationId === d.id}
              onPress={() => setFilters((f) => ({ ...f, destinationId: d.id }))}
            />
          ))}
        </View>
      </View>

      <DateField
        key={`from-${filterVersion}`}
        label="From"
        value={filters.startDate}
        onChange={(startDate) => setFilters((f) => ({ ...f, startDate }))}
      />
      <DateField
        key={`to-${filterVersion}`}
        label="To"
        value={filters.endDate}
        onChange={(endDate) => setFilters((f) => ({ ...f, endDate }))}
      />

      <View style={{ gap: Spacing.one }}>
        <ThemedText type="smallBold">Level</ThemedText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two }}>
          <Chip
            label="All levels"
            selected={filters.level === null}
            onPress={() => setFilters((f) => ({ ...f, level: null }))}
          />
          {SKILL_TIERS.map((tier) => (
            <Chip
              key={tier}
              label={tier}
              selected={filters.level === tier}
              onPress={() => setFilters((f) => ({ ...f, level: tier }))}
            />
          ))}
        </View>
      </View>
    </View>
  );

  return (
    <ThemedView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <FlatList
          data={visible}
          keyExtractor={(l) => l.id}
          renderItem={({ item }) => <ListingCard listing={item} />}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
          contentContainerStyle={{ padding: Spacing.three, gap: Spacing.three }}
          ListHeaderComponent={header}
          ListEmptyComponent={
            failed ? (
              <ThemedText style={{ color: '#C62828' }}>Could not load games. Pull down to retry.</ThemedText>
            ) : listings === null ? (
              <ActivityIndicator />
            ) : (
              <View style={{ gap: Spacing.three }}>
                <ThemedText themeColor="textSecondary">No games match your filters.</ThemedText>
                <PrimaryButton title="Clear filters" onPress={clearFilters} />
              </View>
            )
          }
        />
      </SafeAreaView>
    </ThemedView>
  );
}
