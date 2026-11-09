import { validateProfile, type FieldErrors, type SkillTier } from '@repo/core';
import { useState } from 'react';
import { View } from 'react-native';

import { useSession } from '@/auth/session';
import { PrimaryButton } from '@/components/primary-button';
import { SkillTierPicker } from '@/components/skill-tier-picker';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { saveProfile, type ProfileData } from '@/data/profile';
import { Spacing } from '@/constants/theme';

type Props = {
  initial?: ProfileData | null;
  submitLabel: string;
  onSaved?: () => void;
};

export function ProfileForm({ initial, submitLabel, onSaved }: Props) {
  const { user, refreshProfile } = useSession();
  const [displayName, setDisplayName] = useState(initial?.displayName ?? '');
  const [homeCity, setHomeCity] = useState(initial?.homeCity ?? '');
  const [bio, setBio] = useState(initial?.bio ?? '');
  const [skillTier, setSkillTier] = useState<SkillTier | null>(initial?.skillTier ?? null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function submit() {
    setSaved(false);
    const result = validateProfile({ displayName, homeCity, bio, skillTier });
    if (!result.ok || !skillTier || !user) {
      setErrors(result.ok ? {} : result.errors);
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      await saveProfile(user.id, { displayName, homeCity, bio, skillTier });
      await refreshProfile();
      setSaved(true);
      onSaved?.();
    } catch {
      setErrors({ form: 'Could not save your profile. Please try again.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={{ gap: Spacing.three }}>
      <TextField label="Display name" value={displayName} onChangeText={setDisplayName} error={errors.displayName} />
      <TextField label="Home city (optional)" value={homeCity} onChangeText={setHomeCity} error={errors.homeCity} />
      <TextField
        label="Bio (optional)"
        value={bio}
        onChangeText={setBio}
        error={errors.bio}
        multiline
        style={{ minHeight: 80, textAlignVertical: 'top' }}
      />
      <SkillTierPicker value={skillTier} onChange={setSkillTier} error={errors.skillTier} />
      {errors.form ? (
        <ThemedText type="small" style={{ color: '#C62828' }}>
          {errors.form}
        </ThemedText>
      ) : null}
      {saved ? <ThemedText themeColor="primary">Profile saved</ThemedText> : null}
      <PrimaryButton title={submitLabel} onPress={submit} disabled={saving} />
    </View>
  );
}
