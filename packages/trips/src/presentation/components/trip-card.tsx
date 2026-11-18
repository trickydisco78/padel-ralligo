import { formatDateRange } from '@padel/core';
import { useTranslation } from '@padel/i18n';
import { Pressable, View } from 'react-native';

import { Card, Spacing, ThemedText } from '@padel/ui';

import type { Trip } from '../../domain/trip';

type Props = {
  trip: Trip;
  ended: boolean;
  /** Ended trips cannot be edited, only deleted. */
  onEdit?: () => void;
  onDelete: () => void;
};

function Action({ title, label, onPress }: { title: string; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} hitSlop={8}>
      <ThemedText type="smallBold" themeColor="primaryDark">
        {title}
      </ThemedText>
    </Pressable>
  );
}

export function TripCard({ trip, ended, onEdit, onDelete }: Props) {
  const { t } = useTranslation('trips');
  const dates = formatDateRange(trip.startDate, trip.endDate);
  const sharing = t(trip.visibility === 'members' ? 'tripsSection.shared' : 'tripsSection.private');

  return (
    <Card>
      <ThemedText type="smallBold">{trip.destinationName}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {dates}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {ended ? t('tripsSection.ended') : sharing}
      </ThemedText>
      <View style={{ flexDirection: 'row', gap: Spacing.four }}>
        {onEdit && !ended ? (
          <Action title={t('tripsSection.edit')} label={t('tripsSection.editLabel', { destination: trip.destinationName })} onPress={onEdit} />
        ) : null}
        <Action title={t('tripsSection.delete')} label={t('tripsSection.deleteLabel', { destination: trip.destinationName })} onPress={onDelete} />
      </View>
    </Card>
  );
}
