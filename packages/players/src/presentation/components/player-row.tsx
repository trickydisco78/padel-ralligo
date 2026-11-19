import { Avatar, borderWidth, colors, fontFamily, Icon, IconButton, radius, spacing } from '@padel/ui';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from '@padel/i18n';

export type PlayerRowStatus = 'playing' | 'requesting' | 'organiser';

type Props = {
  name: string;
  /** `playing`: confirmed. `requesting`: asked to join, with accept and decline. `organiser`: runs the match. */
  status: PlayerRowStatus;
  /** Requesting only. */
  onAccept?: () => void;
  /** Requesting only. */
  onDecline?: () => void;
  /**
   * Organiser: shows a chevron and makes the whole row pressable.
   * Requesting: makes the name and status pressable (to review the request) beside the accept and decline buttons.
   */
  onPress?: () => void;
};

/**
 * One person in a match list: avatar, name and status, and for a request the accept and decline buttons.
 * Every state has an icon and a text label as well as a colour.
 */
export function PlayerRow({ name, status, onAccept, onDecline, onPress }: Props) {
  const { t } = useTranslation('players');
  const statusText = t(`row.${status}`);
  const requesting = status === 'requesting';

  const main = (
    <>
      <Avatar name={name} size="sm" />
      <View style={{ flex: 1 }} accessible={!(requesting && onPress)} accessibilityLabel={t('row.rowLabel', { name, status: statusText })}>
        <Text numberOfLines={1} style={{ color: colors.ink, fontFamily: fontFamily[700], fontSize: 17, lineHeight: 22 }}>
          {name}
        </Text>
        <Text style={{ color: colors.muted, fontFamily: fontFamily[500], fontSize: 14, lineHeight: 18 }}>{statusText}</Text>
      </View>
    </>
  );

  const content = (
    <>
      {status === 'playing' ? (
        <View
          style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: colors.pink500, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="check" color="surface" size={14} strokeWidth={3} />
        </View>
      ) : null}
      {requesting ? <Icon name="clock" color="pink700" size={22} /> : null}
      {requesting && onPress ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('row.review', { name })}
          accessibilityHint={statusText}
          onPress={onPress}
          style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.space3, minHeight: 44 }}>
          {main}
        </Pressable>
      ) : (
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.space3 }}>{main}</View>
      )}
      {requesting ? (
        <>
          <IconButton
            icon="check"
            variant="brand"
            iconStrokeWidth={2.8}
            accessibilityLabel={t('row.accept', { name })}
            onPress={() => onAccept?.()}
          />
          <IconButton
            icon="close"
            variant="ink"
            iconStrokeWidth={2.8}
            accessibilityLabel={t('row.decline', { name })}
            onPress={() => onDecline?.()}
          />
        </>
      ) : null}
      {status === 'organiser' && onPress ? <Icon name="chevron" color="inkSoft" size={20} /> : null}
    </>
  );

  const style = {
    minHeight: 68,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.space3,
    paddingHorizontal: spacing.space4,
    borderRadius: radius.md,
    backgroundColor: requesting ? colors.surface : colors.surfaceSoft,
    borderWidth: requesting ? borderWidth : 0,
    borderColor: colors.pink200,
  };

  if (status === 'organiser' && onPress) {
    return (
      <Pressable accessibilityRole="button" accessibilityLabel={t('row.rowLabel', { name, status: statusText })} onPress={onPress} style={style}>
        {content}
      </Pressable>
    );
  }
  return <View style={style}>{content}</View>;
}
