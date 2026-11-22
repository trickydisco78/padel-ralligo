/** `full` plays the whole intro; `short` shows the finished mark and leaves as soon as the app is ready. */
export type Intro = 'full' | 'short';

type Facts = {
  /** Whether the intro has been seen on this device; `null` when the flag could not be read. */
  seen: boolean | null;
  reducedMotion: boolean;
  /** iOS or Android. The flag store only exists there. */
  native: boolean;
};

/**
 * The full intro is for the first launch of a native build. Anything uncertain (an unreadable flag, reduced
 * motion, a non-native platform) gets the short version, so launch is never slower than it has to be.
 */
export function introFor({ seen, reducedMotion, native }: Facts): Intro {
  return native && !reducedMotion && seen === false ? 'full' : 'short';
}
