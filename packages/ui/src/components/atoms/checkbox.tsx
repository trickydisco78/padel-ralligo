import { Pressable, View } from 'react-native';

import { colors, fontFamily, radius, spacing } from '../../theme/tokens';
import { ThemedText } from './themed-text';
import { HelperText } from './helper-text';
import { Icon } from './icon';

type Props = {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** A short second line under the label. */
  hint?: string;
  disabled?: boolean;
  /** An error under the row. */
  error?: string;
};

/** A tick box for choosing many or giving consent. The whole row, label included, is the target. */
export function Checkbox({ label, checked, onChange, hint, disabled = false, error }: Props) {
  return (
    <View style={{ gap: spacing.space1 }}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityLabel={label}
        accessibilityHint={hint}
        accessibilityState={{ checked, disabled }}
        disabled={disabled}
        onPress={() => onChange(!checked)}
        style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.space3, minHeight: 44, paddingVertical: 10 }}>
        <View
          style={{
            width: 24,
            height: 24,
            borderRadius: radius.xs,
            borderWidth: 2,
            borderColor: disabled ? (checked ? colors.pink200 : colors.lineStrong) : checked ? colors.pink500 : colors.control,
            backgroundColor: disabled ? (checked ? colors.pink200 : colors.surfaceSoft) : checked ? colors.pink500 : colors.surface,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          {checked ? <Icon name="check" color="surface" size={16} strokeWidth={3} /> : null}
        </View>
        <View style={{ flex: 1 }}>
          <ThemedText
            themeColor={disabled ? 'muted' : 'ink'}
            style={{ fontFamily: fontFamily[500], lineHeight: 24 }}>
            {label}
          </ThemedText>
          {hint ? (
            <ThemedText type="caption" themeColor="muted">
              {hint}
            </ThemedText>
          ) : null}
        </View>
      </Pressable>
      {error ? <HelperText error>{error}</HelperText> : null}
    </View>
  );
}
