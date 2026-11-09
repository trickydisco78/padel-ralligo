import {
  LEVELS_WANTED,
  MAX_PLAYERS_NEEDED,
  MIN_PLAYERS_NEEDED,
  parseTime,
  toIsoDate,
  validateListing,
  type FieldErrors,
  type IsoDate,
  type LevelWanted,
} from '@repo/core';
import { useState } from 'react';
import { View } from 'react-native';

import { useSession } from '@/auth/session';
import { Chip } from '@/components/chip';
import { DateField } from '@/components/date-field';
import { DestinationPicker } from '@/components/destination-picker';
import { PrimaryButton } from '@/components/primary-button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { createListing, updateListing, type MyListing } from '@/data/listings';

const PLAYER_COUNTS = Array.from(
  { length: MAX_PLAYERS_NEEDED - MIN_PLAYERS_NEEDED + 1 },
  (_, i) => MIN_PLAYERS_NEEDED + i,
);

type Props = {
  today?: IsoDate;
  /** When set, the form edits this listing instead of creating a new one. */
  existing?: MyListing;
  onPosted?: () => void;
};

export function ListingForm({ today = toIsoDate(new Date()), existing, onPosted }: Props) {
  const { user } = useSession();
  const [formKey, setFormKey] = useState(0);
  const [destinationId, setDestinationId] = useState<string | null>(existing?.destinationId ?? null);
  const [startDate, setStartDate] = useState<IsoDate | null>(existing?.startDate ?? null);
  const [endDate, setEndDate] = useState<IsoDate | null>(existing?.endDate ?? null);
  const [startTime, setStartTime] = useState(existing?.startTime ?? '');
  const [venue, setVenue] = useState(existing?.venue ?? '');
  const [levelWanted, setLevelWanted] = useState<LevelWanted>(existing?.levelWanted ?? 'Any');
  const [playersNeeded, setPlayersNeeded] = useState<number | null>(existing?.playersNeeded ?? null);
  const [description, setDescription] = useState(existing?.description ?? '');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [posting, setPosting] = useState(false);
  const [posted, setPosted] = useState(false);

  if (!user?.email_confirmed_at) {
    return (
      <ThemedText>
        Verify your email address to post a listing. Check your inbox for the link we sent when you signed up.
      </ThemedText>
    );
  }

  function reset() {
    setFormKey((k) => k + 1);
    setDestinationId(null);
    setStartDate(null);
    setEndDate(null);
    setStartTime('');
    setVenue('');
    setLevelWanted('Any');
    setPlayersNeeded(null);
    setDescription('');
  }

  async function submit() {
    setPosted(false);
    const time = startTime.trim() === '' ? null : parseTime(startTime);
    const result = validateListing(
      { destinationId, startDate, endDate, levelWanted, playersNeeded, description },
      // An unchanged start date that has since passed (an ongoing listing) is still allowed on edit.
      existing && startDate === existing.startDate ? startDate : today,
    );
    const found: FieldErrors = result.ok ? {} : { ...result.errors };
    if (startTime.trim() !== '' && time === null) found.startTime = 'Use the format HH:MM';
    if (Object.keys(found).length > 0 || !destinationId || !startDate || playersNeeded === null || !user) {
      setErrors(found);
      return;
    }

    setErrors({});
    setPosting(true);
    try {
      const listing = {
        destinationId,
        startDate,
        endDate,
        startTime: time,
        venue: venue.trim() || null,
        levelWanted,
        playersNeeded,
        description,
      };
      if (existing) {
        await updateListing(existing.id, listing);
      } else {
        await createListing(user.id, listing);
        reset();
      }
      setPosted(true);
      onPosted?.();
    } catch {
      setErrors({ form: 'Could not save your listing. Please try again.' });
    } finally {
      setPosting(false);
    }
  }

  return (
    <View key={formKey} style={{ gap: Spacing.three }}>
      <DestinationPicker value={destinationId} onChange={setDestinationId} error={errors.destinationId} />
      <DateField label="Start date" value={startDate} onChange={setStartDate} error={errors.startDate} />
      <DateField label="End date (optional)" value={endDate} onChange={setEndDate} error={errors.endDate} />
      <TextField
        label="Start time (optional)"
        value={startTime}
        onChangeText={setStartTime}
        placeholder="HH:MM"
        keyboardType="numbers-and-punctuation"
        error={errors.startTime}
      />
      <TextField label="Venue (optional)" value={venue} onChangeText={setVenue} />

      <View style={{ gap: Spacing.one }}>
        <ThemedText type="smallBold">Level wanted</ThemedText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two }}>
          {LEVELS_WANTED.map((level) => (
            <Chip key={level} label={level} selected={level === levelWanted} onPress={() => setLevelWanted(level)} />
          ))}
        </View>
        {errors.levelWanted ? <ThemedText type="small" style={{ color: '#C62828' }}>{errors.levelWanted}</ThemedText> : null}
      </View>

      <View style={{ gap: Spacing.one }}>
        <ThemedText type="smallBold">Players needed</ThemedText>
        <View style={{ flexDirection: 'row', gap: Spacing.two }}>
          {PLAYER_COUNTS.map((n) => (
            <Chip key={n} label={String(n)} selected={n === playersNeeded} onPress={() => setPlayersNeeded(n)} />
          ))}
        </View>
        {errors.playersNeeded ? <ThemedText type="small" style={{ color: '#C62828' }}>{errors.playersNeeded}</ThemedText> : null}
      </View>

      <TextField
        label="Description (optional)"
        value={description}
        onChangeText={setDescription}
        error={errors.description}
        multiline
        style={{ minHeight: 80, textAlignVertical: 'top' }}
      />

      {errors.form ? <ThemedText type="small" style={{ color: '#C62828' }}>{errors.form}</ThemedText> : null}
      {posted ? <ThemedText themeColor="primary">{existing ? 'Changes saved' : 'Listing posted'}</ThemedText> : null}
      <PrimaryButton title={existing ? 'Save changes' : 'Post listing'} onPress={submit} disabled={posting} />
    </View>
  );
}
