import { Avatar, colors } from '@padel/ui';
import { View } from 'react-native';

/** Height of the pink band, below the status bar. */
export const HERO_HEIGHT = 190;
/** How far the white sheet rises into the pink band. */
export const SHEET_RISE = 40;
/** How far the round avatar reaches below the top of the sheet (half its 104 points). */
export const HERO_AVATAR_OVERLAP = 52;

type Props = {
  /** The member's name, shown as initials in the avatar. */
  name: string;
  /** Space above the band for the status bar and notch, so the pink runs to the top edge. */
  topInset?: number;
};

/** The pink band with its two decorative circles. Render the sheet straight after it, pulled up by `SHEET_RISE`. */
export function ProfileHero({ topInset = 0 }: { topInset?: number }) {
  return (
    <View style={{ height: HERO_HEIGHT + topInset, backgroundColor: colors.pink500, overflow: 'hidden' }}>
      <View
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{ position: 'absolute', right: -70, top: -70, width: 240, height: 240, borderRadius: 120, backgroundColor: colors.pink400 }}
      />
      <View
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{ position: 'absolute', left: -60, bottom: -60, width: 180, height: 180, borderRadius: 90, backgroundColor: colors.pink600 }}
      />
    </View>
  );
}

/**
 * The round initials avatar straddling the join of the band and the sheet. It must be rendered AFTER the sheet in
 * the same parent, or the sheet paints over its lower half.
 */
export function ProfileAvatar({ name, topInset = 0 }: Props) {
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: HERO_HEIGHT + topInset - SHEET_RISE - HERO_AVATAR_OVERLAP,
        alignItems: 'center',
      }}>
      <Avatar name={name} size="hero" />
    </View>
  );
}
