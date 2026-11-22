# Tasks

## 1. View and mode logic (domain)

- [x] 1.1 Write `profileViewFor` tests (guest, loading, ready; signed-in with profile loading is `loading`), watch them fail, implement it in `packages/profiles/src/domain/`; verify with `pnpm --filter @padel/profiles jest`
- [x] 1.2 Write reducer tests (starts `viewing`; `EDIT_STARTED` → `editing`; `EDIT_CANCELLED` and `EDIT_SAVED` → `viewing`; events in the wrong mode are no-ops), watch them fail, implement `profileScreenReducer`; verify the same suite passes
- [x] 1.3 Add `useProfileScreen(userId, session)` returning `{ view, profile, mode, events }`; verify via the screen tests in group 3 and `check-types`

## 2. Components

- [x] 2.1 Add `ProfileView` (header with tier tag and home place, bio, Edit profile button, optional parts omitted when empty) with a component test for full and empty profiles; verify the test passes
- [x] 2.2 Add optional `onCancel` to `ProfileForm` rendering a Cancel button, with a test that Cancel calls it without saving and that the profile-setup form shows no Cancel; verify `profile-setup` and `profile-discoverability` tests still pass
- [x] 2.3 Export the new pieces from `packages/profiles/src/index.ts` and add the English strings (Edit profile, Cancel) to `locales/en.json`; verify `check-types` and lint pass

## 3. Profile tab

- [x] 3.1 Rewrite `profile-tab.test.tsx` first (lands in view; Edit opens the form with saved values; Cancel returns without a save; save returns to the new values; a failed save stays in the form; a guest sees the sign-in prompt), watch the new expectations fail; verify they fail for the right reason
- [x] 3.2 Switch `apps/mobile/src/app/(tabs)/profile.tsx` to `useProfileScreen`: view, form or sign-in prompt by state, Trips, My listings and Sign out unchanged; verify `profile-tab`, `gated-tabs` and `guest-first` tests pass
- [ ] 3.3 Confirm whether the tab keeps its screen mounted when leaving it, and add a reset to viewing on blur with a test if it does; verify by test or by recorded observation in the PR

## 4. Integration

- [x] 4.1 Run `pnpm turbo run check-types lint test` for the workspace and verify all tasks pass
- [ ] 4.2 Run the app and walk guest → sign in → profile view → edit → cancel → edit → save, and verify each step matches the Member · Profile artboard apart from the documented omissions (no numeric level, stats, photo badge)

## Workflow follow-up

- Archive the change after review, then open the follow-up change for the signed-in-only public profile (database function, `PublicProfile` type, row-level security, revisiting "Public profile fields").
