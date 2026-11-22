/**
 * A small Reanimated stand-in for Jest, mapped to `react-native-reanimated/mock` in jest.config.cjs.
 *
 * Reanimated's own mock cannot load here: it needs Worklets natives, and its Jest resolver matches any path
 * containing "react-native-worklets", which pnpm puts in the folder name of many unrelated packages.
 * `expo-router/testing-library` also registers a Reanimated mock that requires this same path, so mapping it
 * keeps both mocks the same. It covers only what the app uses and is deterministic: animations jump straight
 * to their target, and animated styles and props are evaluated at render time from current shared values.
 */
import React from 'react';
import { Text, View } from 'react-native';

const state = { reducedMotion: false };

// A stable mutable object per component, like a real shared value.
export const useSharedValue = <T,>(initial: T) => React.useState(() => ({ value: initial }))[0];

const evaluate = <T,>(fn: () => T) => fn();

export const createAnimatedComponent = (Component: React.ComponentType<any> | string) => {
  const Animated = ({ animatedProps, ...props }: Record<string, unknown>) =>
    React.createElement(Component, { ...props, ...(animatedProps as object | undefined) });
  Animated.displayName = `Animated(${typeof Component === 'string' ? Component : (Component.displayName ?? Component.name ?? 'Component')})`;
  return Animated;
};

const linear = (t: number) => t;

export const interpolate = (value: number, input: number[], output: number[], clamp?: string) => {
  const [i0, i1] = [input[0]!, input[input.length - 1]!];
  const [o0, o1] = [output[0]!, output[output.length - 1]!];
  let t = (value - i0) / (i1 - i0);
  if (clamp === 'clamp') t = Math.min(1, Math.max(0, t));
  return o0 + (o1 - o0) * t;
};

const AnimatedModule = {
  View: createAnimatedComponent(View),
  Text: createAnimatedComponent(Text),
  createAnimatedComponent,
};

export default AnimatedModule;
export const AnimatedView = AnimatedModule.View;
export const useAnimatedProps = evaluate;
export const useAnimatedStyle = evaluate;
export const useReducedMotion = () => state.reducedMotion;
export const withTiming = <T,>(to: T) => to;
export const withRepeat = <T,>(animation: T) => animation;
export const withSequence = <T,>(...animations: T[]) => animations[animations.length - 1];
export const Easing = { linear, out: () => linear, cubic: linear, bezier: () => linear };
export const Extrapolation = { CLAMP: 'clamp', EXTEND: 'extend', IDENTITY: 'identity' } as const;

/** Test helper: `jest.requireMock('react-native-reanimated').__setReducedMotion(true)`. */
export const __setReducedMotion = (value: boolean) => {
  state.reducedMotion = value;
};
