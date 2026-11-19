import { colors } from '@padel/ui';
import { View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

/** Height of the pink block; the white sheet overlaps its lower edge. */
export const MATCH_HERO_HEIGHT = 250;

/**
 * The pink hero behind a match: two decorative circles and the top-down padel court motif in white.
 * Purely decorative, so it is hidden from assistive technology.
 */
export function MatchHero() {
  return (
    <View
      testID="match-hero"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, height: MATCH_HERO_HEIGHT, overflow: 'hidden', backgroundColor: colors.pink500 }}>
      <View style={{ position: 'absolute', right: -70, top: -70, width: 240, height: 240, borderRadius: 120, backgroundColor: colors.pink400 }} />
      <View style={{ position: 'absolute', left: -60, bottom: -40, width: 180, height: 180, borderRadius: 90, backgroundColor: colors.pink600 }} />
      <View style={{ position: 'absolute', top: 88, left: 0, right: 0, alignItems: 'center' }}>
        <Svg width={230} height={120} viewBox="0 0 260 136" fill="none">
          <Rect x={2} y={2} width={256} height={132} rx={6} stroke={colors.surface} strokeWidth={3} />
          <Path d="M2 68h256M60 2v132M200 2v132M130 2v132" stroke={colors.surface} strokeWidth={3} />
          <Circle cx={168} cy={44} r={9} fill={colors.surface} />
        </Svg>
      </View>
    </View>
  );
}
