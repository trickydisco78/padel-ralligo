import type { FieldErrors, SkillTier } from '@padel/core';
import { translateFieldErrors, useTranslation } from '@padel/i18n';
import { useState } from 'react';
import { View } from 'react-native';

import { useSession } from '@padel/auth';
import { DestinationPicker } from '@padel/destinations';
import { Button, Checkbox, FormField, HelperText, ThemedText, spacing } from '@padel/ui';

import {
  MAX_BIO_LENGTH,
  MAX_DISPLAY_NAME_LENGTH,
  MAX_HOME_CITY_LENGTH,
  MIN_DISPLAY_NAME_LENGTH,
  validateProfile, type Profile } from '../../domain/profile';
import { useSaveProfile } from '../hooks/use-profile';
import { SkillTierPicker } from './skill-tier-picker';

/** Where saving has got to: typing, in flight, done, or failed. */
type ProfileFormState = 'editing' | 'saving' | 'saved' | 'failed';

type Props = {
  initial?: Profile | null;
  submitLabel: string;
  onSaved?: () => void;
  /** Shows a Cancel button that calls this; leave unset where there is nothing to go back to (profile setup). */
  onCancel?: () => void;
  /**
   * `setup` asks only for name, skill level and city; the rest is kept from `initial` and edited later.
   * `full` (the default) is every field.
   */
  fields?: 'setup' | 'full';
  /**
   * A name offered by the sign-in provider. It only prefills the field when the profile has no name yet; the
   * member sees it and it is saved only when they save. Never derived from the email address.
   */
  suggestedName?: string;
};

export function ProfileForm({ initial, submitLabel, onSaved, onCancel, fields = 'full', suggestedName }: Props) {
  const { t } = useTranslation('profiles');
  const { user } = useSession();
  const saveProfile = useSaveProfile();
  const [displayName, setDisplayName] = useState(initial?.displayName || suggestedName || '');
  const [homeCity, setHomeCity] = useState(initial?.homeCity ?? '');
  const [bio, setBio] = useState(initial?.bio ?? '');
  const [skillTier, setSkillTier] = useState<SkillTier | null>(initial?.skillTier ?? null);
  const [homeDestinationId, setHomeDestinationId] = useState<string | null>(initial?.homeDestinationId ?? null);
  const [discoverable, setDiscoverable] = useState(!!initial?.discoverableAt);
  const full = fields === 'full';
  const [errors, setErrors] = useState<FieldErrors>({});
  const [state, setState] = useState<ProfileFormState>('editing');

  async function submit() {
    setState('editing');
    const result = validateProfile({ displayName, homeCity, bio, skillTier, homeDestinationId, discoverable });
    if (!result.ok || !skillTier || !user) {
      setErrors(result.ok ? {} : result.errors);
      return;
    }
    setErrors({});
    setState('saving');
    try {
      await saveProfile.mutateAsync({ userId: user.id, input: { displayName, homeCity, bio, skillTier, homeDestinationId, discoverable } });
      setState('saved');
      onSaved?.();
    } catch {
      setState('failed');
    }
  }

  // Field errors (and `form`) are translation keys.
  const messages = translateFieldErrors(t, errors, {
    nameMin: MIN_DISPLAY_NAME_LENGTH,
    nameMax: MAX_DISPLAY_NAME_LENGTH,
    homeCityMax: MAX_HOME_CITY_LENGTH,
    bioMax: MAX_BIO_LENGTH,
  });

  return (
    <View style={{ gap: spacing.space5 }}>
      <FormField
        label={t('profileForm.displayName')}
        helper={t('profileForm.displayNameHelp')}
        value={displayName}
        onChangeText={setDisplayName}
        error={messages.displayName}
      />
      <FormField label={t('profileForm.homeCity')} optional value={homeCity} onChangeText={setHomeCity} error={messages.homeCity} />
      {full ? (
        <FormField
          label={t('profileForm.bio')}
          optional
          value={bio}
          onChangeText={setBio}
          count={`${bio.length}/${MAX_BIO_LENGTH}`}
          error={messages.bio}
          multiline
        />
      ) : null}
      <SkillTierPicker value={skillTier} onChange={setSkillTier} error={messages.skillTier} />
      {full ? (
        <>
          <Checkbox label={t('profileForm.discoverable')} hint={t('profileForm.discoverableHelp')} checked={discoverable} onChange={setDiscoverable} />
          <DestinationPicker
            label={t('profileForm.homeDestination')}
            value={homeDestinationId}
            onChange={setHomeDestinationId}
            allowClear
            error={messages.homeDestinationId}
          />
        </>
      ) : null}
      {state === 'failed' ? <HelperText error>{t('profileForm.saveFailed')}</HelperText> : null}
      {state === 'saved' ? <ThemedText themeColor="pink700">{t('profileForm.saved')}</ThemedText> : null}
      <Button title={submitLabel} onPress={submit} disabled={state === 'saving'} />
      {onCancel ? <Button variant="secondary" title={t('profileForm.cancel')} onPress={onCancel} disabled={state === 'saving'} /> : null}
    </View>
  );
}
