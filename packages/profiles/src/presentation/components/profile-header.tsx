import { useTranslation } from '@padel/i18n';
import { Avatar, Badge, borderWidth, Card, colors, FeatureCard, fontFamily, Icon, spacing, ThemedText, type as textStyles } from '@padel/ui';
import { Text, View } from 'react-native';

export type ProfileStat = { value: string; label: string };

type Props = {
  name: string;
  /** A place, shown with a pin icon. */
  location?: string;
  /** A short tag on the top right of the card, e.g. "Verified" or "Match organiser". */
  badge?: string;
  /** Short caps tags under the place, e.g. "Padel", "Here until Jun 21". */
  tags?: readonly string[];
  /** Up to three stats shown under the card. Keep values short ("4.0"). */
  stats?: readonly ProfileStat[];
};

/** The pink player card with avatar, name, place and tags, followed by a row of stats. Once per profile screen. */
export function ProfileHeader({ name, location, badge, tags = [], stats = [] }: Props) {
  const { t } = useTranslation('profiles');
  const shownStats = stats.slice(0, 3);
  return (
    <View style={{ gap: spacing.space3 }}>
      <FeatureCard style={{ alignItems: 'center', gap: spacing.space3 }}>
        <View style={{ alignSelf: 'stretch', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={[textStyles.overline, { color: colors.surface }]}>{t('playerCard.overline').toUpperCase()}</Text>
          {badge ? <Badge label={badge} caps /> : null}
        </View>
        <View>
          <Avatar name={name} size="xl" variant="tint" />
          <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={{
              position: 'absolute',
              right: -4,
              bottom: -4,
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: colors.ink,
              borderWidth: 3,
              borderColor: colors.pink500,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Icon name="ball" color="pink300" size={16} />
          </View>
        </View>
        <Text accessibilityRole="header" style={{ color: colors.surface, fontFamily: fontFamily[800], fontSize: 30, lineHeight: 34, letterSpacing: -0.6 }}>
          {name}
        </Text>
        {location ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.space1 }}>
            <Icon name="pin" color="surface" size={16} />
            <Text style={{ color: colors.surface, fontFamily: fontFamily[500], fontSize: 14, lineHeight: 18 }}>{location}</Text>
          </View>
        ) : null}
        {tags.length > 0 ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.space2 }}>
            {tags.map((tag) => (
              <Badge key={tag} label={tag} caps />
            ))}
          </View>
        ) : null}
      </FeatureCard>

      {shownStats.length > 0 ? (
        <Card accessibilityLabel={t('playerCard.statsLabel')} style={{ flexDirection: 'row', paddingHorizontal: 0, paddingVertical: spacing.space4, gap: 0 }}>
          {shownStats.map((stat, index) => (
            <View
              key={stat.label}
              accessible
              accessibilityLabel={`${stat.label}: ${stat.value}`}
              style={{
                flex: 1,
                alignItems: 'center',
                borderRightWidth: index < shownStats.length - 1 ? borderWidth : 0,
                borderRightColor: colors.line,
              }}>
              <Text style={{ color: colors.ink, fontFamily: fontFamily[800], fontSize: 26, lineHeight: 30, letterSpacing: -0.52 }}>
                {stat.value}
              </Text>
              <ThemedText type="overline" themeColor="muted">
                {stat.label.toUpperCase()}
              </ThemedText>
            </View>
          ))}
        </Card>
      ) : null}
    </View>
  );
}
