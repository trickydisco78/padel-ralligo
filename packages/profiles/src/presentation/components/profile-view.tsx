import { useTranslation } from '@padel/i18n';
import { borderWidth, colors, FeatureCard, fontFamily, Icon, radius, spacing, ThemedText } from '@padel/ui';
import { Pressable, Text, View } from 'react-native';

import { identityLine } from '../../domain/identity-line';
import type { Profile } from '../../domain/profile';
import { HERO_AVATAR_OVERLAP, ProfileAvatar, ProfileHero, SHEET_RISE } from './profile-hero';

export { HERO_AVATAR_OVERLAP };

type Props = {
  profile: Profile;
  onEdit: () => void;
  /** Space above the pink band for the status bar, so the band runs to the top edge. */
  topInset?: number;
};

/**
 * A member's own profile: a pink band with their initials avatar, name, skill tier and place, an Edit profile
 * button, a level card and the bio (or a prompt to add one). Meant to run edge to edge, outside screen padding.
 */
export function ProfileView({ profile, onEdit, topInset = 0 }: Props) {
  const { t } = useTranslation('profiles');
  const tier = profile.skillTier ? t(`skillTierPicker.tiers.${profile.skillTier}`) : undefined;
  const line = identityLine({ tier, city: profile.homeCity });
  return (
    <View>
      <ProfileHero topInset={topInset} />
      <View
        testID="profile-sheet"
        style={{
          marginTop: -SHEET_RISE,
          backgroundColor: colors.surface,
          borderTopLeftRadius: radius.xl,
          borderTopRightRadius: radius.xl,
          // Clears the avatar's lower half and a gap, whatever the text size.
          paddingTop: HERO_AVATAR_OVERLAP + spacing.space3,
          paddingHorizontal: spacing.space6, // lines up with the trips and listings below
          gap: spacing.space4,
        }}>
        <View style={{ alignItems: 'center', gap: spacing.space1 }}>
          <Text
            accessibilityRole="header"
            style={{ color: colors.ink, fontFamily: fontFamily[800], fontSize: 30, lineHeight: 34, letterSpacing: -0.6, textAlign: 'center' }}>
            {profile.displayName}
          </Text>
          {line ? (
            <Text style={{ color: colors.muted, fontFamily: fontFamily[500], fontSize: 15, lineHeight: 20, textAlign: 'center' }}>{line}</Text>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('profileView.edit')}
            onPress={onEdit}
            style={{
              marginTop: spacing.space3,
              minHeight: 44,
              paddingHorizontal: spacing.space5,
              borderRadius: radius.pill,
              borderWidth,
              borderColor: colors.pink200,
              backgroundColor: colors.surface,
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.space2,
            }}>
            <Icon name="edit" color="pink700" size={16} strokeWidth={2.2} />
            <Text style={{ color: colors.pink700, fontFamily: fontFamily[700], fontSize: 15, lineHeight: 20 }}>{t('profileView.edit')}</Text>
          </Pressable>
        </View>

        {tier ? (
          <FeatureCard style={{ borderRadius: radius.lg, paddingVertical: spacing.space4, gap: spacing.space1 }}>
            <Text style={{ color: colors.surface, fontFamily: fontFamily[600], fontSize: 14, lineHeight: 18 }}>{t('profileView.yourLevel')}</Text>
            <Text style={{ color: colors.surface, fontFamily: fontFamily[800], fontSize: 40, lineHeight: 46, letterSpacing: -1.2 }}>{tier}</Text>
          </FeatureCard>
        ) : null}

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
      </View>
      {/* After the sheet, so it is drawn on top of it. */}
      <ProfileAvatar name={profile.displayName} topInset={topInset} />
    </View>
  );
}
