import { View } from 'react-native';

import { ThemedText } from './themed-text';
import { Radius, TileColors } from '../theme/tokens';

/** Up to two upper-case letters: the first letters of the first two words ("Jordi M." gives "JM"). */
export function initialsOf(name: string): string {
  const words = name
    .split(/\s+/)
    .map((word) => word.replace(/[^\p{L}]/gu, ''))
    .filter((word) => word.length > 0);
  return words
    .slice(0, 2)
    .map((word) => word[0]!.toUpperCase())
    .join('');
}

/** The same name always gets the same colour, so a card looks the same every time it appears. */
export function tileColorFor(name: string): string {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.codePointAt(0)!) >>> 0;
  return TileColors[hash % TileColors.length]!;
}

type Props = {
  name: string;
  size?: number;
};

/** A rounded tile with a person's initials. Decorative: the name is read from the text beside it. */
export function InitialsTile({ name, size = 48 }: Props) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        width: size,
        height: size,
        borderRadius: Radius.card,
        backgroundColor: tileColorFor(name),
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <ThemedText type="smallBold">{initialsOf(name)}</ThemedText>
    </View>
  );
}
