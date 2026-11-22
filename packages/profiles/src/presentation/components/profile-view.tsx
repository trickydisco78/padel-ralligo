import { useTranslation } from '@padel/i18n';
import { Button, ThemedText, spacing } from '@padel/ui';
import { Pressable, View } from 'react-native';

import type { Profile } from '../../domain/profile';
import { ProfileHeader } from './profile-header';

type Props = {
  profile: Profile;
  onEdit: () => void;
};

/** A member's own profile as text: the player card, the bio (or a prompt to add one) and a way to edit. */
export function ProfileView({ profile, onEdit }: Props) {
  const { t } = useTranslation('profiles');
  const tier = profile.skillTier ? [t(`skillTierPicker.tiers.${profile.skillTier}`)] : [];
  return (
    <View style={{ gap: spacing.space5 }}>
      <ProfileHeader name={profile.displayName} location={profile.homeCity || undefined} tags={tier} />
      {profile.bio ? (
        <View style={{ gap: spacing.space1 }}>
          <ThemedText type="headline" accessibilityRole="header">
            {t('profileView.about')}
          </ThemedText>
          <ThemedText>{profile.bio}</ThemedText>
        </View>
      ) : (
        <Pressable accessibilityRole="button" accessibilityLabel={t('profileView.addBio')} onPress={onEdit} style={{ minHeight: 44, justifyContent: 'center' }}>
          <ThemedText themeColor="pink700">{t('profileView.addBio')}</ThemedText>
        </Pressable>
      )}
      <Button variant="secondary" title={t('profileView.edit')} onPress={onEdit} />
    </View>
  );
}
