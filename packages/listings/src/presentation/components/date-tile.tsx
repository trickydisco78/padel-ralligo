import { colors, fontFamily, radius } from '@padel/ui';
import type { IsoDate } from '@padel/core';
import { Text, View } from 'react-native';

import { dateParts } from '../format-date';

/** The pink date tile that leads a match: weekday, day of the month, month. Decorative: the date is also written out. */
export function DateTile({ date }: { date: IsoDate }) {
  const parts = dateParts(date);
  const small = { color: colors.pink700, fontFamily: fontFamily[700], fontSize: 12, lineHeight: 14, letterSpacing: 0.5 };
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width: 68, height: 76, borderRadius: radius.sm, backgroundColor: colors.pink100, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={small}>{parts.weekday}</Text>
      <Text style={{ color: colors.ink, fontFamily: fontFamily[800], fontSize: 30, lineHeight: 32 }}>{parts.day}</Text>
      <Text style={small}>{parts.month}</Text>
    </View>
  );
}
