import { colors } from '@padel/ui';
import Animated, { useAnimatedProps, type SharedValue } from 'react-native-reanimated';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { CENTRE_HALF, NET_HALF, OUTLINE, markFrame } from './timeline';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedRect = Animated.createAnimatedComponent(Rect);

const LINE_WIDTH = 3.5;

export type MarkColors = {
  /** Court lines and balls. */
  line: string;
  /** The filled cell, "the fourth". */
  fill: string;
  /** The ball inside the filled cell. */
  fillBall: string;
  /** The opening ball. */
  tint: string;
};

export const MARK_COLORS = {
  ink: { line: colors.surface, fill: colors.ink, fillBall: colors.surface, tint: colors.pink100 },
  white: { line: colors.surface, fill: colors.surface, fillBall: colors.pink500, tint: colors.pink100 },
} satisfies Record<string, MarkColors>;

type Props = {
  size: number;
  /** 0 to 1 across the intro; see `timeline.ts`. */
  progress: SharedValue<number>;
  /** Optional 1 to about 1.18 loop for the last ball while the app is still loading. */
  pulse?: SharedValue<number>;
  colors?: MarkColors;
};

/** The Fourth mark: a padel court that draws itself, three balls, then the fourth cell fills. */
export function FourthMark({ size, progress, pulse, colors: palette = MARK_COLORS.ink }: Props) {
  const centreBall = useAnimatedProps(() => ({ r: markFrame(progress.value).centreBall }));
  const net = useAnimatedProps(() => ({ strokeDashoffset: markFrame(progress.value).netOffset }));
  const centre = useAnimatedProps(() => ({ strokeDashoffset: markFrame(progress.value).centreOffset }));
  const outline = useAnimatedProps(() => ({ strokeDashoffset: markFrame(progress.value).outlineOffset }));
  const ball1 = useAnimatedProps(() => ({ r: markFrame(progress.value).ball1 }));
  const ball2 = useAnimatedProps(() => ({ r: markFrame(progress.value).ball2 }));
  const ball3 = useAnimatedProps(() => ({ r: markFrame(progress.value).ball3 }));
  const cell = useAnimatedProps(() => markFrame(progress.value).cell);
  const ball4 = useAnimatedProps(() => ({ r: markFrame(progress.value).ball4 * (pulse ? pulse.value : 1) }));

  const stroke = { stroke: palette.line, strokeWidth: LINE_WIDTH, strokeLinecap: 'round' as const, fill: 'none' };

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <AnimatedRect fill={palette.fill} rx={2} animatedProps={cell} />
      <AnimatedRect x={18} y={18} width={64} height={64} rx={4} {...stroke} strokeDasharray={[OUTLINE, OUTLINE]} animatedProps={outline} />
      <AnimatedPath d="M50 50H8" {...stroke} strokeDasharray={[NET_HALF, NET_HALF]} animatedProps={net} />
      <AnimatedPath d="M50 50H92" {...stroke} strokeDasharray={[NET_HALF, NET_HALF]} animatedProps={net} />
      <AnimatedPath d="M50 50V18" {...stroke} strokeDasharray={[CENTRE_HALF, CENTRE_HALF]} animatedProps={centre} />
      <AnimatedPath d="M50 50V82" {...stroke} strokeDasharray={[CENTRE_HALF, CENTRE_HALF]} animatedProps={centre} />
      <AnimatedCircle cx={50} cy={50} fill={palette.tint} animatedProps={centreBall} />
      <AnimatedCircle cx={28} cy={28} fill={palette.line} animatedProps={ball1} />
      <AnimatedCircle cx={72} cy={28} fill={palette.line} animatedProps={ball2} />
      <AnimatedCircle cx={28} cy={72} fill={palette.line} animatedProps={ball3} />
      <AnimatedCircle cx={72} cy={72} fill={palette.fillBall} animatedProps={ball4} />
    </Svg>
  );
}

