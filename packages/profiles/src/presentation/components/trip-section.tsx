import { toIsoDate, type FieldErrors, type IsoDate } from '@padel/core';
import { useState } from 'react';
import { View } from 'react-native';

import { useSession } from '@padel/auth';
import { DestinationPicker } from '@padel/destinations';
import { DateField, PrimaryButton, ThemedText, Spacing } from '@padel/ui';

import { activeTrip, validateTrip, type Trip } from '../../domain/trip';
import { useClearTrip, useSaveTrip, useTrip } from '../hooks/use-trip';

export function TripSection({ today = toIsoDate(new Date()) }: { today?: IsoDate }) {
  const { user } = useSession();
  const userId = user?.id;
  const { data: trip, isPending } = useTrip(userId);

  // Nothing to show until the saved trip has been looked up (or without a signed-in user).
  if (!userId || isPending) return null;
  return <TripForm key={userId} userId={userId} initialTrip={trip ?? null} today={today} />;
}

function TripForm({ userId, initialTrip, today }: { userId: string; initialTrip: Trip | null; today: IsoDate }) {
  const saveTrip = useSaveTrip();
  const clearTrip = useClearTrip();
  const [destinationId, setDestinationId] = useState<string | null>(initialTrip?.destinationId ?? null);
  const [startDate, setStartDate] = useState<IsoDate | null>(initialTrip?.startDate ?? null);
  const [endDate, setEndDate] = useState<IsoDate | null>(initialTrip?.endDate ?? null);
  const [ended, setEnded] = useState(initialTrip ? activeTrip(initialTrip, today) === null : false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState<string | null>(null);

  async function save() {
    setMessage(null);
    const result = validateTrip({ destinationId, startDate, endDate });
    if (!result.ok || !destinationId || !startDate || !endDate) {
      setErrors(result.ok ? {} : result.errors);
      return;
    }
    setErrors({});
    try {
      await saveTrip.mutateAsync({ userId, trip: { destinationId, startDate, endDate } });
      setEnded(endDate < today);
      setMessage('Trip saved');
    } catch {
      setErrors({ form: 'Could not save your trip. Please try again.' });
    }
  }

  async function clear() {
    try {
      await clearTrip.mutateAsync(userId);
      setDestinationId(null);
      setStartDate(null);
      setEndDate(null);
      setEnded(false);
      setErrors({});
      setMessage('Trip cleared');
    } catch {
      setErrors({ form: 'Could not clear your trip. Please try again.' });
    }
  }

  return (
    <View style={{ gap: Spacing.three }}>
      <ThemedText type="subtitle">Your current trip</ThemedText>
      <ThemedText themeColor="textSecondary">
        Discover opens filtered to this destination and these dates.
      </ThemedText>
      {ended ? <ThemedText themeColor="textSecondary">This trip has ended.</ThemedText> : null}
      <DestinationPicker value={destinationId} onChange={setDestinationId} error={errors.destinationId} />
      <DateField key={`s-${startDate ?? ''}`} label="Start date" value={startDate} onChange={setStartDate} error={errors.startDate} />
      <DateField key={`e-${endDate ?? ''}`} label="End date" value={endDate} onChange={setEndDate} error={errors.endDate} />
      {errors.form ? (
        <ThemedText type="small" style={{ color: '#C62828' }}>
          {errors.form}
        </ThemedText>
      ) : null}
      {message ? <ThemedText themeColor="primary">{message}</ThemedText> : null}
      <PrimaryButton title="Save trip" onPress={save} />
      <PrimaryButton title="Clear trip" onPress={clear} />
    </View>
  );
}
