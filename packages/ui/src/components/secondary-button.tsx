import { Pressable } from 'react-native';

import { ThemedText } from './themed-text';
import { Colors, Radius, Spacing } from '../theme/tokens';

type Props = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  /** Tells assistive technology why the button does what it does, e.g. why it is disabled. */
  accessibilityHint?: string;
  /** Communicates a pending action to assistive technology. */
  busy?: boolean;
};

/** Outlined pill button for the second choice next to a PrimaryButton. */
export function SecondaryButton({ title, onPress, disabled = false, accessibilityHint, busy = false }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled, busy }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: Colors.light.background,
        borderColor: Colors.light.primaryDark,
        borderWidth: 1.5,
        opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        borderRadius: Radius.button,
        minHeight: 48,
        paddingVertical: Spacing.three,
        paddingHorizontal: Spacing.four,
        alignItems: 'center',
        justifyContent: 'center',
      })}>
      <ThemedText type="smallBold" themeColor="primaryDark">
        {title}
      </ThemedText>
    </Pressable>
  );
}
