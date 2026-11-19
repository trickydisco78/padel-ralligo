import { Text, type TextProps } from 'react-native';

import { type ColorToken, colors, type TextStyleToken, type as textStyles } from '../../theme/tokens';

export type ThemedTextProps = TextProps & {
  /** A design-system text style. Defaults to `body`. */
  type?: TextStyleToken;
  /** A design-system colour. Defaults to `ink`. */
  themeColor?: ColorToken;
};

/** Text in an Outfit style from the design system. The font family carries the weight; never set fontWeight. */
export function ThemedText({ style, type = 'body', themeColor = 'ink', ...rest }: ThemedTextProps) {
  return <Text style={[{ color: colors[themeColor] }, textStyles[type], style]} {...rest} />;
}
