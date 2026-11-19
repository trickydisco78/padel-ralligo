import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

import { colors, fontFamily, borderWidth, radius, spacing } from '../../theme/tokens';

export type SegmentOption<T extends string> = {
  value: T;
  label: string;
  /** Shown beside the label, and read out with it. */
  count?: number;
  /** Drawn before the label; decorative, the label carries the meaning. */
  icon?: ReactNode;
};

type Props<T extends string> = {
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Names the group for screen readers. */
  accessibilityLabel?: string;
};

/**
 * A switch between a few views, one selected at a time. Drawn as separate choice pills, not a joined
 * grey track, as the design system asks.
 */
export function SegmentedControl<T extends string>({ options, value, onChange, accessibilityLabel }: Props<T>) {
  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
      style={{ flexDirection: 'row', gap: spacing.space2 }}>
      {options.map((option) => {
        const selected = option.value === value;
        const text = option.count === undefined ? option.label : `${option.label}, ${option.count}`;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityLabel={text}
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => ({
              flex: 1,
              minHeight: 44,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: spacing.space2,
              paddingHorizontal: spacing.space4,
              borderRadius: radius.pill,
              borderWidth,
              borderColor: selected ? colors.pink100 : colors.lineStrong,
              backgroundColor: selected ? colors.pink100 : pressed ? colors.surfaceSoft : colors.surface,
            })}>
            {option.icon === undefined || option.icon === null ? null : (
              <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                {option.icon}
              </View>
            )}
            <Text
              style={{
                color: selected ? colors.pink700 : colors.inkSoft,
                fontFamily: selected ? fontFamily[700] : fontFamily[600],
                fontSize: 14,
                lineHeight: 18,
              }}>
              {option.label}
            </Text>
            {option.count === undefined ? null : (
              <Text style={{ color: selected ? colors.pink700 : colors.muted, fontFamily: fontFamily[500], fontSize: 13, lineHeight: 18 }}>
                {option.count}
              </Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
