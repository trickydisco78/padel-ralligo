import { Pressable, Switch as NativeSwitch, View } from 'react-native';

import { colors, fontFamily, spacing } from '../../theme/tokens';
import { ThemedText } from './themed-text';

type Props = {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  /** A short second line, for when the effect is not obvious. */
  hint?: string;
  disabled?: boolean;
};

/** A sliding on/off for a setting that takes effect straight away. Label left, switch right, 44 point row. */
export function Switch({ label, value, onValueChange, hint, disabled = false }: Props) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled}
      onPress={() => onValueChange(!value)}
      style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.space4, minHeight: 44, paddingVertical: spacing.space2 }}>
      <View style={{ flex: 1 }}>
        <ThemedText themeColor={disabled ? 'muted' : 'ink'} style={{ fontFamily: fontFamily[500], lineHeight: 22 }}>
          {label}
        </ThemedText>
        {hint ? (
          <ThemedText type="caption" themeColor="muted">
            {hint}
          </ThemedText>
        ) : null}
      </View>
      {/* The row is the control; the native switch only draws it. */}
      <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <NativeSwitch
          testID="switch-control"
          value={value}
          disabled={disabled}
          trackColor={{ false: disabled ? colors.lineStrong : colors.control, true: disabled ? colors.pink200 : colors.pink500 }}
          thumbColor={colors.surface}
          ios_backgroundColor={disabled ? colors.lineStrong : colors.control}
        />
      </View>
    </Pressable>
  );
}
