import { Pressable } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors, Radius, Spacing } from '@/constants/theme';

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
      <ThemedText type="small" themeColor={selected ? 'primary' : 'textSecondary'}>
        {label}
      </ThemedText>
    </Pressable>
  );
}
