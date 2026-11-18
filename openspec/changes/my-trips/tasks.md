# Tasks

Dependencies: the player-directory archive (`chore/archive-player-directory`) is merged first. 1 first. 2 before the app can use real data. 3 and 6 can run in parallel after 1; 4 needs 3; 5 needs 2 and 6; 7 needs 3 to 6; 8 after 2; 9 last. Nothing runs against the hosted dev project (migration, seed, RLS run) without the project owner's go-ahead.

## 1. Baseline

- [ ] 1.1 Run `pnpm check-types`, `pnpm lint`, `pnpm test` on a clean tree and record the baseline; verify all pass before any change
- [ ] 1.2 Re-confirm the findings in design Context against `profiles` trip code, `discover.tsx` and the `turbo.json` tags and note any difference at the end of the design; verify by re-reading each cited file

## 2. Database (`supabase/migrations`)

- [ ] 2.1 Write one additive migration: `trips` with checks, indexes, the 10-trip limit trigger, owner-only RLS and no `anon` grants; copy `profile_trips` rows in as hidden trips; leave `profile_trips` untouched; verify by reading it against design decisions 1 and 2
- [ ] 2.2 In the same migration add `my_trips_overview` and `find_overlapping_players` with the shared overlap predicate, inclusive days, one best row per other player, the owner check on the trip id, the clamped `p_today`, week, level and name filters, the 50 and 100 caps, `search_path = ''` and grants to `authenticated` only; verify by reading it against design decisions 3 to 5
- [ ] 2.3 Extend `supabase/tests/rls.mjs`: owner-only access to trips (another member and anon cannot read, insert or change), the 10-trip limit, `end < start` rejected, hidden trips and unlisted players never appear in overview counts or lists, other destinations and non-overlapping dates excluded, overlap days for the design's example (14 to 21 June against 14 to 21, 17 to 23, 15 to 20 and 16 to 19 gives 8, 5, 6 and 4), a supplied trip id that belongs to someone else returns nothing, overview counts equal list totals, This week, My level at both ends and the middle, name search, the caps (with temporary users), `anon` cannot execute either function, and the exact-function-grants check now lists `search_players` only for `anon`; verify the new checks fail when a rule is deliberately broken in a scratch copy
- [ ] 2.4 Update `supabase/README.md` (trip privacy boundary, the two functions, `profile_trips` deprecated) and `packages/supabase/src/database.types.ts`; verify `pnpm check-types` passes
- [ ] 2.5 With the owner's go-ahead, apply the migration with `pnpm exec supabase db push --linked`, regenerate the types, and run `pnpm test:rls`; verify every check passes

## 3. Trips package (`@padel/trips`)

- [ ] 3.1 Scaffold the package (`domain-feature` tag, `exports` `"."` only, jest with `tests/setup-i18n.ts`, locale namespace `trips`, registered in the app resources, `package-exports.test.mjs` and the boundary rules); verify `pnpm lint` and `turbo boundaries` pass and it imports no other feature package
- [ ] 3.2 Move and extend the domain: `Trip` with id and visibility, `validateTrip` returning translation keys, the 10-trip limit, `tripLengthDays` (inclusive), `isPast`, and range formatting ("Jun 14–21", "Jun 28 – Jul 3"); verify unit tests including leap years, month and year boundaries, one-day trips and the limit
- [ ] 3.3 Add the Supabase repository (list own trips with destination names, create, update, delete, overview) and mapper; verify tests on the fake client for each call, errors, and that nothing is sent for another member
- [ ] 3.4 Add hooks `useTrips`, `useSaveTrip`, `useDeleteTrip`, `useTripsOverview` with session-aware keys and invalidation of the overview after any change; verify hook tests including sign-out clearing
- [ ] 3.5 Add `TripsSection` (list soonest first, ended trips marked, add, edit, delete, share switch with its explanation, empty state, limit message), `TripCard` and `SavedTripsRow` (selectable, selected state announced, horizontal); copy in `locales/en.json`; verify component tests for each state and the accessible names
- [ ] 3.6 Export the public API and locale; verify `package-exports.test.mjs` passes

## 4. Profiles and Profile screen

- [ ] 4.1 Remove the single-trip code from `@padel/profiles` (`Trip`, `validateTrip`, `useTrip`, `useSaveTrip`, `useClearTrip`, `TripSection`, repository, mapper, tests, locale keys) and switch the Profile screen to `TripsSection`; verify `pnpm check-types`, lint and tests pass and no reference to the removed code remains (`grep`)

## 5. Overlapping players (`@padel/players`)

- [ ] 5.1 Add the overlap repository call and `useOverlappingPlayers(tripId, filters)` with session-aware keys, offsets 0 and 50 only and a disabled state without a trip; verify tests for arguments sent, paging, and that no request is made for a Guest
- [ ] 5.2 Extend `PlayerCard` with the optional overlap line ("Jun 17–23 · 5 days overlap", "All 8 days overlap", "1 day overlap") and the sport; verify component tests for each wording and that no extra private field appears
- [ ] 5.3 Change the guest button label to "Sign in" and keep "Connect" for members; verify tests for both

## 6. UI primitives (`@padel/ui`)

- [ ] 6.1 Add an optional icon to `SegmentedControl` options and a `NoticeBanner` (icon, text, accessible as plain text); verify component tests and that `ui` imports no domain
- [ ] 6.2 Export from the entry point; verify `package-exports.test.mjs` passes

## 7. Discover composition (`apps/mobile`)

- [ ] 7.1 Add the My trips | Explore places mode for members only, with the default rules, the saved-trips row and selection, and remove the old trip pre-fill effect; verify route tests for member with trips, member without, guest (no switch and no trip request), selecting a trip, and sign-out resetting the mode
- [ ] 7.2 Add the My trips lists: overlapping players with This week, My level and name search, Open matches for the trip (existing filter), counts on the switch, the notice and the "Players in {destination}" heading; verify route tests including each chip, combined filters, empty, error with the row still visible, and Open matches limited to the trip's destination and dates
- [ ] 7.3 Apply the Explore places wording (guest label, heading, text, notice, "Explore near", "Public players in {destination}", "Search a city", member heading); verify route tests for guest and member and that all text comes from the locale JSON
- [ ] 7.4 Empty My trips: message and "Add a trip" that opens the Profile trips section; verify a route test

## 8. Seed data and docs

- [ ] 8.1 Extend `supabase/seed/players.mjs` with shared trips for the four players using dates relative to today (Jordi 8 days; Hannah, Lucía and Diego overlapping partly; Lucía with a Lisbon home and a Málaga trip) and document an SQL snippet for the test account's trips in `supabase/README.md`; with the owner's go-ahead run the seed twice and `--remove`; verify the overview and list match the design's example
- [ ] 8.2 Update `docs/architecture.md` (the trips package, the two functions and why they are functions, sharing model, Discover modes); verify it matches the code

## 9. Validation

- [ ] 9.1 Run `pnpm check-types`, `pnpm lint`, `pnpm test`, `pnpm test:rls`; verify against the baseline from 1.1
- [ ] 9.2 Manually verify on iOS and Android against the dev project: add, edit, share and delete trips on the profile; My trips row with counts; overlapping players with the seeded data; This week, My level and search; Open matches for a trip; Explore places as guest and member; Sign in sheet for guests; screen reader reads trip cards, players and the selected state

## Workflow follow-up

- Next changes: `player-filters-and-preferences` (Women, Nearby, preference tags, Best fit), then `player-connections`.
- A cleanup migration to drop `profile_trips`, once the owner approves.
