import { toIsoDate, validateTrip, type FieldErrors, type IsoDate } from '@repo/core';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { useSession } from '@/auth/session';
import { DateField } from '@/components/date-field';
import { DestinationPicker } from '@/components/destination-picker';
import { PrimaryButton } from '@/components/primary-button';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { activeTrip, clearTrip, fetchTrip, saveTrip } from '@/data/trip';

export function TripSection({ today = toIsoDate(new Date()) }: { today?: IsoDate }) {
  const { user } = useSession();
  const userId = user?.id;
  const [loaded, setLoaded] = useState(false);
  const [destinationId, setDestinationId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<IsoDate | null>(null);
  const [endDate, setEndDate] = useState<IsoDate | null>(null);
  const [ended, setEnded] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    fetchTrip(userId)
      .then((trip) => {
        if (cancelled) return;
        if (trip) {
          setDestinationId(trip.destinationId);
          setStartDate(trip.startDate);
          setEndDate(trip.endDate);
          setEnded(activeTrip(trip, today) === null);
        }
        setLoaded(true);
      })
      .catch(() => !cancelled && setLoaded(true));
    return () => {
      cancelled = true;
    };
  }, [userId, today]);

  async function save() {
    setMessage(null);
    const result = validateTrip({ destinationId, startDate, endDate });
    if (!result.ok || !destinationId || !startDate || !endDate || !userId) {
      setErrors(result.ok ? {} : result.errors);
      return;
    }
    setErrors({});
    try {
      await saveTrip(userId, { destinationId, startDate, endDate });
      setEnded(endDate < today);
      setMessage('Trip saved');
    } catch {
      setErrors({ form: 'Could not save your trip. Please try again.' });
    }
  }

  async function clear() {
    if (!userId) return;
    try {
      await clearTrip(userId);
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

  if (!loaded) return null;

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
