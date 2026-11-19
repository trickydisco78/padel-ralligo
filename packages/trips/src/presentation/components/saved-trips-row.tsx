import { formatDateRange } from '@padel/core';
import { useTranslation } from '@padel/i18n';
import { Pressable, ScrollView, View } from 'react-native';

import { borderWidth, colors, Icon, radius, spacing, ThemedText } from '@padel/ui';

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
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.space2 }}>
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
              padding: spacing.space4,
              gap: spacing.space1,
              borderRadius: radius.lg,
              borderWidth,
              borderColor: selected ? colors.pink500 : colors.line,
              backgroundColor: selected ? colors.pink100 : colors.surfaceSoft,
            }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.space2 }}>
              <ThemedText type="label">{trip.destinationName}</ThemedText>
              {selected ? <Icon name="check" color="pink700" size={18} /> : null}
            </View>
            <ThemedText type="caption" themeColor="muted">
              {t('savedTrips.place', { country: trip.destinationCountry, dates })}
            </ThemedText>
            <ThemedText type="caption">{summary}</ThemedText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
