import { Text, View } from 'react-native';

import { type ColorToken, colors, fontFamily, radius, spacing, type as textStyles } from '../../theme/tokens';

export type BadgeVariant = 'neutral' | 'brand' | 'tint' | 'ink' | 'pending' | 'success';

type Props = {
  label: string;
  variant?: BadgeVariant;
  /** Small uppercase tag, for use on the pink feature card. */
  caps?: boolean;
};

const looks: Record<BadgeVariant, { background: ColorToken; text: ColorToken; font: string }> = {
  neutral: { background: 'surfaceSoft', text: 'ink', font: fontFamily[600] },
  brand: { background: 'pink500', text: 'surface', font: fontFamily[700] },
  tint: { background: 'pink100', text: 'pink700', font: fontFamily[700] },
  ink: { background: 'ink', text: 'surface', font: fontFamily[700] },
  pending: { background: 'amber100', text: 'amber800', font: fontFamily[700] },
  success: { background: 'green100', text: 'green800', font: fontFamily[700] },
};

/** A small pill label for a level, spots needed or a request status. Keep the text to two words. */
export function Badge({ label, variant = 'neutral', caps = false }: Props) {
  const look = looks[variant];
  // Caps badges sit on a pink500 surface, so they use the deeper pink ground.
  const background = caps ? colors.pink600 : colors[look.background];
  const text = caps ? colors.surface : colors[look.text];
  return (
    <View
      accessible
      accessibilityLabel={label}
      style={{
        alignSelf: 'flex-start',
        height: caps ? 28 : 30,
        paddingHorizontal: spacing.space3,
        borderRadius: radius.pill,
        backgroundColor: background,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
      }}>
      {variant === 'ink' && !caps ? (
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.pink300 }} />
      ) : null}
      {caps ? (
        <Text style={[textStyles.overline, { color: text }]}>{label.toUpperCase()}</Text>
      ) : (
        <Text style={{ color: text, fontFamily: look.font, fontSize: 13, lineHeight: 18 }}>{label}</Text>
      )}
    </View>
  );
}
