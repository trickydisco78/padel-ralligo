import { Pressable, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';

type Props = {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
};

export function CheckRow({ label, checked, onChange, error }: Props) {
  return (
    <View style={{ gap: Spacing.one }}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityLabel={label}
        accessibilityState={{ checked }}
        onPress={() => onChange(!checked)}
        style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
        <View
          style={{
            width: 24,
            height: 24,
            borderRadius: 6,
            borderWidth: 2,
            borderColor: checked ? Colors.light.primary : Colors.light.textSecondary,
            backgroundColor: checked ? Colors.light.primary : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          {checked ? <ThemedText type="smallBold" themeColor="onPrimary">✓</ThemedText> : null}
        </View>
        <ThemedText style={{ flex: 1 }}>{label}</ThemedText>
      </Pressable>
      {error ? (
        <ThemedText type="small" style={{ color: '#C62828' }}>
          {error}
        </ThemedText>
      ) : null}
    </View>
  );
}
