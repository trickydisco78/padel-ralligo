import type { ComponentProps } from 'react';
import { TextInput, View } from 'react-native';

import { useTranslation } from '@padel/i18n';

import { fontFamily, spacing } from '../../theme/tokens';
import { HelperText } from '../atoms/helper-text';
import { Input } from '../atoms/input';
import { ThemedText } from '../atoms/themed-text';

type InputProps = ComponentProps<typeof Input>;

type Props = Omit<InputProps, 'invalid' | 'accessibilityLabel'> & {
  /** Always visible above the input. A placeholder is an example, never the label. */
  label: string;
  /** Marks an optional field with "Optional" on the right. Required is the default, so there is no asterisk. */
  optional?: boolean;
  /** What to type or how it is used. An error replaces it. */
  helper?: string;
  /** What went wrong and how to fix it. Replaces the helper. */
  error?: string;
  /** Shown on the right of the helper line, e.g. "12/40". */
  count?: string;
  /** For moving focus into the field, e.g. when arriving from a search entry elsewhere. */
  ref?: ComponentProps<typeof TextInput>['ref'];
};

/** A label, an input and a line of help or error, stacked as one field. */
export function FormField({ label, optional = false, helper, error, count, ...input }: Props) {
  const { t } = useTranslation('ui');
  const message = error ?? helper;
  return (
    <View style={{ gap: spacing.space1 + 2 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <ThemedText type="label">{label}</ThemedText>
        {optional ? (
          <ThemedText type="caption" themeColor="muted" style={{ fontFamily: fontFamily[500] }}>
            {t('formField.optional')}
          </ThemedText>
        ) : null}
      </View>
      <Input accessibilityLabel={label} accessibilityHint={message} invalid={error !== undefined} {...input} />
      {message ? (
        <HelperText error={error !== undefined} count={count}>
          {message}
        </HelperText>
      ) : null}
    </View>
  );
}
