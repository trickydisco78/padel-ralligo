import { Text, View } from 'react-native';

import { type ColorToken, colors, fontFamily } from '../../theme/tokens';

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

export type AvatarVariant = 'ink' | 'tint' | 'brand';
export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl' | 'hero';

type Props = {
  /** The person's name. The avatar shows its initials. */
  name: string;
  variant?: AvatarVariant;
  size?: AvatarSize;
  /**
   * Set when the avatar stands alone: it is then read out as an image with the name.
   * Leave off when the name is written beside it, so it is not read twice.
   */
  labelled?: boolean;
};

const looks: Record<AvatarVariant, { background: ColorToken; text: ColorToken }> = {
  ink: { background: 'ink', text: 'pink300' },
  tint: { background: 'pink100', text: 'pink700' },
  brand: { background: 'pink500', text: 'surface' },
};
const sizes = { sm: [36, 13], md: [48, 16], lg: [64, 22], xl: [96, 34], hero: [104, 38] } as const;

/** Initials in a circle, standing in for a photo. The 96 size is a rounded tile with a white ring; `hero` is a round 104 with a thicker ring, for straddling a hero band. */
export function Avatar({ name, variant = 'ink', size = 'md', labelled = false }: Props) {
  const [dimension, fontSize] = sizes[size];
  const look = looks[variant];
  const tile = size === 'xl';
  const ring = size === 'hero' ? 5 : tile ? 4 : 0;
  return (
    <View
      accessible={labelled}
      accessibilityRole={labelled ? 'image' : undefined}
      accessibilityLabel={labelled ? name : undefined}
      accessibilityElementsHidden={!labelled}
      importantForAccessibility={labelled ? 'auto' : 'no-hide-descendants'}
      style={{
        width: dimension,
        height: dimension,
        borderRadius: tile ? 30 : dimension / 2,
        backgroundColor: colors[look.background],
        borderWidth: ring,
        borderColor: colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Text style={{ color: colors[look.text], fontFamily: fontFamily[800], fontSize, lineHeight: fontSize + 4 }}>
        {initialsOf(name)}
      </Text>
    </View>
  );
}
