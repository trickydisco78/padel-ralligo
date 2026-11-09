import { Pressable } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors, Radius, Spacing } from '@/constants/theme';

type Props = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
};

export function PrimaryButton({ title, onPress, disabled = false }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: Colors.light.primary,
        opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        borderRadius: Radius.button,
        paddingVertical: Spacing.three,
        paddingHorizontal: Spacing.four,
        alignItems: 'center',
      })}>
      <ThemedText type="smallBold" themeColor="onPrimary">
        {title}
      </ThemedText>
    </Pressable>
  );
}
