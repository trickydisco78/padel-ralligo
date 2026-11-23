import { formatDateRange, matchesSearchText, toIsoDate } from '@padel/core';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState, type ComponentRef } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useRequireAuth, useSession } from '@padel/auth';
import { useDestinations } from '@padel/destinations';
import { useTranslation } from '@padel/i18n';
import { ListingCard, matchesFilters, matchesSearch, useDiscoverListings, type DiscoverListing } from '@padel/listings';
import {
  PlayerCard,
  PlayersStatus,
  useOverlappingPlayers,
  usePlayers,
  type OverlapPlayer,
  type Player,
} from '@padel/players';
import { SavedTripsRow, useTripsOverview } from '@padel/trips';
import { AppBar, Banner, BottomSheet, Button, Icon, SearchField, SegmentedControl, spacing, ThemedText, ThemedView } from '@padel/ui';

import { DiscoverFilterBlock, NO_FILTERS, type DiscoverFilters } from '@/components/discover-filters';
import { resolveSelectedTrip } from '@/discover/trip-selection';
import { useCollapsingHeader } from '@/hooks/use-collapsing-header';
import { useDebouncedValue } from '@/hooks/use-debounced-value';

type DiscoverView = 'players' | 'matches';
type DiscoverMode = 'trips' | 'explore';

type Row =
  | { kind: 'match'; key: string; listing: DiscoverListing }
  | { kind: 'player'; key: string; player: Player | OverlapPlayer };

const isOverlapPlayer = (player: Player | OverlapPlayer): player is OverlapPlayer => 'overlapDays' in player;

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
  const today = toIsoDate(new Date());
  const { destinations } = useDestinations();
  const { listings, failed, refetch: refetchListings } = useDiscoverListings();
  const tripsOverview = useTripsOverview(userId, today);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const searchInput = useRef<ComponentRef<typeof TextInput>>(null);
  const [filters, setFilters] = useState<DiscoverFilters>(NO_FILTERS);
  // Bumped when filters are replaced from outside, so the typed date fields pick up the new values.
  const [filterVersion, setFilterVersion] = useState(0);
  // Null until the user picks a side; My trips defaults to Players, Explore places to Open matches.
  const [chosenView, setChosenView] = useState<DiscoverView | null>(null);
  const { scrollY, onScroll, scrollEventThrottle } = useCollapsingHeader();
  const [chosenMode, setChosenMode] = useState<DiscoverMode | null>(null);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [thisWeek, setThisWeek] = useState(false);
  const [myLevel, setMyLevel] = useState(false);
  const [connectSheetOpen, setConnectSheetOpen] = useState(false);

  // A different user (or signing out) starts again from the defaults. Adjusted during render.
  const [seenUserId, setSeenUserId] = useState(userId);
  if (seenUserId !== userId) {
    setSeenUserId(userId);
    setChosenMode(null);
    setChosenView(null);
    setSelectedTripId(null);
    setThisWeek(false);
    setMyLevel(false);
  }

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
    if (viewParam === 'players' || viewParam === 'matches') setChosenView(viewParam);
  } else if (!viewParam && appliedView) {
    setAppliedView(undefined);
  }
  useEffect(() => {
    if (viewParam) router.setParams({ view: undefined });
  }, [viewParam, router]);

  // A destination chosen elsewhere (e.g. a Home shortcut) replaces the filters. It is an Explore
  // choice, so it also brings Explore places forward. Adjusted during render, keyed on the param.
  const [appliedParam, setAppliedParam] = useState<string | undefined>(undefined);
  if (destinationParam && destinationParam !== appliedParam) {
    setAppliedParam(destinationParam);
    setFilters({ ...NO_FILTERS, destinationId: destinationParam });
    setFilterVersion((v) => v + 1);
    setChosenMode('explore');
    setChosenView(null);
  }

  // Members with an upcoming trip open on My trips; everyone else on Explore places.
  const trips = tripsOverview.trips;
  const resolvingMode = !!user && chosenMode === null && tripsOverview.isLoading;
  const mode: DiscoverMode = !user ? 'explore' : (chosenMode ?? (trips.length > 0 ? 'trips' : 'explore'));
  const view: DiscoverView = chosenView ?? (mode === 'trips' ? 'players' : 'matches');
  const selectedTrip = mode === 'trips' ? resolveSelectedTrip(trips, selectedTripId, today) : null;

  const debouncedSearch = useDebouncedValue(search);
  const playerFilters = useMemo(
    () => ({ destinationId: filters.destinationId, level: filters.level, query: debouncedSearch }),
    [filters.destinationId, filters.level, debouncedSearch],
  );
  const explorePlayers = usePlayers(playerFilters);
  const overlapFilters = useMemo(() => ({ myLevel, thisWeek, query: debouncedSearch }), [myLevel, thisWeek, debouncedSearch]);
  const overlapPlayers = useOverlappingPlayers(selectedTrip?.id ?? null, overlapFilters);

  const tripsMode = mode === 'trips';
  const playersList = tripsMode ? overlapPlayers : explorePlayers;

  async function refresh() {
    setRefreshing(true);
    await Promise.all([refetchListings(), explorePlayers.refetch(), tripsOverview.refetch(), overlapPlayers.refetch()]);
    setRefreshing(false);
  }

  function clearFilters() {
    setFilters(NO_FILTERS);
    setSearch('');
    setThisWeek(false);
    setMyLevel(false);
    setFilterVersion((v) => v + 1);
  }

  const exploreMatches = (listings ?? []).filter((l) => matchesFilters(l, filters) && matchesSearch(l, search));
  // Open matches for a trip: at its destination, during its dates.
  const tripMatches = selectedTrip
    ? (listings ?? []).filter((l) =>
        matchesFilters(l, {
          destinationId: selectedTrip.destinationId,
          startDate: selectedTrip.startDate,
          endDate: selectedTrip.endDate,
          level: null,
        }),
      )
    : [];
  const matches = tripsMode ? tripMatches : exploreMatches;

  const rows: Row[] = resolvingMode
    ? []
    : view === 'players'
      ? playersList.players.map((player, index) => ({ kind: 'player', key: `player-${index}`, player }))
      : matches.map((listing) => ({ kind: 'match', key: listing.id, listing }));

  // A chosen destination stays visible even if the search text no longer matches it.
  const visibleDestinations = destinations?.filter(
    (d) => d.id === filters.destinationId || matchesSearchText(search, d.name, d.country),
  );
  const exploreDestinationName = destinations?.find((d) => d.id === filters.destinationId)?.name;

  const heading = user ? t('discover.title') : t('discover.titleGuest');
  const searchPlaceholder = tripsMode
    ? t('discover.searchPlaceholderTrips')
    : t(view === 'players' ? 'discover.searchPlaceholderExplore' : 'discover.searchPlaceholder');
  // In My trips the search narrows the overlapping players by name; it has nothing to do for matches.
  const showSearch = !(tripsMode && view === 'matches');
  const playersCount = playersList.isLoading ? undefined : playersList.total;

  const header = (
    <View style={{ gap: spacing.space4 }}>
      {user ? (
        <SegmentedControl
          accessibilityLabel={t('discover.modeSwitchLabel')}
          value={mode}
          onChange={(next) => {
            setChosenMode(next);
            setChosenView(null);
          }}
          options={[
            {
              value: 'trips',
              label: t('discover.modeTrips'),
              icon: <Icon name="calendar" size={16} color="muted" />,
            },
            {
              value: 'explore',
              label: t('discover.modeExplore'),
              icon: <Icon name="compass" size={16} color="muted" />,
            },
          ]}
        />
      ) : null}

      {showSearch ? (
        <SearchField
          ref={searchInput}
          accessibilityLabel={t('discover.searchLabel')}
          value={search}
          onChangeText={setSearch}
          placeholder={searchPlaceholder}
        />
      ) : null}

      {tripsMode && trips.length > 0 ? (
        <View style={{ gap: spacing.space1 }}>
          <ThemedText type="label" themeColor="muted" style={{ textTransform: 'uppercase' }}>
            {t('discover.savedTrips')}
          </ThemedText>
          <SavedTripsRow trips={trips} selectedTripId={selectedTrip?.id ?? null} onSelect={setSelectedTripId} />
        </View>
      ) : null}

      {!tripsMode || selectedTrip ? (
        <SegmentedControl
          accessibilityLabel={t('discover.viewSwitchLabel')}
          value={view}
          onChange={setChosenView}
          options={[
            { value: 'players', label: t('discover.tabPlayers'), count: playersCount },
            { value: 'matches', label: t('discover.tabMatches'), count: listings === null ? undefined : matches.length },
          ]}
        />
      ) : null}

      {tripsMode ? null : (
        <DiscoverFilterBlock
          filters={filters}
          onChange={setFilters}
          destinations={visibleDestinations}
          showDates={view === 'matches'}
          filterVersion={filterVersion}
        />
      )}

      {tripsMode && selectedTrip && view === 'players' ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.space2 }}>
          <Button variant="choice" title={t('discover.thisWeek')} selected={thisWeek} onPress={() => setThisWeek((v) => !v)} />
          <Button variant="choice" title={t('discover.myLevel')} selected={myLevel} onPress={() => setMyLevel((v) => !v)} />
        </View>
      ) : null}

      {tripsMode && selectedTrip ? (
        <Banner icon="calendar">
          {t('discover.noticeTrips', {
            destination: selectedTrip.destinationName,
            dates: formatDateRange(selectedTrip.startDate, selectedTrip.endDate),
          })}
        </Banner>
      ) : null}
      {!tripsMode && view === 'players' ? (
        <Banner icon="globe">
          {t('discover.noticeExplore')}
        </Banner>
      ) : null}

      {view === 'players' && (!tripsMode || selectedTrip) ? (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <ThemedText type="headline" accessibilityRole="header" style={{ flexShrink: 1 }}>
            {tripsMode
              ? t('discover.playersIn', { destination: selectedTrip?.destinationName })
              : exploreDestinationName
                ? t('discover.publicPlayersIn', { destination: exploreDestinationName })
                : t('discover.publicPlayers')}
          </ThemedText>
          {playersCount === undefined ? null : (
            <ThemedText type="label" themeColor="pink700">
              {t(tripsMode ? 'discover.overlapCount' : 'discover.playersCount', { count: playersCount })}
            </ThemedText>
          )}
        </View>
      ) : null}
    </View>
  );

  const emptyTrips = tripsMode && !selectedTrip;
  const empty = resolvingMode ? (
    <ActivityIndicator />
  ) : emptyTrips ? (
    tripsOverview.failed ? (
      <View style={{ gap: spacing.space4 }}>
        <ThemedText accessibilityRole="alert" themeColor="error600">
          {t('discover.tripsError')}
        </ThemedText>
        <Button variant="secondary" title={t('discover.tripsRetry')} onPress={() => tripsOverview.refetch()} />
      </View>
    ) : tripsOverview.isLoading ? (
      <ActivityIndicator />
    ) : (
      <View style={{ gap: spacing.space4 }}>
        <ThemedText type="label">{t('discover.noTrips')}</ThemedText>
        <ThemedText themeColor="muted">{t('discover.noTripsHint')}</ThemedText>
        <Button title={t('discover.addTrip')} onPress={() => router.navigate('/profile')} />
      </View>
    )
  ) : view === 'players' ? (
    <View>
      <PlayersStatus
        state={playersList.failed ? 'error' : playersList.isLoading ? 'loading' : 'empty'}
        onRetry={playersList.refetch}
        onClearFilters={clearFilters}
      />
      {!playersList.failed && !playersList.isLoading ? (
        tripsMode ? (
          <ThemedText type="caption" themeColor="muted" style={{ textAlign: 'center' }}>
            {t('discover.noOverlapsHint')}
          </ThemedText>
        ) : user ? (
          <ThemedText type="caption" themeColor="muted" style={{ textAlign: 'center' }}>
            {t('discover.playersEmptyHint')}
          </ThemedText>
        ) : null
      ) : null}
    </View>
  ) : failed ? (
    <ThemedText themeColor="error600">{t('discover.error')}</ThemedText>
  ) : listings === null ? (
    <ActivityIndicator />
  ) : (
    <View style={{ gap: spacing.space4 }}>
      <ThemedText themeColor="muted">{t('discover.noMatches')}</ThemedText>
      <Button title={t('discover.clearFilters')} onPress={clearFilters} />
    </View>
  );

  return (
    <ThemedView style={{ flex: 1 }}>
      <AppBar
        title={heading}
        subtitle={tripsMode ? t('discover.subtitleTrips') : t('discover.subtitleExplore')}
        scrollY={scrollY}
      />
      {/* The bar pads for the status bar itself, so the safe area here covers the sides and bottom only. */}
      <SafeAreaView edges={['left', 'right', 'bottom']} style={{ flex: 1 }}>
        <FlatList
          testID="discover-list"
          onScroll={onScroll}
          scrollEventThrottle={scrollEventThrottle}
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
                guest={!user}
                overlap={
                  isOverlapPlayer(item.player) && selectedTrip
                    ? {
                        startDate: item.player.tripStart,
                        endDate: item.player.tripEnd,
                        days: item.player.overlapDays,
                        tripDays: selectedTrip.days,
                      }
                    : undefined
                }
                // A guest is asked to sign in; a signed-in member sees the placeholder sheet.
                onConnect={() => {
                  if (requireAuth({ type: 'connectPlayer' })) setConnectSheetOpen(true);
                }}
              />
            )
          }
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
          contentContainerStyle={{ padding: spacing.space4, gap: spacing.space4 }}
          ListHeaderComponent={header}
          ListFooterComponent={
            view === 'players' && playersList.hasMore ? (
              <Button variant="secondary"
                title={t('discover.showMore')}
                onPress={playersList.fetchMore}
                disabled={playersList.isFetchingMore}
              />
            ) : undefined
          }
          ListEmptyComponent={empty}
        />
      </SafeAreaView>
      <BottomSheet
        visible={connectSheetOpen}
        title={t('discover.connectSheetTitle')}
        onDismiss={() => setConnectSheetOpen(false)}>
        <ThemedText themeColor="muted">{t('discover.connectSheetBody')}</ThemedText>
      </BottomSheet>
    </ThemedView>
  );
}
