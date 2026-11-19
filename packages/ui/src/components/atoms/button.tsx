import type { ComponentProps } from 'react';
import { Pressable, Text, View } from 'react-native';

import { type ColorToken, borderWidth, colors, fontFamily, radius, shadows, spacing } from '../../theme/tokens';
import { Icon, type IconName } from './icon';

export type ButtonVariant = 'primary' | 'secondary' | 'choice';

type Props = {
  title: string;
  onPress: () => void;
  /** `primary`: the one main action. `secondary`: the quiet second action. `choice`: a small filter pill. */
  variant?: ButtonVariant;
  /** Choice pills only: whether this pill is the current choice. */
  selected?: boolean;
  disabled?: boolean;
  /** Communicates a pending action to assistive technology. */
  busy?: boolean;
  /** Tells assistive technology why the button does what it does, e.g. why it is disabled. */
  accessibilityHint?: string;
  /** A leading icon: 20 in primary and secondary buttons, 16 in choice pills. */
  icon?: IconName;
  /** For moving screen-reader focus back to this button, e.g. after a sheet it opened closes. */
  ref?: ComponentProps<typeof Pressable>['ref'];
};

type Look = { background: string; border: string; text: ColorToken; font: string; size: number; height: number };

function lookFor(variant: ButtonVariant, selected: boolean, disabled: boolean, pressed: boolean): Look {
  if (variant === 'primary') {
    return disabled
      ? { background: colors.surfaceSoft, border: 'transparent', text: 'muted', font: fontFamily[700], size: 17, height: 56 }
      : { background: pressed ? colors.pink600 : colors.pink500, border: 'transparent', text: 'surface', font: fontFamily[700], size: 17, height: 56 };
  }
  if (variant === 'secondary') {
    return disabled
      ? { background: colors.surfaceSoft, border: 'transparent', text: 'muted', font: fontFamily[700], size: 17, height: 56 }
      : { background: pressed ? colors.pink100 : colors.surface, border: colors.pink200, text: 'pink700', font: fontFamily[700], size: 17, height: 56 };
  }
  if (disabled) {
    return { background: colors.surfaceSoft, border: 'transparent', text: 'muted', font: fontFamily[600], size: 14, height: 44 };
  }
  return selected
    ? { background: colors.pink100, border: colors.pink100, text: 'pink700', font: fontFamily[700], size: 14, height: 44 }
    : { background: pressed ? colors.surfaceSoft : colors.surface, border: colors.lineStrong, text: 'inkSoft', font: fontFamily[600], size: 14, height: 44 };
}

/** A pill button. One primary per screen; a secondary under it; choice pills for filters. */
export function Button({
  title,
  onPress,
  variant = 'primary',
  selected = false,
  disabled = false,
  busy = false,
  accessibilityHint,
  icon,
  ref,
}: Props) {
  const choice = variant === 'choice';
  return (
    <Pressable
      ref={ref}
      accessibilityRole="button"
      accessibilityHint={accessibilityHint}
      accessibilityState={choice ? { selected, disabled, busy } : { disabled, busy }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => {
        const look = lookFor(variant, selected, disabled, pressed);
        return [
          {
            minHeight: look.height,
            minWidth: 44,
            borderRadius: radius.pill,
            borderWidth: borderWidth,
            borderColor: look.border,
            backgroundColor: look.background,
            paddingHorizontal: choice ? spacing.space4 : spacing.space8,
            flexDirection: 'row' as const,
            alignItems: 'center' as const,
            justifyContent: 'center' as const,
            gap: choice ? spacing.space2 : 10,
          },
          variant === 'primary' && !disabled ? shadows.shadowBrand : null,
        ];
      }}>
      {({ pressed }) => {
        const look = lookFor(variant, selected, disabled, pressed);
        return (
          <>
            {icon ? (
              <View>
                <Icon name={icon} color={look.text} size={choice ? 16 : 20} />
              </View>
            ) : null}
            <Text style={{ color: colors[look.text], fontFamily: look.font, fontSize: look.size, lineHeight: look.size + 5 }}>
              {title}
            </Text>
          </>
        );
      }}
    </Pressable>
  );
}
