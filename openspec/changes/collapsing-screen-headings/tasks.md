# Tasks

## 1. Shared scroll hook (tests first)

- [x] 1.1 Write a failing test for `useCollapsingHeader`: it returns a scroll value starting at 0, and its `onScroll` handler moves the value to the scroll offset it receives (call it with a fake scroll event)
- [x] 1.2 Implement `useCollapsingHeader` returning `{ scrollY, onScroll }` with the JS driver, until 1.1 passes

## 2. Home (tests first)

- [x] 2.1 Add Home screen tests: one heading ("Find your next padel game") shown by the bar with the subtitle at the top; after a scroll event past 48 points the heading is still present and has shrunk to 24; the old in-content heading is gone; pull to refresh still reloads
- [x] 2.2 Switch Home to `AppBar variant="large"` above its `ScrollView`, wire `onScroll`, drop the in-content heading and subtitle, and stop the `SafeAreaView` padding the top, until 2.1 passes

## 3. Discover (tests first)

- [x] 3.1 Add Discover screen tests: one heading (member and guest wording) with the mode's subtitle at the top; after a scroll event the heading is still present and smaller; the eyebrow is gone; the search and mode switch are still in the list, not in the bar; refresh still works
- [x] 3.2 Switch Discover to `AppBar variant="large"` above its `FlatList`, wire `onScroll` and `scrollEventThrottle`, drop the in-content eyebrow, heading and subtitle, and stop the `SafeAreaView` padding the top, until 3.1 passes
- [x] 3.3 Remove the two unused eyebrow strings from `apps/mobile/src/locales/en.json`

## 4. Verify

- [x] 4.1 Run `pnpm turbo run check-types lint test` and confirm every task passes
- [ ] 4.2 In Expo Go or a device build, scroll Home and Discover: the heading shrinks smoothly and stays under the status bar, content slides under it, a long Discover title fits on a small phone and at a large text size, pull to refresh works, and the bar does not hide the first card; tune the `AppBar` distance or sizes only if something looks wrong
