import { useMemo } from 'react';
import { Animated } from 'react-native';

/**
 * Wires a list's scrolling to the large `AppBar`, so its title shrinks and stays pinned as the content moves.
 * Spread `onScroll` and `scrollEventThrottle` onto the `ScrollView` or `FlatList`, and pass `scrollY` to the bar.
 *
 * The bar animates font size, which is a layout property, so the value must use the JS driver; the native
 * driver would throw.
 */
export function useCollapsingHeader() {
  return useMemo(() => {
    const scrollY = new Animated.Value(0);
    const onScroll = Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false });
    return { scrollY, onScroll, scrollEventThrottle: 16 };
  }, []);
}
