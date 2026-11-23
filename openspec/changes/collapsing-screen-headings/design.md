# Design

## Context

- `packages/ui/src/components/organisms/app-bar.tsx` already has a `large` variant: the title goes from 44 pt (`displayXl`) to 24 pt over 48 pt of scroll, a muted subtitle fades out and collapses, a hairline divider fades in, and the bar pads itself by the safe-area top inset. It takes an optional `scrollY: Animated.Value` (React Native core) and is unit tested, including the 44 to 24 collapse. No tab screen uses it yet; only the `detail` variant is used (match details, Manage match).
- Home is a `ScrollView` with `RefreshControl` inside a `SafeAreaView`; its heading and subtitle are the first children. Discover is a `FlatList` inside a `SafeAreaView`; its `ListHeaderComponent` holds an uppercase eyebrow, the 32 pt heading, a subtitle, then the Trips and Explore switch, search and filters.
- The bar animates `fontSize`, `lineHeight` and `letterSpacing`, which are layout properties, so the `Animated.Value` must be driven without the native driver.
- The tab bar is native and floats over content (see #43); this change does not touch it.

## Goals / Non-Goals

**Goals:**
- Home and Discover keep a heading on screen while scrolling, shrinking as in the design system's large app bar.
- One shared way to wire the scroll to the bar, so later tabs adopt it in a few lines.
- No change to data, refresh, filters or navigation behaviour.

**Non-Goals:**
- Pinning search or filters, or any sticky section other than the title.
- Create, My matches, and the Profile view and edit view.
- Redesigning the bar. Only tuning its distance or sizes if a device check shows a problem.

## Decisions

1. **Reuse `AppBar variant="large"` as it is.** It is already tested and matches the design; building another collapsing header would duplicate it. The bar sits above the scroll view, not inside the list, so it never scrolls away. Alternative: a sticky list header. Rejected: it gives a different feel and does not shrink the font.
2. **A `useCollapsingHeader` hook returns `{ scrollY, onScroll }`.** `scrollY` is one `Animated.Value`; `onScroll` is `Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })`. Screens pass `onScroll` and `scrollEventThrottle={16}` to their list. It lives in `apps/mobile/src/` next to the screens for now; it moves to `@padel/ui` if a package screen needs it. Alternative: each screen builds its own value. Rejected: the wiring is easy to get wrong (a native driver crashes the font animation).
3. **The screen's `SafeAreaView` stops padding the top.** The bar pads for the status bar itself, so the screen keeps `edges` for the sides and bottom only; otherwise the heading would sit a status bar's height too low. The scroll content keeps its own padding, minus the heading.
4. **Discover's eyebrow is dropped.** The subtitle already differs per mode and says the same thing; the app bar has a title and a subtitle but no third line. The two locale keys are deleted. Alternative: keep the eyebrow at the top of the scrolling content under the bar. Rejected: it would read as a second heading below the first.
5. **The Discover heading keeps its two strings** (`discover.title` for members, `discover.titleGuest` for guests); the subtitle stays mode-based. Home uses `home.title` and `home.subtitle`.
6. **Reduced motion needs no special case.** The collapse follows the member's own finger, not a timed animation, so it is not a motion effect that Reduce Motion is meant to stop. It does not auto-play.
7. **Accessibility.** The bar's title is the screen's only `header`. The removed in-content headings are what made two headers possible, so removing them is part of the change.

8. **The large title may wrap to two lines.** Found on the simulator: with one line, "Find your next padel game" was cut off ("Find your next p…") at 44 pt. `AppBar`'s large title now allows two lines; once collapsed (24 pt) it fits on one. The bar's height follows the animated line height, so it shrinks with the title.

## Risks / Trade-offs

- **Non-native animation on the JS thread.** Font size changes cannot use the native driver, so a busy JS thread (a long list render) can make the collapse stutter. The collapse range is only 48 pt, and the list is paged. A device check (task) decides whether it is smooth enough; if not, the fallback is a cross-fade between two fixed-size titles on the native driver.
- **Heading text length.** Fixed by decision 8 (two lines while large). Very long titles at the largest text sizes could still need three lines; the device check covers a small phone and a large text size.
- **Less room at the top.** The pinned bar takes about 56 pt plus the status bar while scrolling, which is the point, but it is the cost on small screens.
- **`discover.test.tsx` and `home.test.tsx` assert the headings,** which move into the bar; the queries by heading role stay valid.

## Open Questions

- None blocking. The eyebrow removal (decision 4) is an assumption; if the eyebrow is wanted, it can return as a small line in the first row of the list.
