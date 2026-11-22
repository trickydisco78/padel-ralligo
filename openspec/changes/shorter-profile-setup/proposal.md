# Proposal

## Why

First sign-in drops a new member onto the full profile form: name, city, bio, skill level, home destination and the Find players setting. Only name and skill level are required, and the member usually arrived to do something else (request a place in a match), so the long form is friction. Apple and Google sign-in are planned to reduce that friction further; setup should be ready to take a name from them without ever guessing one.

## What Changes

- **Setup asks for three things:** display name, skill level and home city (city stays optional, as today). Bio, home destination and "Show me in Find players" are no longer asked at setup; they remain in Edit profile.
- **Consent rule is unchanged:** Find players stays off until the member turns it on in Edit profile, so leaving it out of setup does not weaken it.
- **`ProfileForm` takes a field set** (`setup` or `full`, default `full`) so Edit profile and the discoverability behaviour are untouched.
- **Setup keeps what is already stored.** It reads the member's existing profile first, so fields it does not show are saved as they were, not blanked.
- **Suggested name:** setup accepts an optional suggested display name. It prefills the field as an editable value, is only saved when the member saves, and is shown to them first. Nothing is derived from the email address.
- **Bio nudge:** when the bio is empty, the profile view offers "Add a bio" that opens Edit profile.
- Setup copy no longer says other players see the bio.
- **Out of scope:** Apple and Google sign-in itself (a later change, which will supply the suggested name), the public profile, any database change.
- **Depends on** `profile-view-and-edit-modes` (the profile view and the form's `onCancel`); this change should be applied after it.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `player-profiles`: "Profile creation" changes which fields setup asks for and allows a suggested name.

## Impact

- `packages/profiles`: `ProfileForm` (field set, optional suggested name), `ProfileSetupScreen` (loads the existing profile), `ProfileView` (bio nudge), English strings.
- Tests: `profile-setup.test.tsx` (one test uses the Bio field and moves to the full form), `guest-first.test.tsx` setup step, profile-view tests. `profile-discoverability.test.tsx` renders the full form and should not change.
- No database, API or dependency changes.
