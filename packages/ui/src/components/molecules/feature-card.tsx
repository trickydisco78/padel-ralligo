import { View, type ViewProps } from 'react-native';

import { colors, radius, spacing } from '../../theme/tokens';

/**
 * The pink feature card with two decorative circles and white text. Use once per screen, for the player
 * card or the level card. The circles are clipped by the card and hidden from assistive technology.
 */
export function FeatureCard({ style, children, ...rest }: ViewProps) {
  return (
    <View
      style={[{ overflow: 'hidden', backgroundColor: colors.pink500, borderRadius: radius.xl, padding: spacing.space5 }, style]}
      {...rest}>
      <View
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{ position: 'absolute', right: -60, top: -60, width: 200, height: 200, borderRadius: 100, backgroundColor: colors.pink400 }}
      />
      <View
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{ position: 'absolute', left: -70, bottom: -70, width: 180, height: 180, borderRadius: 90, backgroundColor: colors.pink600 }}
      />
      {children}
    </View>
  );
}
