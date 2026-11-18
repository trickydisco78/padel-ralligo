import { toIsoDate, type FieldErrors, type IsoDate } from '@padel/core';
import { translateFieldErrors, useTranslation } from '@padel/i18n';
import { useState } from 'react';
import { View } from 'react-native';

import { useSession } from '@padel/auth';
import { DestinationPicker } from '@padel/destinations';
import { CheckRow, DateField, PrimaryButton, SecondaryButton, Spacing, ThemedText } from '@padel/ui';

import { isPastTrip, MAX_TRIPS, validateTrip, type Trip } from '../../domain/trip';
import { useDeleteTrip, useSaveTrip, useTrips } from '../hooks/use-trips';
import { TripCard } from './trip-card';

const ERROR_COLOR = '#C62828';

/** The Profile section: the member's trips, with add, edit, delete and the share choice. */
export function TripsSection({ today = toIsoDate(new Date()) }: { today?: IsoDate }) {
  const { user } = useSession();
  const userId = user?.id;
  const { data: trips, isPending, isError, refetch } = useTrips(userId);
  const deleteTrip = useDeleteTrip();
  const { t } = useTranslation('trips');
  // `new` adds a trip; a Trip edits it; null shows the list only.
  const [editing, setEditing] = useState<Trip | 'new' | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!userId) return null;

  const heading = <ThemedText type="subtitle">{t('tripsSection.title')}</ThemedText>;
  if (isError) {
    return (
      <View style={{ gap: Spacing.three }}>
        {heading}
        <ThemedText style={{ color: ERROR_COLOR }}>{t('tripsSection.loadFailed')}</ThemedText>
        <SecondaryButton title={t('tripsSection.retry')} onPress={() => void refetch()} />
      </View>
    );
  }
  if (isPending) return null;

  const upcoming = trips.filter((trip) => !isPastTrip(trip, today)).sort(byStart);
  const ended = trips.filter((trip) => isPastTrip(trip, today)).sort(byStart);
  const atLimit = trips.length >= MAX_TRIPS;

  async function remove(trip: Trip) {
    setMessage(null);
    setError(null);
    try {
      await deleteTrip.mutateAsync({ userId: userId!, id: trip.id });
      if (editing !== 'new' && editing?.id === trip.id) setEditing(null);
      setMessage(t('tripsSection.deleted'));
    } catch {
      setError(t('tripsSection.deleteFailed'));
    }
  }

  function startEditing(next: Trip | 'new') {
    setMessage(null);
    setError(null);
    setEditing(next);
  }

  return (
    <View style={{ gap: Spacing.three }}>
      {heading}
      <ThemedText themeColor="textSecondary">{t('tripsSection.intro')}</ThemedText>

      {trips.length === 0 && editing === null ? <ThemedText>{t('tripsSection.empty')}</ThemedText> : null}
      {upcoming.map((trip) => (
        <TripCard key={trip.id} trip={trip} ended={false} onEdit={() => startEditing(trip)} onDelete={() => remove(trip)} />
      ))}
      {ended.map((trip) => (
        <TripCard key={trip.id} trip={trip} ended onDelete={() => remove(trip)} />
      ))}

      {error ? <ThemedText type="small" style={{ color: ERROR_COLOR }}>{error}</ThemedText> : null}
      {message ? <ThemedText themeColor="primary">{message}</ThemedText> : null}

      {editing !== null ? (
        <TripForm
          key={editing === 'new' ? 'new' : editing.id}
          userId={userId}
          trip={editing === 'new' ? null : editing}
          count={trips.length}
          onDone={(saved) => {
            setEditing(null);
            if (saved) setMessage(t('tripsSection.saved'));
          }}
        />
      ) : atLimit ? (
        <ThemedText themeColor="textSecondary">{t('validation.limitReached')}</ThemedText>
      ) : (
        <PrimaryButton title={t('tripsSection.add')} onPress={() => startEditing('new')} />
      )}
    </View>
  );
}

const byStart = (a: Trip, b: Trip) => a.startDate.localeCompare(b.startDate) || a.endDate.localeCompare(b.endDate);

type FormProps = {
  userId: string;
  trip: Trip | null;
  count: number;
  onDone: (saved: boolean) => void;
};

function TripForm({ userId, trip, count, onDone }: FormProps) {
  const { t } = useTranslation('trips');
  const saveTrip = useSaveTrip();
  const [destinationId, setDestinationId] = useState<string | null>(trip?.destinationId ?? null);
  const [startDate, setStartDate] = useState<IsoDate | null>(trip?.startDate ?? null);
  const [endDate, setEndDate] = useState<IsoDate | null>(trip?.endDate ?? null);
  const [shared, setShared] = useState(trip?.visibility === 'members');
  const [errors, setErrors] = useState<FieldErrors>({});

  async function save() {
    const result = validateTrip({ destinationId, startDate, endDate });
    if (!result.ok || !destinationId || !startDate || !endDate) {
      setErrors(result.ok ? {} : result.errors);
      return;
    }
    if (!trip && count >= MAX_TRIPS) {
      setErrors({ form: 'validation.limitReached' });
      return;
    }
    setErrors({});
    try {
      await saveTrip.mutateAsync({
        userId,
        draft: { id: trip?.id, destinationId, startDate, endDate, visibility: shared ? 'members' : 'hidden' },
      });
      onDone(true);
    } catch {
      setErrors({ form: 'tripsSection.saveFailed' });
    }
  }

  // Field errors (and `form`) are translation keys.
  const messages = translateFieldErrors(t, errors);

  return (
    <View style={{ gap: Spacing.three }}>
      <ThemedText type="smallBold">{t(trip ? 'tripsSection.formEditTitle' : 'tripsSection.formAddTitle')}</ThemedText>
      <DestinationPicker
        label={t('tripsSection.destination')}
        value={destinationId}
        onChange={setDestinationId}
        error={messages.destinationId}
      />
      <DateField label={t('tripsSection.startDate')} value={startDate} onChange={setStartDate} error={messages.startDate} />
      <DateField label={t('tripsSection.endDate')} value={endDate} onChange={setEndDate} error={messages.endDate} />
      <CheckRow label={t('tripsSection.share')} checked={shared} onChange={setShared} />
      <ThemedText type="small" themeColor="textSecondary">
        {t('tripsSection.shareHelp')}
      </ThemedText>
      {errors.form ? (
        <ThemedText type="small" style={{ color: ERROR_COLOR }}>
          {messages.form}
        </ThemedText>
      ) : null}
      <PrimaryButton title={t('tripsSection.save')} onPress={save} busy={saveTrip.isPending} />
      <SecondaryButton title={t('tripsSection.cancel')} onPress={() => onDone(false)} />
    </View>
  );
}
