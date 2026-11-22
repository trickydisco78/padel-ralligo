import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import Animated, { SharedValue, useAnimatedProps } from 'react-native-reanimated';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedRect = Animated.createAnimatedComponent(Rect);

/** One pass of the intro, in milliseconds. `progress` runs 0 -> 1 across this time. */
export const TOTAL_MS = 2500;
const at = (ms: number) => ms / TOTAL_MS;

// ---- tiny easing helpers (worklets run on the UI thread) ----
const clamp01 = (x: number) => {
  'worklet';
  return Math.min(1, Math.max(0, x));
};
/** 0 before `from`, 1 after `to`, linear in between (both in progress units 0..1). */
const seg = (p: number, from: number, to: number) => {
  'worklet';
  return clamp01((p - from) / (to - from));
};
const easeOut = (x: number) => {
  'worklet';
  return 1 - Math.pow(1 - x, 3);
};
/** Overshoots slightly, so balls pop in. */
const backOut = (x: number) => {
  'worklet';
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};

// Stroke lengths in the 100-unit design box
const OUTLINE = 249.13; // 64 x 64 square, 4 radius
const NET_HALF = 42; // 50 -> 8 and 50 -> 92
const CENTRE_HALF = 32; // 50 -> 18 and 50 -> 82

const LINE_WIDTH = 3.5;
const BALL_R = 4.5;

export type MarkColors = {
  line: string; // court lines and balls
  fill: string; // the filled cell, "the fourth"
  fillBall: string; // the ball inside the filled cell
  tint: string; // the opening ball
};

export const MARK_COLORS = {
  ink: { line: '#FFFFFF', fill: '#1A1218', fillBall: '#FFFFFF', tint: '#FFE3EE' },
  white: { line: '#FFFFFF', fill: '#FFFFFF', fillBall: '#E6005C', tint: '#FFE3EE' },
} satisfies Record<string, MarkColors>;

type Props = {
  size: number;
  progress: SharedValue<number>;
  /** Optional 1 -> ~1.18 -> 1 loop for the last ball while the app is still loading. */
  pulse?: SharedValue<number>;
  colors?: MarkColors;
};

export function FourthMark({ size, progress, pulse, colors = MARK_COLORS.ink }: Props) {
  // Opening ball: pops in, then disappears as the lines draw out from it
  const centreBall = useAnimatedProps(() => {
    const p = progress.value;
    return { r: 6 * backOut(seg(p, at(0), at(250))) * (1 - easeOut(seg(p, at(700), at(900)))) };
  });

  // Lines draw outward from the centre
  const netLeft = useAnimatedProps(() => ({
    strokeDashoffset: NET_HALF * (1 - easeOut(seg(progress.value, at(150), at(650)))),
  }));
  const netRight = useAnimatedProps(() => ({
    strokeDashoffset: NET_HALF * (1 - easeOut(seg(progress.value, at(150), at(650)))),
  }));
  const centreUp = useAnimatedProps(() => ({
    strokeDashoffset: CENTRE_HALF * (1 - easeOut(seg(progress.value, at(400), at(800)))),
  }));
  const centreDown = useAnimatedProps(() => ({
    strokeDashoffset: CENTRE_HALF * (1 - easeOut(seg(progress.value, at(400), at(800)))),
  }));
  const outline = useAnimatedProps(() => ({
    strokeDashoffset: OUTLINE * (1 - easeOut(seg(progress.value, at(600), at(1200)))),
  }));

  // Three players arrive, one after another
  const ball1 = useAnimatedProps(() => ({ r: BALL_R * backOut(seg(progress.value, at(1100), at(1400))) }));
  const ball2 = useAnimatedProps(() => ({ r: BALL_R * backOut(seg(progress.value, at(1250), at(1550))) }));
  const ball3 = useAnimatedProps(() => ({ r: BALL_R * backOut(seg(progress.value, at(1400), at(1700))) }));

  // The fourth: the cell fills from its middle, then its ball lands
  const cell = useAnimatedProps(() => {
    const s = 28 * easeOut(seg(progress.value, at(1700), at(2050)));
    return { x: 66 - s / 2, y: 66 - s / 2, width: s, height: s };
  });
  const ball4 = useAnimatedProps(() => ({
    r: BALL_R * backOut(seg(progress.value, at(2000), at(2300))) * (pulse ? pulse.value : 1),
  }));

  const stroke = {
    stroke: colors.line,
    strokeWidth: LINE_WIDTH,
    strokeLinecap: 'round' as const,
    fill: 'none',
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <AnimatedRect fill={colors.fill} rx={2} animatedProps={cell} />
      <AnimatedRect x={18} y={18} width={64} height={64} rx={4} {...stroke} strokeDasharray={[OUTLINE, OUTLINE]} animatedProps={outline} />
      <AnimatedPath d="M50 50H8" {...stroke} strokeDasharray={[NET_HALF, NET_HALF]} animatedProps={netLeft} />
      <AnimatedPath d="M50 50H92" {...stroke} strokeDasharray={[NET_HALF, NET_HALF]} animatedProps={netRight} />
      <AnimatedPath d="M50 50V18" {...stroke} strokeDasharray={[CENTRE_HALF, CENTRE_HALF]} animatedProps={centreUp} />
      <AnimatedPath d="M50 50V82" {...stroke} strokeDasharray={[CENTRE_HALF, CENTRE_HALF]} animatedProps={centreDown} />
      <AnimatedCircle cx={50} cy={50} fill={colors.tint} animatedProps={centreBall} />
      <AnimatedCircle cx={28} cy={28} fill={colors.line} animatedProps={ball1} />
      <AnimatedCircle cx={72} cy={28} fill={colors.line} animatedProps={ball2} />
      <AnimatedCircle cx={28} cy={72} fill={colors.line} animatedProps={ball3} />
      <AnimatedCircle cx={72} cy={72} fill={colors.fillBall} animatedProps={ball4} />
    </Svg>
  );
}
