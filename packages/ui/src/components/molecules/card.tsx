import { View, type ViewProps } from 'react-native';

import { borderWidth, colors, radius, shadows, spacing } from '../../theme/tokens';

type Props = ViewProps & {
  /**
   * `default`: white with a hairline border, for a white screen.
   * `soft`: a quiet grey-pink fill with the card shadow, for a card that sits on `surfaceSoft`.
   */
  variant?: 'default' | 'soft';
};

/** A white card with a hairline border. One idea per card. */
export function Card({ variant = 'default', style, ...rest }: Props) {
  return (
    <View
      style={[
        {
          backgroundColor: variant === 'soft' ? colors.surfaceSoft : colors.surface,
          borderColor: colors.line,
          borderWidth: variant === 'soft' ? 0 : borderWidth,
          borderRadius: radius.lg,
          padding: spacing.space4,
          gap: spacing.space2,
        },
        variant === 'soft' ? shadows.shadowCard : null,
        style,
      ]}
      {...rest}
    />
  );
}
