import { Pressable, View } from 'react-native';

import { colors, fontFamily, spacing } from '../../theme/tokens';
import { ThemedText } from './themed-text';

type Props = {
  label: string;
  selected: boolean;
  onSelect: () => void;
  /** A short second line under the label. */
  hint?: string;
  disabled?: boolean;
};

/**
 * A round option for choosing exactly one of a few. Group them in a View with accessibilityRole="radiogroup"
 * and a visible group label, and preselect a sensible default.
 */
export function Radio({ label, selected, onSelect, hint, disabled = false }: Props) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityState={{ checked: selected, disabled }}
      disabled={disabled}
      onPress={onSelect}
      style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.space3, minHeight: 44, paddingVertical: 10 }}>
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          borderWidth: 2,
          borderColor: disabled ? colors.lineStrong : selected ? colors.pink500 : colors.control,
          backgroundColor: disabled ? colors.surfaceSoft : colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        {selected ? (
          <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: disabled ? colors.pink200 : colors.pink500 }} />
        ) : null}
      </View>
      <View style={{ flex: 1 }}>
        <ThemedText themeColor={disabled ? 'muted' : 'ink'} style={{ fontFamily: fontFamily[500], lineHeight: 24 }}>
          {label}
        </ThemedText>
        {hint ? (
          <ThemedText type="caption" themeColor="muted">
            {hint}
          </ThemedText>
        ) : null}
      </View>
    </Pressable>
  );
}
