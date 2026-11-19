import { Pressable } from 'react-native';

import { borderWidth, colors, shadows } from '../../theme/tokens';
import { Icon, type IconName } from './icon';

export type IconButtonVariant = 'default' | 'brand' | 'ink' | 'soft' | 'tint' | 'float';

type Props = {
  icon: IconName;
  onPress: () => void;
  /** Required: an icon-only button has no visible text. */
  accessibilityLabel: string;
  variant?: IconButtonVariant;
  /** 44 by default, 56 for the main action in an app bar. */
  size?: 44 | 56;
  disabled?: boolean;
  /** 2.8 for the check and cross in accept and decline buttons. */
  iconStrokeWidth?: number;
};

const iconColor = { default: 'ink', brand: 'surface', ink: 'ink', soft: 'ink', tint: 'pink700', float: 'ink' } as const;

/** A round icon button. At least 44 points so it is easy to hit. */
export function IconButton({ icon, onPress, accessibilityLabel, variant = 'default', size = 44, disabled = false, iconStrokeWidth }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: variant === 'ink' ? 2 : borderWidth,
          borderColor:
            variant === 'brand' ? colors.pink500 : variant === 'ink' ? colors.ink : variant === 'default' ? colors.lineStrong : 'transparent',
          backgroundColor:
            variant === 'brand'
              ? pressed ? colors.pink600 : colors.pink500
              : variant === 'tint'
                ? colors.pink100
                : variant === 'soft'
                  ? pressed ? colors.lineStrong : colors.surfaceSoft
                  : pressed ? colors.surfaceSoft : colors.surface,
          opacity: disabled ? 0.5 : 1,
        },
        variant === 'brand' && size === 56 ? shadows.shadowBrand : null,
        variant === 'float' ? shadows.shadowCard : null,
      ]}>
      <Icon name={icon} color={iconColor[variant]} size={24} strokeWidth={iconStrokeWidth} />
    </Pressable>
  );
}
