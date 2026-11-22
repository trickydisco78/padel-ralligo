# Design

## Context

See `proposal.md`. Today `apps/mobile/src/app/(tabs)/profile.tsx` renders `SignInPrompt` for a guest and otherwise `ProfileForm` (keyed by user id) once `useProfile` has loaded, then `TripsSection`, `MyListings` and Sign out. `ProfileForm` owns nine `useState` calls and an `onSaved` callback; `ProfileSetupScreen` reuses it for first sign in and must keep working unchanged. `ProfileHeader` (the pink player card) exists in `@padel/profiles` and is tested but unused. `useManageMatch` established the pattern: a pure view function plus a reducer in the domain layer, a hook in the presentation layer, a screen that renders and sends events.

## Goals / Non-Goals

**Goals:** land in view mode; edit only via Edit profile; the screen decides nothing itself.
**Non-Goals:** the public profile, stats, photo, Settings, restyling the guest screen, a form library, changing `ProfileForm`'s fields or validation.

## Decisions

1. **`profileViewFor({ session, profileLoading })` returns `'guest' | 'loading' | 'ready'`.** Pure, in `packages/profiles/src/domain/`. Same shape as `manageViewFor`; session is a local literal union so `profiles` does not import `auth`'s types. *Alternative:* inline conditions in the screen. Rejected: that is what made Manage match hard to test.
2. **A two-state reducer for mode:** `{ mode: 'viewing' | 'editing' }` with events `EDIT_STARTED`, `EDIT_CANCELLED`, `EDIT_SAVED`. It is small on purpose; it gives the screen events to send and keeps the transition table in one tested place. *Alternative:* `useState<boolean>`. Rejected for consistency and because later modes (a settings sheet) would add to the same reducer.
3. **`useProfileScreen(userId, session)`** in `presentation/hooks/` wraps `useProfile`, `profileViewFor` and the reducer and returns `{ view, profile, mode, events }`. The screen keeps navigation, translation and layout.
4. **Mode resets on leaving the tab for free.** Tab screens that unmount drop the reducer state; the spec scenario "Leaving the tab" relies on this. If the tabs keep screens mounted, add a reset on blur (check during implementation, see Risks).
5. **`ProfileView` is a presentation component taking a `Profile`**, composed from `ProfileHeader` (name, tier as a tag, home place as location), the bio as text and an Edit profile button. Stats stay empty, which `ProfileHeader` already supports. It does not take a viewer, so the later public profile can reuse the header while using a different data type.
6. **`ProfileForm` gets an optional `onCancel`** that renders a Cancel button when set. `onSaved` already exists and now switches the screen to viewing. Its internals (nine `useState`s) are left alone; collapsing them into a status union is a separate change. The existing "Profile saved" message is not shown on the Profile tab after save because the view replaces the form; it stays for any caller that does not switch away.
7. **Tests first.** Reducer and `profileViewFor` unit tests, then `profile-tab.test.tsx` rewritten around: lands in view; Edit opens the form with values; Cancel returns without saving; save returns to the new values; failed save stays in the form.

## Risks / Trade-offs

- [Tabs stay mounted, so mode survives leaving the tab] → verify in `app-tabs` behaviour; if so, reset mode on blur (`useFocusEffect`) and cover it with a test.
- [`ProfileHeader` was never used on a real screen: copy or layout surprises] → check its `profile-header` tests and view it on the profile screen; adjust props, not styles, in this change.
- [Existing tests assert landing on the form] → they change deliberately; the diff in `profile-tab.test.tsx` is the visible behaviour change.
- [The existing "Public profile fields" requirement lists home city for other users, which the planned public profile narrows] → left untouched here and called out in the proposal for the follow-up change.
