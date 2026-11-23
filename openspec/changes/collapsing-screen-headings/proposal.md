## Why

Home and Discover open with a large heading that scrolls away with the content, so after a few cards the member no longer sees which screen or mode they are on. Airbnb-style large titles keep a smaller title pinned under the status bar while scrolling.

## What Changes

- Home and Discover show their heading in the design system's large `AppBar`, placed above the scrolling content. It starts large (44 pt), shrinks to a 24 pt title as the content scrolls past 48 pt, stays pinned under the status bar, and fades in a divider line when collapsed. The muted subtitle fades out as it collapses.
- The heading and subtitle that now sit inside the scrolling content on both screens are removed, so each screen has one heading.
- Discover's small uppercase line above the heading ("Explore public players" / "Players for your trips") is dropped. The subtitle already says the same thing for each mode.
- A small shared hook gives a screen the scroll value and the scroll handler for the bar, so the next tabs adopt it with a few lines.
- Search, filters and the Trips and Explore switch stay in the scrolling content and scroll away. Only the title is pinned.

Not in this change:
- Create and My matches (still placeholders), the Profile view (it has its own hero) and the Profile edit view.
- Any new copy; the existing heading and subtitle strings are reused.
- Pinning search or filters.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `app-shell`: adds a requirement that main tab screens keep their heading visible, in a smaller size, while their content scrolls.

## Impact

- `apps/mobile/src/app/(tabs)/index.tsx` and `discover.tsx`: use `AppBar variant="large"`, pass the scroll handler to the `ScrollView` and `FlatList`, and drop the in-content heading. The `SafeAreaView` stops padding the top, since the bar pads for the status bar itself.
- A new hook under `apps/mobile/src/` (or `@padel/ui`, decided in design).
- `apps/mobile/src/locales/en.json`: the two Discover eyebrow strings become unused and are removed.
- `packages/ui` `AppBar` is reused as it is; sizes are tuned on a device only if needed.
- No database, API or dependency changes. Builds on `main`, which already has the launch screen, the profile redesign and the dev tools.
