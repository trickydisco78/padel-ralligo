import { SKILL_TIERS, matchesSearchText, toIsoDate, type IsoDate, type SkillTier } from '@padel/core';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState, type ComponentRef } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTranslation } from '@padel/i18n';
import { useRequireAuth, useSession } from '@padel/auth';
import {
  BottomSheet,
  Chip,
  DateField,
  Logo,
  PrimaryButton,
  SecondaryButton,
  SegmentedControl,
  TextField,
  ThemedText,
  ThemedView,
  Spacing,
} from '@padel/ui';
import { ListingCard, matchesFilters, matchesSearch, useDiscoverListings, type DiscoverListing } from '@padel/listings';
import { PlayerCard, PlayersStatus, usePlayers, type Player } from '@padel/players';
import { useDestinations } from '@padel/destinations';
import { activeTrip, useTrip } from '@padel/profiles';

import { useDebouncedValue } from '@/hooks/use-debounced-value';

type Filters = {
  destinationId: string | null;
  startDate: IsoDate | null;
  endDate: IsoDate | null;
  level: SkillTier | null;
};

const NO_FILTERS: Filters = { destinationId: null, startDate: null, endDate: null, level: null };

type DiscoverView = 'players' | 'matches';

type Row =
  | { kind: 'match'; key: string; listing: DiscoverListing }
  | { kind: 'player'; key: string; player: Player };

export default function DiscoverScreen() {
  const { t } = useTranslation('app');
  const { user } = useSession();
  const userId = user?.id;
  const router = useRouter();
  const requireAuth = useRequireAuth();
  const {
    destinationId: destinationParam,
    focusSearch,
    view: viewParam,
  } = useLocalSearchParams<{
    destinationId?: string;
    focusSearch?: string;
    view?: string;
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
  const [view, setView] = useState<DiscoverView>('matches');
  const [connectSheetOpen, setConnectSheetOpen] = useState(false);

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

  // Arriving with `?view=players` (for example after signing in from a Connect prompt) switches to
  // that view once, then the parameter is cleared so the same value can be used again later.
  const [appliedView, setAppliedView] = useState<string | undefined>(undefined);
  if (viewParam && viewParam !== appliedView) {
    setAppliedView(viewParam);
    if (viewParam === 'players' || viewParam === 'matches') setView(viewParam);
  } else if (!viewParam && appliedView) {
    setAppliedView(undefined);
  }
  useEffect(() => {
    if (viewParam) router.setParams({ view: undefined });
  }, [viewParam, router]);

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

  const debouncedSearch = useDebouncedValue(search);
  const playerFilters = useMemo(
    () => ({ destinationId: filters.destinationId, level: filters.level, query: debouncedSearch }),
    [filters.destinationId, filters.level, debouncedSearch],
  );
  const {
    players,
    total: playersTotal,
    isLoading: playersLoading,
    failed: playersFailed,
    hasMore: morePlayers,
    fetchMore: fetchMorePlayers,
    isFetchingMore: fetchingMorePlayers,
    refetch: refetchPlayers,
  } = usePlayers(playerFilters);

  async function refresh() {
    setRefreshing(true);
    await Promise.all([refetchListings(), refetchPlayers()]);
    setRefreshing(false);
  }

  function clearFilters() {
    setFilters(NO_FILTERS);
    setSearch('');
    setFilterVersion((v) => v + 1);
  }

  const visible = (listings ?? []).filter((l) => matchesFilters(l, filters) && matchesSearch(l, search));
  const rows: Row[] =
    view === 'players'
      ? players.map((player, index) => ({ kind: 'player', key: `player-${index}`, player }))
      : visible.map((listing) => ({ kind: 'match', key: listing.id, listing }));
  // A chosen destination stays visible even if the search text no longer matches it.
  const visibleDestinations = destinations?.filter(
    (d) => d.id === filters.destinationId || matchesSearchText(search, d.name, d.country),
  );

  const header = (
    <View style={{ gap: Spacing.three }}>
      <Logo />
      <ThemedText type="title">{t('discover.title')}</ThemedText>
      {view === 'players' ? (
        <ThemedText themeColor="textSecondary">{t('discover.playersSubtitle')}</ThemedText>
      ) : null}

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

      <SegmentedControl
        accessibilityLabel={t('discover.viewSwitchLabel')}
        value={view}
        onChange={setView}
        options={[
          { value: 'players', label: t('discover.tabPlayers'), count: playersLoading ? undefined : playersTotal },
          { value: 'matches', label: t('discover.tabMatches'), count: listings === null ? undefined : visible.length },
        ]}
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

      {view === 'matches' ? (
        <>
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
        </>
      ) : null}

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
          data={rows}
          keyExtractor={(row) => row.key}
          renderItem={({ item }) =>
            item.kind === 'match' ? (
              <ListingCard
                listing={item.listing}
                onPress={() => router.push({ pathname: '/match/[id]', params: { id: item.listing.id } })}
              />
            ) : (
              <PlayerCard
                player={item.player}
                // A guest is asked to sign in; a signed-in member sees the placeholder sheet.
                onConnect={() => {
                  if (requireAuth({ type: 'connectPlayer' })) setConnectSheetOpen(true);
                }}
              />
            )
          }
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
          contentContainerStyle={{ padding: Spacing.three, gap: Spacing.three }}
          ListHeaderComponent={header}
          ListFooterComponent={
            view === 'players' && morePlayers ? (
              <SecondaryButton
                title={t('discover.showMore')}
                onPress={fetchMorePlayers}
                disabled={fetchingMorePlayers}
              />
            ) : undefined
          }
          ListEmptyComponent={
            view === 'players' ? (
              <View>
                <PlayersStatus
                  state={playersFailed ? 'error' : playersLoading ? 'loading' : 'empty'}
                  onRetry={refetchPlayers}
                  onClearFilters={clearFilters}
                />
                {user && !playersFailed && !playersLoading ? (
                  <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center' }}>
                    {t('discover.playersEmptyHint')}
                  </ThemedText>
                ) : null}
              </View>
            ) : failed ? (
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
      <BottomSheet
        visible={connectSheetOpen}
        title={t('discover.connectSheetTitle')}
        onDismiss={() => setConnectSheetOpen(false)}>
        <ThemedText themeColor="textSecondary">{t('discover.connectSheetBody')}</ThemedText>
      </BottomSheet>
    </ThemedView>
  );
}
