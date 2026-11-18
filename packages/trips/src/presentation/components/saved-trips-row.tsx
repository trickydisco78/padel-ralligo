import { formatDateRange } from '@padel/core';
import { useTranslation } from '@padel/i18n';
import { Pressable, ScrollView, View } from 'react-native';

import { Colors, Radius, Spacing, ThemedText } from '@padel/ui';

import type { TripOverview } from '../../domain/trip';

type Props = {
  trips: TripOverview[];
  selectedTripId: string | null;
  onSelect: (id: string) => void;
};

/** A horizontal row of selectable trip cards: destination, country and dates, length and overlap count. */
export function SavedTripsRow({ trips, selectedTripId, onSelect }: Props) {
  const { t } = useTranslation('trips');

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.two }}>
      {trips.map((trip) => {
        const selected = trip.id === selectedTripId;
        const dates = formatDateRange(trip.startDate, trip.endDate);
        const days = t('savedTrips.days', { count: trip.days });
        const summary =
          trip.overlapPlayers > 0
            ? t('savedTrips.overlap', { days, players: t('savedTrips.players', { count: trip.overlapPlayers }) })
            : t('savedTrips.noOverlap', { days });
        const state = t(selected ? 'savedTrips.selected' : 'savedTrips.notSelected');

        return (
          <Pressable
            key={trip.id}
            accessibilityRole="button"
            accessibilityLabel={t('savedTrips.card', { destination: trip.destinationName, dates, summary, state })}
            accessibilityState={{ selected }}
            onPress={() => onSelect(trip.id)}
            style={{
              minWidth: 200,
              padding: Spacing.three,
              gap: Spacing.one,
              borderRadius: Radius.card,
              borderWidth: selected ? 2 : 1,
              borderColor: selected ? Colors.light.primary : Colors.light.border,
              backgroundColor: selected ? Colors.light.primaryTint : Colors.light.backgroundElement,
            }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.two }}>
              <ThemedText type="smallBold">{trip.destinationName}</ThemedText>
              {selected ? (
                <ThemedText type="smallBold" themeColor="primary">
                  ✓
                </ThemedText>
              ) : null}
            </View>
            <ThemedText type="small" themeColor="textSecondary">
              {t('savedTrips.place', { country: trip.destinationCountry, dates })}
            </ThemedText>
            <ThemedText type="small">{summary}</ThemedText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
