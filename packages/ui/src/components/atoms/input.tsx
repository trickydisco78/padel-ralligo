import { type ComponentProps, useState } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';

import { borderWidth, colors, radius, type as textStyles } from '../../theme/tokens';

type Props = Omit<TextInputProps, 'editable'> & {
  /** Marks the field as invalid: an error border. Pair it with an error message, never colour alone. */
  invalid?: boolean;
  disabled?: boolean;
  /** `field` for forms; `pill` is only for search. */
  shape?: 'field' | 'pill';
  /** Extra space inside the left edge, e.g. for a search icon. */
  paddingLeft?: number;
  /** For moving focus into the field, e.g. when arriving from a search entry elsewhere. */
  ref?: ComponentProps<typeof TextInput>['ref'];
};

const RING = 3;

/** A 56 point text field. Focus is a pink border plus a soft pink ring; multiline fields grow from 112. */
export function Input({
  invalid = false,
  disabled = false,
  shape = 'field',
  paddingLeft,
  multiline = false,
  style,
  onFocus,
  onBlur,
  ref,
  ...rest
}: Props) {
  const [focused, setFocused] = useState(false);
  const corner = shape === 'pill' ? radius.pill : radius.md;
  const borderColor = disabled
    ? colors.surfaceSoft
    : focused
      ? colors.pink500
      : invalid
        ? colors.error600
        : colors.control;

  return (
    // The ring is an outer view pulled back with a negative margin, so focusing never moves the layout.
    <View
      style={{
        padding: RING,
        margin: -RING,
        borderRadius: corner + RING,
        backgroundColor: focused && !disabled ? colors.pink100 : 'transparent',
      }}>
      <TextInput
        ref={ref}
        editable={!disabled}
        multiline={multiline}
        accessibilityState={{ disabled }}
        placeholderTextColor={colors.muted}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        style={[
          textStyles.bodyLg,
          {
            minHeight: multiline ? 112 : 56,
            borderWidth,
            borderColor,
            borderRadius: corner,
            backgroundColor: disabled ? colors.surfaceSoft : colors.surface,
            color: disabled ? colors.muted : colors.ink,
            paddingHorizontal: 18,
            paddingLeft,
            paddingVertical: multiline ? 16 : 0,
            textAlignVertical: multiline ? 'top' : 'center',
          },
          style,
        ]}
        {...rest}
      />
    </View>
  );
}
