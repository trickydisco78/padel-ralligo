# Tasks

## 1. Backend foundation

- [x] 1.1 (Manual, by the user) Create a personal hosted Supabase dev project and verify its project URL and anon key are available; do not paste keys into chat or commit them
- [x] 1.2 Add the Supabase CLI as a root dev dependency (allow its install script in `pnpm-workspace.yaml` if pnpm requires it), run `supabase init` to create `supabase/`, and verify `pnpm exec supabase --version` runs
- [x] 1.3 Write migration for `destinations` (with the four launch rows), `profiles` and `profile_sports`, with check constraints and RLS (read for signed-in, write own row only, destinations read-only); verify `supabase db push` to the dev project succeeds
- [x] 1.4 Write migration for `listings` with date-order and players_needed (1 to 3) constraints, and RLS (signed-in read of open listings, insert only as self with confirmed email and an existing profile, update own rows only); verify `supabase db push` succeeds
- [ ] 1.5 Add a read view or function for Discover (listing joined with destination and poster public fields, plus open-listing counts per destination); verify it exposes no email or consent timestamps
- [ ] 1.6 Write `supabase/tests/rls.sql` covering anon, owner and other-user cases for every table, and run it against the dev project; verify every case returns the expected allow or deny
- [ ] 1.7 Document setup in `supabase/README.md` (link project, push migrations, run the RLS checks, env variables) and verify a fresh reader can follow it with the commands as written

## 2. Core domain rules

- [x] 2.1 Replace `Player`, `players` and `filterPlayers` in `packages/core` with `SkillTier`, `LevelWanted`, `Destination`, `Listing` and `Trip` types; verify `pnpm --filter @repo/core check-types` passes
- [x] 2.2 Implement `validateListing` (destination required, dates not in the past and in order, players needed 1 to 3, description at most 500) with unit tests for each rule and each boundary
- [x] 2.3 Implement `validateTrip` and `validateProfile` (display name 2 to 40, bio at most 300, skill tier required) with unit tests
- [x] 2.4 Implement `datesOverlap` and `matchesFilters` (destination, date overlap, level with Any matching all, end date optional) with unit tests covering open-ended and range listings
- [x] 2.5 Run `pnpm --filter @repo/core test`, `lint` and `check-types` and verify all pass

## 3. Visual theme

- [x] 3.1 Replace the template colour, radius and spacing tokens in `apps/mobile/src/constants/theme.ts` with the values in `docs/design-reference.md` (green accent, white surfaces, 20 px card radius, pill chips), light theme only, and verify `pnpm --filter mobile check-types` and a render test that reads the tokens pass
- [x] 3.2 Build shared `Card`, `Chip` (selected and unselected) and `PrimaryButton` components in the new style; verify render tests for each state
- [x] 3.3 Tint the tab bar and active states with the green accent and set the app to light appearance in `app.json`; verify by running the app that the tab bar uses the accent colour

## 4. App connection and accounts

- [x] 4.1 Add `@supabase/supabase-js` and secure session storage to `apps/mobile` (using `expo install` for Expo modules), add `.env.example` and gitignore `.env.local`; verify `pnpm --filter mobile check-types` passes
- [x] 4.2 Create the Supabase client module reading the two `EXPO_PUBLIC_` variables, with a clear startup error if they are missing; verify with a test that missing config raises the error
- [x] 4.3 Create the session provider (user, loading, sign out) and the route guard that sends signed-out users to `(auth)` and signed-in users with an incomplete profile to profile setup; verify with render tests using a mocked client for signed-out, incomplete-profile and ready states
- [x] 4.4 Build the sign-up screen (email, password at least 8 characters, terms and 18+ checkboxes, field errors, "check your email" confirmation); verify render tests for each validation scenario in the `user-accounts` spec
- [x] 4.5 Build the sign-in screen with a generic invalid-credentials error and the sign-out action on Profile; verify render tests for valid, invalid and sign-out flows
- [ ] 4.6 Verify against the dev project that sign up stores the terms and age timestamps, an unverified account cannot insert a listing, and a verified one can (run through the RLS test script and the app)

## 5. Profile

- [x] 5.1 Build the profile setup and edit screen (display name, home city, bio, padel skill tier) using `validateProfile`; verify render tests for required fields, length limits and tier change
- [ ] 5.2 Persist profile and skill tier to `profiles` and `profile_sports`, and verify a user cannot read others' emails or edit another profile (RLS test script)
- [x] 5.3 Add the saved current trip (destination picker, start and end dates) to the profile screen using `validateTrip`; verify render tests for saving, invalid dates and an expired trip being ignored

## 6. Listings

- [x] 6.1 Build the destination data hook and picker; verify a render test shows destinations alphabetically with open-listing counts
- [x] 6.2 Build the Create tab form (destination, dates, optional time and venue, level wanted, players needed, description) using `validateListing`, with a block for unverified email and incomplete profile; verify render tests for a fixed match, a loose invite and each validation error
- [x] 6.3 Build the Discover screen (listing cards with destination, dates, level, players needed, description, poster name and skill tier; filters for destination, dates and level; empty state with clear filters; initial filters from the saved trip); verify render tests for default order, each filter, the trip pre-filter and the empty state
- [x] 6.4 Build "my listings" with edit and close, shown from Profile; verify render tests that closing removes a listing from Discover results and editing updates it
- [ ] 6.5 Verify against the dev project that a listing posted from one test account appears for another and closed or past listings do not

## 7. Navigation and clean-up

- [x] 7.1 Rework tabs to Discover, Create, Matches (placeholder) and Profile, remove the old Find players screen and its components and tests, and verify `pnpm --filter mobile test` and `check-types` pass
- [ ] 7.2 Update `README.md` and `docs/` to describe the new layout, environment variables and the Supabase setup, and verify each documented command runs as written
- [x] 7.3 From a clean `pnpm install`, run root `check-types`, `lint` and `test` and verify all exit 0
- [ ] 7.4 Run the app in the iOS simulator against the dev project and verify the full flow: sign up, verify email, complete profile, post a listing, find it from a second account with filters

## Workflow follow-up

- Archive `scaffold-padel-player-finder-app` before archiving this change, so the `app-shell` and `player-discovery` deltas can apply.
- Archive this change after review.
