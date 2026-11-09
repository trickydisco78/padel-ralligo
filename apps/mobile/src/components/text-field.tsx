import { TextInput, View, type TextInputProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors, Radius, Spacing } from '@/constants/theme';

type Props = TextInputProps & {
  label: string;
  error?: string;
};

export function TextField({ label, error, style, ...rest }: Props) {
  return (
    <View style={{ gap: Spacing.one }}>
      <ThemedText type="smallBold">{label}</ThemedText>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={Colors.light.textSecondary}
        style={[
          {
            borderWidth: 1,
            borderColor: error ? '#C62828' : Colors.light.border,
            borderRadius: Radius.button,
            backgroundColor: Colors.light.backgroundElement,
            color: Colors.light.text,
            paddingVertical: Spacing.two + 2,
            paddingHorizontal: Spacing.three,
            fontSize: 16,
          },
          style,
        ]}
        {...rest}
      />
      {error ? (
        <ThemedText type="small" style={{ color: '#C62828' }}>
          {error}
        </ThemedText>
      ) : null}
    </View>
  );
}
