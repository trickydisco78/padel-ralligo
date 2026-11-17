import { Pressable } from 'react-native';

import { ThemedText } from './themed-text';
import { Colors, Radius, Spacing } from '../theme/tokens';

type Props = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
};

/** Pill chip. Pressable when `onPress` is given, otherwise a static label. */
export function Chip({ label, selected = false, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityState={onPress ? { selected } : undefined}
      disabled={!onPress}
      onPress={onPress}
      style={{
        backgroundColor: selected ? Colors.light.primaryTint : Colors.light.backgroundSelected,
        borderRadius: Radius.chip,
        paddingVertical: Spacing.one,
        paddingHorizontal: Spacing.three,
      }}>
      <ThemedText type="smallBold" themeColor={selected ? 'primaryDark' : 'textSecondary'}>
        {label}
      </ThemedText>
    </Pressable>
  );
}
