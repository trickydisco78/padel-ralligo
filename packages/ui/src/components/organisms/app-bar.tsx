import { Animated, Text, View } from 'react-native';
import { useTranslation } from '@padel/i18n';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fontFamily, spacing, type as textStyles, borderWidth } from '../../theme/tokens';
import { IconButton, type IconButtonVariant } from '../atoms/icon-button';
import type { IconName } from '../atoms/icon';

export type AppBarAction = {
  icon: IconName;
  accessibilityLabel: string;
  onPress: () => void;
};

type Props = {
  title: string;
  /**
   * `large`: the big title of a main tab screen; collapses to a small title once `scrollY` passes
   * the collapse distance. `detail`: back button, centred title. `overlay`: transparent, white round
   * buttons, over a hero image.
   */
  variant?: 'large' | 'detail' | 'overlay';
  /** A muted line under the large title. Fades out as the title collapses. */
  subtitle?: string;
  /** Large: the content's scroll offset, from an `Animated.event`. Without it the bar stays large. */
  scrollY?: Animated.Value;
  /** Detail and overlay: shows a round back button. */
  onBack?: () => void;
  backLabel?: string;
  /** One action, at most. A second action belongs in a menu. */
  action?: AppBarAction;
};

/** Scroll distance over which the large title shrinks to the small one. */
const COLLAPSE = 48;
const LARGE = textStyles.displayXl;
const SMALL = { fontSize: 24, lineHeight: 28, letterSpacing: -0.48 };

/** The bar at the top of a screen, below the status bar. 56 points tall, 20 side margin. */
export function AppBar({ title, variant = 'large', subtitle, scrollY, onBack, backLabel, action }: Props) {
  const { t } = useTranslation('ui');
  const insets = useSafeAreaInsets();
  const detail = variant === 'detail';
  const overlay = variant === 'overlay';
  const buttonVariant: IconButtonVariant = overlay ? 'float' : 'soft';

  const collapse = (outputs: [number, number]) =>
    scrollY ? scrollY.interpolate({ inputRange: [0, COLLAPSE], outputRange: outputs, extrapolate: 'clamp' }) : outputs[0];

  const back = onBack ? (
    <IconButton icon="back" variant={buttonVariant} accessibilityLabel={backLabel ?? t('appBar.back')} onPress={onBack} />
  ) : null;
  const trailing = action ? (
    <IconButton
      icon={action.icon}
      variant={variant === 'large' ? 'brand' : buttonVariant}
      size={variant === 'large' ? 56 : 44}
      accessibilityLabel={action.accessibilityLabel}
      onPress={action.onPress}
    />
  ) : null;

  if (detail || overlay) {
    return (
      <View
        style={{
          paddingTop: insets.top,
          backgroundColor: overlay ? 'transparent' : colors.surface,
          position: overlay ? 'absolute' : 'relative',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1,
        }}>
        <View style={{ minHeight: 56, paddingHorizontal: spacing.space5, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ minWidth: 44 }}>{back}</View>
          {overlay ? null : (
            <Text accessibilityRole="header" numberOfLines={1} style={[textStyles.title, { color: colors.ink, flex: 1, textAlign: 'center' }]}>
              {title}
            </Text>
          )}
          <View style={{ minWidth: 44 }}>{trailing}</View>
        </View>
      </View>
    );
  }

  return (
    <View style={{ paddingTop: insets.top, backgroundColor: colors.surface }}>
      <View style={{ minHeight: 56, paddingHorizontal: spacing.space5, paddingVertical: spacing.space1, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.space3 }}>
        <View style={{ flex: 1 }}>
          <Animated.Text
            accessibilityRole="header"
            // Two lines: a 44 point title does not fit one on a phone. Collapsed it is 24 points and fits one.
            numberOfLines={2}
            style={{
              color: colors.ink,
              fontFamily: fontFamily[800],
              fontSize: collapse([LARGE.fontSize, SMALL.fontSize]),
              lineHeight: collapse([LARGE.lineHeight, SMALL.lineHeight]),
              letterSpacing: collapse([LARGE.letterSpacing, SMALL.letterSpacing]),
            }}>
            {title}
          </Animated.Text>
          {subtitle ? (
            <Animated.Text
              style={[
                textStyles.body,
                { color: colors.muted, opacity: collapse([1, 0]), maxHeight: collapse([textStyles.body.lineHeight, 0]) },
              ]}>
              {subtitle}
            </Animated.Text>
          ) : null}
        </View>
        {trailing}
      </View>
      <Animated.View style={{ height: borderWidth, backgroundColor: colors.line, opacity: collapse([0, 1]) }} />
    </View>
  );
}
