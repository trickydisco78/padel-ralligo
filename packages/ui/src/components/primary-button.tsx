import { Ionicons } from '@expo/vector-icons';
import { Pressable } from 'react-native';

import { ThemedText } from './themed-text';
import { Colors, Radius, Spacing } from '../theme/tokens';

type Props = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  /** Shows a trailing arrow, as on the "Join" buttons. */
  arrow?: boolean;
};

/** Bright green pill button with dark text. */
export function PrimaryButton({ title, onPress, disabled = false, arrow = false }: Props) {
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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.two,
      })}>
      <ThemedText type="smallBold" themeColor="onPrimary">
        {title}
      </ThemedText>
      {arrow ? <Ionicons name="arrow-forward" size={16} color={Colors.light.onPrimary} /> : null}
    </Pressable>
  );
}
