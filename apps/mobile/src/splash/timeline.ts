/**
 * The launch intro as pure maths. One `progress` value runs 0 to 1 across TOTAL_MS and every part of the
 * mark is a function of it, so all parts stay in sync and re-timing is a change of numbers here. The
 * functions are marked as worklets so Reanimated can run them on the UI thread; they are plain functions
 * in Jest.
 */

/** One pass of the intro in milliseconds; the wordmark finishes rising exactly at the end. */
export const TOTAL_MS = 2700;

/** A time in milliseconds as a progress value (0..1). */
export const at = (ms: number) => {
  'worklet';
  return ms / TOTAL_MS;
};

export const clamp01 = (x: number) => {
  'worklet';
  return Math.min(1, Math.max(0, x));
};

/** 0 before `from`, 1 after `to`, linear in between (all in progress units). */
export const seg = (p: number, from: number, to: number) => {
  'worklet';
  return clamp01((p - from) / (to - from));
};

export const easeOut = (x: number) => {
  'worklet';
  return 1 - Math.pow(1 - x, 3);
};

/** Overshoots slightly on the way, so balls pop in. */
export const backOut = (x: number) => {
  'worklet';
  // Exact ends: the formula leaves about 1e-15 at 0, which would draw a hairline ball before its time.
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};

// Stroke lengths in the 100-unit design box.
export const OUTLINE = 249.13; // 64 x 64 square with a 4 radius: 4 x 56 + 2 pi x 4
export const NET_HALF = 42; // 50 to 8 and 50 to 92
export const CENTRE_HALF = 32; // 50 to 18 and 50 to 82
export const BALL_R = 4.5;
export const OPENING_BALL_R = 6;
export const CELL_SIZE = 28;

export type MarkFrame = {
  centreBall: number;
  netOffset: number;
  centreOffset: number;
  outlineOffset: number;
  ball1: number;
  ball2: number;
  ball3: number;
  ball4: number;
  cell: { x: number; y: number; width: number; height: number };
};

/** Every animated value of the mark at `progress`. Lines are drawn by their dash offset (full length to 0). */
export const markFrame = (progress: number): MarkFrame => {
  'worklet';
  const cellSize = CELL_SIZE * easeOut(seg(progress, at(1700), at(2050)));
  return {
    // The opening ball pops in, then disappears as the lines draw out from it.
    centreBall: OPENING_BALL_R * backOut(seg(progress, at(0), at(250))) * (1 - easeOut(seg(progress, at(700), at(900)))),
    netOffset: NET_HALF * (1 - easeOut(seg(progress, at(150), at(650)))),
    centreOffset: CENTRE_HALF * (1 - easeOut(seg(progress, at(400), at(800)))),
    outlineOffset: OUTLINE * (1 - easeOut(seg(progress, at(600), at(1200)))),
    // Three players arrive, one after another.
    ball1: BALL_R * backOut(seg(progress, at(1100), at(1400))),
    ball2: BALL_R * backOut(seg(progress, at(1250), at(1550))),
    ball3: BALL_R * backOut(seg(progress, at(1400), at(1700))),
    // The fourth: the cell fills from its middle, then its ball lands.
    cell: { x: 66 - cellSize / 2, y: 66 - cellSize / 2, width: cellSize, height: cellSize },
    ball4: BALL_R * backOut(seg(progress, at(2000), at(2300))),
  };
};

/** The wordmark rises 12 points and fades in between 2200 and 2700 ms. */
export const wordFrame = (progress: number) => {
  'worklet';
  const t = seg(progress, at(2200), at(2700));
  return { opacity: t, translateY: 12 * (1 - t) };
};
