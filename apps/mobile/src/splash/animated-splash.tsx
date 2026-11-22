import { useTranslation } from '@padel/i18n';
import { colors, fontFamily } from '@padel/ui';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { FourthMark, MARK_COLORS } from './fourth-mark';
import type { Intro } from './intro';
import { TOTAL_MS, wordFrame } from './timeline';

const FADE_MS = 300;
/** After the full intro, "fourth." stays on screen this long so there is time to read it. */
export const READ_HOLD_MS = 1500;
/** onFinish waits a little longer than the fade so the last frame is never cut short. */
const FINISH_DELAY_MS = 320;

type Props = {
  /** Flip to true when real loading is finished (fonts, session, first status). */
  ready: boolean;
  /** `full` plays the whole intro first; `short` shows the finished mark. Reduced motion is always short. */
  intro: Intro;
  /** Called once the splash has faded out. Unmount it here. */
  onFinish: () => void;
  /** Called once when the splash is on screen: the moment to hide the native splash. */
  onShown?: () => void;
  /** Black square (default) or white square. */
  variant?: keyof typeof MARK_COLORS;
  /** Needs Outfit 800 loaded first. Set false to show the mark only. */
  showWordmark?: boolean;
};

/**
 * The launch screen: pink, with the Fourth mark. It leaves only when both the intro has played and the app
 * is ready, fading out over 300 ms, then calls onFinish once.
 */
export function AnimatedSplash({ ready, intro, onFinish, onShown, variant = 'ink', showWordmark = true }: Props) {
  const { t } = useTranslation('app');
  const reduceMotion = useReducedMotion();
  const short = intro === 'short' || reduceMotion;

  const progress = useSharedValue(short ? 1 : 0);
  const pulse = useSharedValue(1);
  const opacity = useSharedValue(1);
  const [introDone, setIntroDone] = useState(short);
  const closing = useRef(false);
  const shown = useRef(false);

  // 1. Full intro: play once, pulse the last ball, and hold so the name can be read before the fade.
  useEffect(() => {
    if (short) return;
    progress.value = withTiming(1, { duration: TOTAL_MS, easing: Easing.linear });
    const pulseId = setTimeout(() => {
      pulse.value = withRepeat(withSequence(withTiming(1.18, { duration: 500 }), withTiming(1, { duration: 500 })), -1);
    }, TOTAL_MS);
    const doneId = setTimeout(() => setIntroDone(true), TOTAL_MS + READ_HOLD_MS);
    return () => {
      clearTimeout(pulseId);
      clearTimeout(doneId);
    };
  }, [short, progress, pulse]);

  // 2. Fade out only when BOTH the intro has played and the app is ready.
  const onFinishRef = useRef(onFinish);
  useEffect(() => {
    onFinishRef.current = onFinish; // always the latest callback, without restarting the effect below
  });
  const finishTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(finishTimer.current), []);
  useEffect(() => {
    if (!ready || !introDone || closing.current) return;
    closing.current = true;
    opacity.value = withTiming(0, { duration: FADE_MS });
    finishTimer.current = setTimeout(() => onFinishRef.current(), FINISH_DELAY_MS);
  }, [ready, introDone, opacity]);

  const wordStyle = useAnimatedStyle(() => {
    const { opacity: o, translateY } = wordFrame(progress.value);
    return { opacity: o, transform: [{ translateY }] };
  });
  const rootStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[styles.root, rootStyle]}
      onLayout={() => {
        if (shown.current) return;
        shown.current = true;
        onShown?.();
      }}
      accessible
      accessibilityLabel={t('launch.loading')}
      importantForAccessibility="yes">
      <View style={styles.center}>
        <FourthMark size={168} progress={progress} pulse={pulse} colors={MARK_COLORS[variant]} />
        {showWordmark ? (
          <Animated.Text style={[styles.word, wordStyle]}>
            fourth<Text style={styles.dot}>.</Text>
          </Animated.Text>
        ) : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.pink500,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  center: { alignItems: 'center', gap: 16 },
  // Outfit 800 at 46 with letter-spacing -0.04em
  word: { fontFamily: fontFamily[800], fontSize: 46, lineHeight: 52, letterSpacing: -1.84, color: colors.surface },
  dot: { color: colors.pink100 },
});
