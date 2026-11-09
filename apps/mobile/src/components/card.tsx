import { View, type ViewProps } from 'react-native';

import { Colors, Radius, Spacing } from '@/constants/theme';

export function Card({ style, ...rest }: ViewProps) {
  return (
    <View
      style={[
        {
          backgroundColor: Colors.light.backgroundElement,
          borderColor: Colors.light.border,
          borderWidth: 1,
          borderRadius: Radius.card,
          padding: Spacing.three,
          gap: Spacing.two,
          shadowColor: '#000',
          shadowOpacity: 0.05,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 2 },
        },
        style,
      ]}
      {...rest}
    />
  );
}
