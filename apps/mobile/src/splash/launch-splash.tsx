import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { useAppStatus } from '@/session/app-status';

import { AnimatedSplash } from './animated-splash';
import { introFor, type Intro } from './intro';
import { markIntroSeen, readIntroSeen } from './intro-seen';

/** Reading the seen flag, showing the launch screen, or gone. */
type LaunchState = { kind: 'checking' } | { kind: 'playing'; intro: Intro } | { kind: 'finished' };

const isNative = Platform.OS === 'ios' || Platform.OS === 'android';

/**
 * The launch screen over the app, from the moment fonts are ready until the first session and profile status
 * is known. The native splash stays up while the seen flag is read, and is hidden once this is on screen.
 * The first launch plays the whole intro and records it as seen only after it has finished.
 */
export function LaunchSplash() {
  const status = useAppStatus();
  const reducedMotion = useReducedMotion();
  const [state, setState] = useState<LaunchState>({ kind: 'checking' });

  useEffect(() => {
    let cancelled = false;
    readIntroSeen().then((seen) => {
      if (!cancelled) setState({ kind: 'playing', intro: introFor({ seen, reducedMotion, native: isNative }) });
    });
    return () => {
      cancelled = true;
    };
    // The decision is made once, at launch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (state.kind !== 'playing') return null;

  return (
    <AnimatedSplash
      ready={status !== 'loading'}
      intro={state.intro}
      onShown={() => SplashScreen.hide()}
      onFinish={() => {
        setState({ kind: 'finished' });
        if (state.intro === 'full') void markIntroSeen();
      }}
    />
  );
}
