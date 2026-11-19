import { parseTime, toIsoDate, type FieldErrors, type IsoDate } from '@padel/core';
import { translateFieldErrors, useTranslation } from '@padel/i18n';
import { useState } from 'react';
import { View } from 'react-native';

import { useSession } from '@padel/auth';
import { DateField, Button, FormField, ThemedText, spacing } from '@padel/ui';
import { DestinationPicker } from '@padel/destinations';

import {
  LEVELS_WANTED,
  MAX_DESCRIPTION_LENGTH,
  MAX_PLAYERS_NEEDED,
  MIN_PLAYERS_NEEDED,
  validateListing,
  type LevelWanted,
  type MyListing,
} from '../../domain/listing';
import { useCreateListing, useUpdateListing } from '../hooks/use-listings';

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
  const { t } = useTranslation('listings');
  const { user } = useSession();
  const createListing = useCreateListing();
  const updateListing = useUpdateListing();
  const [formKey, setFormKey] = useState(0);
  const [destinationId, setDestinationId] = useState<string | null>(existing?.destinationId ?? null);
  const [startDate, setStartDate] = useState<IsoDate | null>(existing?.startDate ?? null);
  const [endDate, setEndDate] = useState<IsoDate | null>(existing?.endDate ?? null);
  const [startTime, setStartTime] = useState(existing?.startTime ?? '');
  const [venue, setVenue] = useState(existing?.venue ?? '');
  const [levelWanted, setLevelWanted] = useState<LevelWanted>(existing?.levelWanted ?? 'Any');
  const [playersNeeded, setPlayersNeeded] = useState<number | null>(existing?.playersNeeded ?? null);
  const [description, setDescription] = useState(existing?.description ?? '');
  // Field errors are translation keys, translated at render.
  const [fieldErrors, setErrors] = useState<FieldErrors>({});
  const [posting, setPosting] = useState(false);
  const [posted, setPosted] = useState(false);

  if (!user?.emailConfirmed) {
    return (
      <ThemedText>{t('listingForm.verifyEmail')}</ThemedText>
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
    if (startTime.trim() !== '' && time === null) found.startTime = 'validation.timeFormat';
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
        await updateListing.mutateAsync({ id: existing.id, listing });
      } else {
        await createListing.mutateAsync({ userId: user.id, listing });
        reset();
      }
      setPosted(true);
      onPosted?.();
    } catch {
      setErrors({ form: 'listingForm.saveFailed' });
    } finally {
      setPosting(false);
    }
  }

  const errors = translateFieldErrors(t, fieldErrors, {
    min: MIN_PLAYERS_NEEDED,
    max: MAX_PLAYERS_NEEDED,
    maxLength: MAX_DESCRIPTION_LENGTH,
  });

  return (
    <View key={formKey} style={{ gap: spacing.space4 }}>
      <DestinationPicker value={destinationId} onChange={setDestinationId} error={errors.destinationId} />
      <DateField label={t('listingForm.startDate')} value={startDate} onChange={setStartDate} error={errors.startDate} />
      <DateField label={t('listingForm.endDate')} value={endDate} onChange={setEndDate} error={errors.endDate} />
      <FormField
        label={t('listingForm.startTime')}
        value={startTime}
        onChangeText={setStartTime}
        placeholder={t('listingForm.startTimePlaceholder')}
        keyboardType="numbers-and-punctuation"
        error={errors.startTime}
      />
      <FormField label={t('listingForm.venue')} value={venue} onChangeText={setVenue} />

      <View style={{ gap: spacing.space1 }}>
        <ThemedText type="label">{t('listingForm.levelWanted')}</ThemedText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.space2 }}>
          {LEVELS_WANTED.map((level) => (
            <Button variant="choice" key={level} title={level === 'Any' ? t('listingForm.levelAny') : level} selected={level === levelWanted} onPress={() => setLevelWanted(level)} />
          ))}
        </View>
        {errors.levelWanted ? <ThemedText type="caption" themeColor="error600">{errors.levelWanted}</ThemedText> : null}
      </View>

      <View style={{ gap: spacing.space1 }}>
        <ThemedText type="label">{t('listingForm.playersNeeded')}</ThemedText>
        <View style={{ flexDirection: 'row', gap: spacing.space2 }}>
          {PLAYER_COUNTS.map((n) => (
            <Button variant="choice" key={n} title={String(n)} selected={n === playersNeeded} onPress={() => setPlayersNeeded(n)} />
          ))}
        </View>
        {errors.playersNeeded ? <ThemedText type="caption" themeColor="error600">{errors.playersNeeded}</ThemedText> : null}
      </View>

      <FormField
        label={t('listingForm.description')}
        value={description}
        onChangeText={setDescription}
        error={errors.description}
        multiline
        style={{ minHeight: 80, textAlignVertical: 'top' }}
      />

      {errors.form ? <ThemedText type="caption" themeColor="error600">{errors.form}</ThemedText> : null}
      {posted ? <ThemedText themeColor="pink700">{existing ? t('listingForm.saved') : t('listingForm.posted')}</ThemedText> : null}
      <Button title={existing ? t('listingForm.saveChanges') : t('listingForm.postListing')} onPress={submit} disabled={posting} />
    </View>
  );
}
