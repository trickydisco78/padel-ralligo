import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { ThemedText } from './themed-text';
import { Colors, Radius, Spacing } from '../theme/tokens';

const MIN_TOUCH_TARGET = 48;

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

/** A switch between a few views, one selected at a time. */
export function SegmentedControl<T extends string>({ options, value, onChange, accessibilityLabel }: Props<T>) {
  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
      style={{
        flexDirection: 'row',
        backgroundColor: Colors.light.backgroundSelected,
        borderRadius: Radius.card,
        padding: Spacing.one,
        gap: Spacing.one,
      }}>
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
            style={{
              flex: 1,
              minHeight: MIN_TOUCH_TARGET,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: Spacing.one,
              borderRadius: Radius.card,
              backgroundColor: selected ? Colors.light.background : 'transparent',
            }}>
            {option.icon === undefined || option.icon === null ? null : (
              <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                {option.icon}
              </View>
            )}
            <ThemedText type="smallBold" themeColor={selected ? 'text' : 'textSecondary'}>
              {option.label}
            </ThemedText>
            {option.count === undefined ? null : (
              <ThemedText type="small" themeColor="textSecondary">
                {option.count}
              </ThemedText>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
