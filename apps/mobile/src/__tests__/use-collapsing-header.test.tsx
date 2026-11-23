import { act, renderHook } from '@testing-library/react-native';
import type { Animated } from 'react-native';

import { useCollapsingHeader } from '@/hooks/use-collapsing-header';

/** The current number inside an `Animated.Value` (a private method, fine for a test). */
const valueOf = (v: Animated.Value) => (v as unknown as { __getValue(): number }).__getValue();
const scrollEvent = (y: number) => ({ nativeEvent: { contentOffset: { y } } });

describe('useCollapsingHeader', () => {
  it('starts at the top', async () => {
    const { result } = await renderHook(() => useCollapsingHeader());
    expect(valueOf(result.current.scrollY)).toBe(0);
  });

  it('follows the scroll offset it is given', async () => {
    const { result } = await renderHook(() => useCollapsingHeader());
    await act(async () => {
      result.current.onScroll(scrollEvent(30));
    });
    expect(valueOf(result.current.scrollY)).toBe(30);
    await act(async () => {
      result.current.onScroll(scrollEvent(0));
    });
    expect(valueOf(result.current.scrollY)).toBe(0);
  });

  it('keeps the same value and handler between renders, so the lists are not re-created', async () => {
    const { result, rerender } = await renderHook(() => useCollapsingHeader());
    const first = result.current;
    await rerender({});
    expect(result.current.scrollY).toBe(first.scrollY);
    expect(result.current.onScroll).toBe(first.onScroll);
  });

  it('asks for frequent scroll events so the title follows the finger', async () => {
    const { result } = await renderHook(() => useCollapsingHeader());
    expect(result.current.scrollEventThrottle).toBe(16);
  });
});
