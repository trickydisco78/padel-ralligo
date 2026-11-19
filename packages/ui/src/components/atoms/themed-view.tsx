import { View, type ViewProps } from 'react-native';

import { type ColorToken, colors } from '../../theme/tokens';

export type ThemedViewProps = ViewProps & {
  /** A design-system colour for the background. Defaults to `surface`. */
  type?: ColorToken;
};

export function ThemedView({ style, type = 'surface', ...otherProps }: ThemedViewProps) {
  return <View style={[{ backgroundColor: colors[type] }, style]} {...otherProps} />;
}
