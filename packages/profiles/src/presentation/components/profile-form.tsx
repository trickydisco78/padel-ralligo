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

type Props = {
  initial?: Profile | null;
  submitLabel: string;
  onSaved?: () => void;
};

export function ProfileForm({ initial, submitLabel, onSaved }: Props) {
  const { t } = useTranslation('profiles');
  const { user } = useSession();
  const saveProfile = useSaveProfile();
  const [displayName, setDisplayName] = useState(initial?.displayName ?? '');
  const [homeCity, setHomeCity] = useState(initial?.homeCity ?? '');
  const [bio, setBio] = useState(initial?.bio ?? '');
  const [skillTier, setSkillTier] = useState<SkillTier | null>(initial?.skillTier ?? null);
  const [homeDestinationId, setHomeDestinationId] = useState<string | null>(initial?.homeDestinationId ?? null);
  const [discoverable, setDiscoverable] = useState(!!initial?.discoverableAt);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function submit() {
    setSaved(false);
    const result = validateProfile({ displayName, homeCity, bio, skillTier, homeDestinationId, discoverable });
    if (!result.ok || !skillTier || !user) {
      setErrors(result.ok ? {} : result.errors);
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      await saveProfile.mutateAsync({ userId: user.id, input: { displayName, homeCity, bio, skillTier, homeDestinationId, discoverable } });
      setSaved(true);
      onSaved?.();
    } catch {
      setErrors({ form: 'profileForm.saveFailed' });
    } finally {
      setSaving(false);
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
      <FormField
        label={t('profileForm.bio')}
        optional
        value={bio}
        onChangeText={setBio}
        count={`${bio.length}/${MAX_BIO_LENGTH}`}
        error={messages.bio}
        multiline
      />
      <SkillTierPicker value={skillTier} onChange={setSkillTier} error={messages.skillTier} />
      <Checkbox label={t('profileForm.discoverable')} hint={t('profileForm.discoverableHelp')} checked={discoverable} onChange={setDiscoverable} />
      <DestinationPicker
        label={t('profileForm.homeDestination')}
        value={homeDestinationId}
        onChange={setHomeDestinationId}
        allowClear
        error={messages.homeDestinationId}
      />
      {errors.form ? <HelperText error>{messages.form ?? ''}</HelperText> : null}
      {saved ? <ThemedText themeColor="pink700">{t('profileForm.saved')}</ThemedText> : null}
      <Button title={submitLabel} onPress={submit} disabled={saving} />
    </View>
  );
}
