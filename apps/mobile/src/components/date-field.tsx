import { parseIsoDate, type IsoDate } from '@repo/core';
import { useState } from 'react';

import { TextField } from '@/components/text-field';

type Props = {
  label: string;
  value: IsoDate | null;
  onChange: (date: IsoDate | null) => void;
  error?: string;
};

/** Typed YYYY-MM-DD date. Reports null until the text is a real calendar date. */
export function DateField({ label, value, onChange, error }: Props) {
  const [text, setText] = useState(value ?? '');

  return (
    <TextField
      label={label}
      value={text}
      placeholder="YYYY-MM-DD"
      keyboardType="numbers-and-punctuation"
      autoCapitalize="none"
      onChangeText={(next) => {
        setText(next);
        onChange(parseIsoDate(next));
      }}
      error={error ?? (text !== '' && value === null ? 'Use the format YYYY-MM-DD' : undefined)}
    />
  );
}
