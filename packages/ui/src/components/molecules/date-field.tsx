import { parseIsoDate, type IsoDate } from '@padel/core';
import { useTranslation } from '@padel/i18n';
import { useState } from 'react';

import { FormField } from './form-field';

type Props = {
  label: string;
  value: IsoDate | null;
  onChange: (date: IsoDate | null) => void;
  error?: string;
};

/** Typed YYYY-MM-DD date. Reports null until the text is a real calendar date. */
export function DateField({ label, value, onChange, error }: Props) {
  const { t } = useTranslation('ui');
  const [text, setText] = useState(value ?? '');

  return (
    <FormField
      label={label}
      value={text}
      placeholder={t('dateField.placeholder')}
      keyboardType="numbers-and-punctuation"
      autoCapitalize="none"
      onChangeText={(next) => {
        setText(next);
        onChange(parseIsoDate(next));
      }}
      error={error ?? (text !== '' && value === null ? t('dateField.invalidFormat') : undefined)}
    />
  );
}
