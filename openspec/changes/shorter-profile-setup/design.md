# Design

## Context

See `proposal.md`. `ProfileSetupScreen` renders `ProfileForm` with no initial values and the label "Save and continue"; the form shows all six fields. `root-stack` holds a signed-in member without a complete profile at `profile-setup`, so a profile row may already exist (for example without a skill tier), and today setup would overwrite it with blanks. `SaveProfileInput` needs every field; the repository derives `discoverable_at` from the `discoverable` switch. This change builds on `profile-view-and-edit-modes` (`ProfileView`, `ProfileForm.onCancel`).

## Goals / Non-Goals

**Goals:** a three-field setup; no data loss for fields setup hides; a safe seam for a provider-supplied name.
**Non-Goals:** Apple and Google sign-in, any rule for deriving names, a multi-step wizard, database changes, changing validation.

## Decisions

1. **`ProfileForm` gets `fields?: 'setup' | 'full'` (default `'full'`).** `setup` renders display name, skill picker and home city; `full` is today's form. Hidden fields keep their state from `initial` and are included in the save, so one `submit` path serves both. *Alternative:* a second `SetupForm` component. Rejected: it duplicates validation and the save call, and the two would drift.
2. **Setup loads the existing profile.** `ProfileSetupScreen` waits for `useProfile` (as the Profile tab does) and passes it as `initial`, so hidden bio, home destination and discoverability are preserved. With no profile the defaults apply: empty, and Find players off. This also fixes the existing overwrite of a partial profile.
3. **Suggested name as a prop, not a lookup.** `ProfileSetupScreen` and `ProfileForm` take an optional `suggestedName`. It is used only when `initial` has no display name, is an ordinary editable value, and nothing is saved until the member presses Save. The future Apple and Google change will supply it from the provider; this change adds no source for it. Nothing parses the email address, because a display name is shown to other members and a guessed one could publish a name the member never chose.
4. **Bio nudge lives in `ProfileView`.** When the bio is empty, show an "Add a bio" button wired to the same `onEdit`. It is plain text and one button; no new state.
5. **Consent stays explicit.** Find players is still opt-in and off by default; setup simply no longer shows it. The existing explanation text remains in Edit profile, so the rule "a plain explanation of what others will see" still holds where the setting is shown.
6. **Tests first.** Setup tests assert the three fields appear and bio, home destination and the switch do not; hidden values survive a save; a suggested name prefills but saves nothing until Save; no name is derived from the email. The test that checks bio length in setup moves to the full form.

## Risks / Trade-offs

- [Members who would have set a bio or destination at setup now have to find Edit profile] → the bio nudge covers the likely case; home destination is already prompted when turning on Find players.
- [Setup now waits for the profile query, which could briefly show a spinner] → same pattern as the Profile tab; show nothing until loaded rather than flashing an empty form.
- [`fields` default `'full'` means a forgotten prop shows too much, not too little] → the safe direction; only `ProfileSetupScreen` passes `'setup'`.
- [The `profile-view-and-edit-modes` change is not yet archived, so `ProfileView` and `onCancel` come from it] → apply this change after that one is archived or at least merged.
