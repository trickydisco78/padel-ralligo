# Proposal

## Why

The Profile tab opens straight onto an edit form: a member never sees their profile as other players would, and "saved" is a message under a button rather than a state. The design canvas (Guest · Profile, Member · Profile) shows a profile you land on, with an **Edit profile** button. The screen's behaviour also sits in nine `useState` calls whose flags can contradict each other (`saving`, `saved`, `errors.form`).

## What Changes

- A signed-in member lands on **their own profile in view mode**: the player card (name, skill tier, home place), bio, an **Edit profile** button, then Trips and My listings.
- **Edit profile** opens the existing form with a **Cancel** button. Saving or cancelling returns to view mode; a failed save stays in the form with the error.
- A guest still sees the sign-in prompt; a signed-in member whose profile is loading sees nothing flash.
- Screen logic moves into a pure `profileViewFor` and a small reducer behind a `useProfileScreen` hook, so the component renders state and sends events (the pattern `useManageMatch` established).
- Defaults from the design review: the skill tier is shown (no numeric level, trend or wins), no stats row, no photo badge, no Message or Invite.
- The profile-setup flow is unchanged.
- Out of scope, a later change: a **public profile** for other signed-in members (first name and last initial, skill tier, coarse place, bio, "Match organiser"; no trip dates). It needs a database function, a `PublicProfile` type with no date fields, and row-level security. It will also revisit the existing "Public profile fields" requirement, which lists home city.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `player-profiles`: adds the member's own profile view and the view/edit flow between it and the profile form.

## Impact

- `packages/profiles`: new `ProfileView` component, `useProfileScreen` hook, `profileViewFor` and mode reducer in the domain layer; `ProfileForm` gains an optional `onCancel`.
- `apps/mobile/src/app/(tabs)/profile.tsx`: renders view or edit by state.
- Tests: `profile-tab.test.tsx` currently asserts the form on landing and changes; the gated-tabs test for Profile is checked.
- No database, API or dependency changes.
