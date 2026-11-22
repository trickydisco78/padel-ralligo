import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { FourthMark, MARK_COLORS, TOTAL_MS } from './FourthMark';

const PINK = '#E6005C';
const TINT = '#FFE3EE';

type Props = {
  /** Flip to true when your real loading is finished (fonts, session, first data). */
  ready: boolean;
  /** Called after the splash has faded out. Unmount it here. */
  onFinish: () => void;
  /** Called once the splash is on screen. This is the moment to hide the native splash. */
  onShown?: () => void;
  /** Which version of the mark: black square (default) or white square. */
  variant?: 'ink' | 'white';
  /** Needs the Outfit 800 font loaded first. Set false to show the mark only. */
  showWordmark?: boolean;
};

export function AnimatedSplash({ ready, onFinish, onShown, variant = 'ink', showWordmark = true }: Props) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(reduceMotion ? 1 : 0);
  const pulse = useSharedValue(1);
  const opacity = useSharedValue(1);
  const [introDone, setIntroDone] = useState(false);
  const closing = useRef(false);
  const shown = useRef(false);

  // 1. Play the intro once, then pulse the last ball while we wait for the app.
  useEffect(() => {
    if (reduceMotion) {
      progress.value = 1;
      setIntroDone(true);
      return;
    }
    progress.value = withTiming(1, { duration: TOTAL_MS, easing: Easing.linear });
    const id = setTimeout(() => {
      setIntroDone(true);
      pulse.value = withRepeat(
        withSequence(withTiming(1.18, { duration: 500 }), withTiming(1, { duration: 500 })),
        -1,
      );
    }, TOTAL_MS);
    return () => clearTimeout(id);
  }, [reduceMotion, progress, pulse]);

  // 2. Fade out only when BOTH the intro has played and the app is ready.
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish; // always call the latest callback, without restarting this effect
  const finishTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(finishTimer.current), []);
  useEffect(() => {
    if (!ready || !introDone || closing.current) return;
    closing.current = true;
    opacity.value = withTiming(0, { duration: 300 });
    finishTimer.current = setTimeout(() => onFinishRef.current(), 320);
  }, [ready, introDone, opacity]);

  const wordStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [2200 / TOTAL_MS, 2700 / TOTAL_MS], [0, 1], Extrapolation.CLAMP),
    transform: [
      {
        translateY: interpolate(progress.value, [2200 / TOTAL_MS, 2700 / TOTAL_MS], [12, 0], Extrapolation.CLAMP),
      },
    ],
  }));
  const rootStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[styles.root, rootStyle]}
      onLayout={() => {
        if (!shown.current) {
          shown.current = true;
          onShown?.();
        }
      }}
      accessible
      accessibilityLabel="Fourth, loading"
      importantForAccessibility="yes"
    >
      <View style={styles.center}>
        <FourthMark size={168} progress={progress} pulse={pulse} colors={MARK_COLORS[variant]} />
        {showWordmark && (
          <Animated.Text style={[styles.word, wordStyle]}>
            fourth<Text style={styles.dot}>.</Text>
          </Animated.Text>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFillObject, backgroundColor: PINK, alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  center: { alignItems: 'center', gap: 16 },
  // Outfit 800, letter-spacing -0.04em at 46px
  word: { fontFamily: 'Outfit_800ExtraBold', fontSize: 46, lineHeight: 52, letterSpacing: -1.84, color: '#FFFFFF' },
  dot: { color: TINT },
});
