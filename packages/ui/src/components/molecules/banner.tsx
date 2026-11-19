import { View } from 'react-native';

import { type ColorToken, colors, radius, spacing } from '../../theme/tokens';
import { Icon, type IconName } from '../atoms/icon';
import { ThemedText } from '../atoms/themed-text';

export type BannerVariant = 'info' | 'pending' | 'success' | 'declined' | 'error';

type Props = {
  variant?: BannerVariant;
  /** A bold first line. Optional: a notice can be a single sentence. */
  title?: string;
  children: string;
  /** Overrides the icon for the variant. */
  icon?: IconName;
};

const looks: Record<BannerVariant, { background: ColorToken; text: ColorToken; stroke: ColorToken; icon: IconName }> = {
  info: { background: 'pink100', text: 'pink700', stroke: 'pink700', icon: 'pin' },
  pending: { background: 'amber100', text: 'amber800', stroke: 'amber600', icon: 'clock' },
  success: { background: 'green100', text: 'green800', stroke: 'green600', icon: 'checkCircle' },
  declined: { background: 'ink', text: 'surface', stroke: 'pink300', icon: 'close' },
  error: { background: 'error100', text: 'error600', stroke: 'error600', icon: 'alert' },
};

/** A soft status strip: a white circle icon, an optional bold line and one short sentence. Read out as text. */
export function Banner({ variant = 'info', title, children, icon }: Props) {
  const look = looks[variant];
  return (
    <View
      accessible
      accessibilityLabel={title ? `${title}. ${children}` : children}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.space3,
        backgroundColor: colors[look.background],
        borderRadius: radius.md,
        paddingVertical: spacing.space3,
        paddingHorizontal: spacing.space4,
      }}>
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Icon name={icon ?? look.icon} color={look.stroke} size={22} />
      </View>
      <View style={{ flex: 1 }}>
        {title ? (
          <ThemedText type="label" themeColor={look.text}>
            {title}
          </ThemedText>
        ) : null}
        <ThemedText type="caption" themeColor={look.text}>
          {children}
        </ThemedText>
      </View>
    </View>
  );
}
