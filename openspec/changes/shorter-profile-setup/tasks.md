# Tasks

## 1. Setup field set

- [x] 1.1 Write `ProfileForm` tests for `fields="setup"` first (shows name, skill picker and city; hides bio, home destination and the Find players switch; `full` unchanged), watch them fail, add the prop; verify the new tests pass and `profile-discoverability.test.tsx` is unchanged and green
- [x] 1.2 Write tests that fields hidden by `setup` are saved from `initial` (bio, home destination, discoverability and its timestamp preserved), watch them fail, make `submit` use stored values for hidden fields; verify the tests pass

## 2. Setup screen

- [x] 2.1 Write `ProfileSetupScreen` tests first (waits for the profile; passes the existing profile as initial so a partial profile is not blanked; shows only the three fields; no Cancel), watch them fail, load the profile in the screen; verify they pass
- [x] 2.2 Update `profile-setup.test.tsx`: move the bio-length test to the full form and fix assertions that assumed all fields; update the `profileSetup.intro` copy in `locales/en.json` to name and city and level only; verify the suite passes
- [x] 2.3 Update the setup step in `guest-first.test.tsx` if it relies on removed fields; verify `pnpm --filter mobile jest src/__tests__/app/guest-first.test.tsx` passes

## 3. Suggested name

- [x] 3.1 Write tests first: `suggestedName` prefills the display name, is editable, saves only on Save, is ignored when `initial` already has a name, and nothing is derived from the email address when no suggestion is given; watch them fail, add `suggestedName` to `ProfileForm` and `ProfileSetupScreen`; verify they pass

## 4. Bio nudge

- [x] 4.1 Write `ProfileView` tests first ("Add a bio" shown only when the bio is empty and calls `onEdit`; hidden when a bio exists), watch them fail, implement it with a string in `locales/en.json`; verify the tests pass and the profile tab test for an empty bio still passes

## 5. Integration

- [x] 5.1 Run `pnpm turbo run check-types lint test` and verify all tasks pass
- [ ] 5.2 Run the app as a new account: sign up → setup shows three fields → save → profile → "Add a bio" opens Edit; and as a member with a partial profile, verify bio and home destination are unchanged after setup

## Workflow follow-up

- Archive after review and after `profile-view-and-edit-modes` is archived, then plan the Apple and Google sign-in change that supplies `suggestedName`.
