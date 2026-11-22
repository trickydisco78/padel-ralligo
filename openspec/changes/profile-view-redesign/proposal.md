## Why

The own-profile view added in `profile-view-and-edit-modes` is a plain player card with text underneath. The design canvas has a refined signed-in profile (artboard "Member · Profile") with a pink hero, an avatar that overlaps the hero and the sheet, an Edit profile pill and a level card. Aligning the view with it makes the Profile tab match the rest of the redesigned app.

## What Changes

- Restyle the profile **view** mode to the "Member · Profile" artboard, using only data the app already stores:
  - pink hero band with the two decorative circles, and a white sheet with rounded top corners overlapping it
  - initials avatar overlapping the hero and the sheet
  - centred name and a muted "skill tier · home city" line
  - Edit profile as an outlined pill with a pencil icon
  - a pink "Your level" card showing the skill tier label
  - About section (or the existing "Add a bio" prompt)
- Move the copy this adds ("Your level") into the `profiles` locale file; use `@padel/ui` tokens and no hard-coded colours.
- Keep as they are: the reducer and view/edit modes, the edit form, trips, listings and sign out.

Not built in this change (each to be logged as a backlog item):

- numeric level, trend chip and trend chart
- Wins, Side and matches-played stats
- profile photo and the camera badge
- the settings button in the hero
- "Your next match": the only existing hook is the member's hosted listings, which "My listings" below already shows
- the guest profile redesign (separate artboard) and the floating tab bar

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `player-profiles`: adds requirements for how the own-profile view is laid out. The view's content and the edit flow are unchanged (`profile-view-and-edit-modes` owns those).

## Impact

- `packages/profiles`: `ProfileView` (rewritten layout), a new hero/level-card presentation, `locales/en.json`, tests. `ProfileHeader` stays exported and is no longer used by the view.
- `packages/ui`: possibly a small shared hero component if the design repeats elsewhere (decided in design.md); no token changes (all colours already exist).
- `apps/mobile/src/app/(tabs)/profile.tsx`: the screen title and padding move into the new layout; the form, trips, listings and sign out stay below.
- No database, API or dependency changes. Builds on PR #26 (`profile-view-and-edit-modes`, `shorter-profile-setup`); this branch is cut from it.
