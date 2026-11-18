import { SKILL_TIERS, matchesSearchText, toIsoDate, type IsoDate, type SkillTier } from '@padel/core';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useRef, useState, type ComponentRef } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTranslation } from '@padel/i18n';
import { useSession } from '@padel/auth';
import { Chip, DateField, Logo, PrimaryButton, TextField, ThemedText, ThemedView, Spacing } from '@padel/ui';
import { ListingCard, matchesFilters, matchesSearch, useDiscoverListings } from '@padel/listings';
import { useDestinations } from '@padel/destinations';
import { activeTrip, useTrip } from '@padel/profiles';

type Filters = {
  destinationId: string | null;
  startDate: IsoDate | null;
  endDate: IsoDate | null;
  level: SkillTier | null;
};

const NO_FILTERS: Filters = { destinationId: null, startDate: null, endDate: null, level: null };

export default function DiscoverScreen() {
  const { t } = useTranslation('app');
  const { user } = useSession();
  const userId = user?.id;
  const router = useRouter();
  const { destinationId: destinationParam, focusSearch } = useLocalSearchParams<{
    destinationId?: string;
    focusSearch?: string;
  }>();
  const { destinations } = useDestinations();
  const { data: savedTrip } = useTrip(userId);
  const { listings, failed, refetch: refetchListings } = useDiscoverListings();
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const searchInput = useRef<ComponentRef<typeof TextInput>>(null);
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  // Bumped when filters are replaced from outside, so the typed date fields pick up the new values.
  const [filterVersion, setFilterVersion] = useState(0);
  const [tripHandled, setTripHandled] = useState(false);

  // Reload whenever the tab gains focus, so a listing just posted shows up.
  useFocusEffect(
    useCallback(() => {
      refetchListings();
    }, [refetchListings]),
  );

  // Arriving from Home's search entry puts the cursor in the search field, once.
  useFocusEffect(
    useCallback(() => {
      if (!focusSearch) return;
      const timer = setTimeout(() => {
        searchInput.current?.focus();
        router.setParams({ focusSearch: undefined });
      }, 100);
      return () => clearTimeout(timer);
    }, [focusSearch, router]),
  );

  // A destination chosen elsewhere (e.g. a Home shortcut) replaces the filters and wins over the
  // saved trip. Adjusted during render, keyed on the param, so it applies once per new value.
  const [appliedParam, setAppliedParam] = useState<string | undefined>(undefined);
  if (destinationParam && destinationParam !== appliedParam) {
    setAppliedParam(destinationParam);
    setFilters({ ...NO_FILTERS, destinationId: destinationParam });
    setFilterVersion((v) => v + 1);
    setTripHandled(true);
  }

  // Open pre-filtered to the saved trip, once, unless its end date has passed. Adjusted during
  // render as soon as the trip has loaded.
  const currentTrip = activeTrip(savedTrip ?? null, toIsoDate(new Date()));
  if (!tripHandled && !destinationParam && currentTrip) {
    setTripHandled(true);
    setFilters({
      destinationId: currentTrip.destinationId,
      startDate: currentTrip.startDate,
      endDate: currentTrip.endDate,
      level: null,
    });
    setFilterVersion((v) => v + 1);
  }

  async function refresh() {
    setRefreshing(true);
    await refetchListings();
    setRefreshing(false);
  }

  function clearFilters() {
    setFilters(NO_FILTERS);
    setSearch('');
    setFilterVersion((v) => v + 1);
  }

  const visible = (listings ?? []).filter((l) => matchesFilters(l, filters) && matchesSearch(l, search));
  // A chosen destination stays visible even if the search text no longer matches it.
  const visibleDestinations = destinations?.filter(
    (d) => d.id === filters.destinationId || matchesSearchText(search, d.name, d.country),
  );

  const header = (
    <View style={{ gap: Spacing.three }}>
      <Logo />
      <ThemedText type="title">{t('discover.title')}</ThemedText>

      <TextField
        ref={searchInput}
        label={t('discover.searchLabel')}
        value={search}
        onChangeText={setSearch}
        placeholder={t('discover.searchPlaceholder')}
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
      />

      <View style={{ gap: Spacing.one }}>
        <ThemedText type="smallBold">{t('discover.destination')}</ThemedText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two }}>
          <Chip
            label={t('discover.allDestinations')}
            selected={filters.destinationId === null}
            onPress={() => setFilters((f) => ({ ...f, destinationId: null }))}
          />
          {visibleDestinations?.map((d) => (
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
        label={t('discover.from')}
        value={filters.startDate}
        onChange={(startDate) => setFilters((f) => ({ ...f, startDate }))}
      />
      <DateField
        key={`to-${filterVersion}`}
        label={t('discover.to')}
        value={filters.endDate}
        onChange={(endDate) => setFilters((f) => ({ ...f, endDate }))}
      />

      <View style={{ gap: Spacing.one }}>
        <ThemedText type="smallBold">{t('discover.level')}</ThemedText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two }}>
          <Chip
            label={t('discover.allLevels')}
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
          renderItem={({ item }) => (
            <ListingCard
              listing={item}
              onPress={() => router.push({ pathname: '/match/[id]', params: { id: item.id } })}
            />
          )}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
          contentContainerStyle={{ padding: Spacing.three, gap: Spacing.three }}
          ListHeaderComponent={header}
          ListEmptyComponent={
            failed ? (
              <ThemedText style={{ color: '#C62828' }}>{t('discover.error')}</ThemedText>
            ) : listings === null ? (
              <ActivityIndicator />
            ) : (
              <View style={{ gap: Spacing.three }}>
                <ThemedText themeColor="textSecondary">{t('discover.noMatches')}</ThemedText>
                <PrimaryButton title={t('discover.clearFilters')} onPress={clearFilters} />
              </View>
            )
          }
        />
      </SafeAreaView>
    </ThemedView>
  );
}
