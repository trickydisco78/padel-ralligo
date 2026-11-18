# Tasks

Dependencies: 1 first. 2 before 3, 4 and 7 can use real data. 3, 4, 5 and 6 can run in parallel after 1. 7 needs 3 to 6. 8 can start after 2. 9 last. Nothing runs against the hosted dev project (migration, seed, RLS run) without the project owner's go-ahead.

## 1. Baseline

- [x] 1.1 Run `pnpm check-types`, `pnpm lint`, `pnpm test` on a clean tree and record the baseline; verify all pass before any change
- [x] 1.2 Re-confirm the findings in design Context against `supabase/migrations`, `discover.tsx` and `turbo.json` tags, and note any difference at the end of the design; verify by re-reading each cited file

## 2. Database (`supabase/migrations`)

- [x] 2.1 Write one additive migration: `profiles.discoverable_at`, `profiles.home_destination_id` (FK), the `check` that listing needs a home destination, Málaga and Lisbon rows, and `public.search_players` with the caps, name formatting, self-exclusion, `player_id` only for signed-in callers, `search_path = ''` and explicit grants; verify by reading the migration against design decisions 1 to 6 and by applying it to a local or scratch database if available
- [x] 2.2 Extend `supabase/tests/rls.mjs`: anonymous call returns rows with exactly the permitted columns and a null `player_id`; opted-out and not-opted-in players are never returned; a player without a home destination or sport is not returned; anonymous cannot read `profiles` or `profile_sports`; signed-in caller gets `player_id` and not their own row; text search matches destination or country and never names; `p_limit` above 50 and offsets of 100 or more return no more than the caps (using temporary opted-in users created and removed by the test); the exact-grants check now lists the two views plus this one function; a user cannot set `discoverable_at` for another profile; verify the new checks fail against a build without the caps
- [x] 2.3 Record the decided boundary in `supabase/README.md` (what the directory exposes, opt-in default, caps, that profile rows remain readable by signed-in users) and regenerate `database.types.ts`; verify `pnpm check-types` passes with the new types
- [x] 2.4 With the owner's go-ahead, apply the migration to the dev project and run `pnpm test:rls`; verify every check passes

## 3. Profiles (`@padel/profiles`)

- [x] 3.1 Add `homeDestinationId` and `discoverable` to the profile model, mapper and repository (write `discoverable_at` as now when turned on from off, keep it when already on, null when off); verify repository and mapper tests on the fake client
- [x] 3.2 Add the "Show me in Find players" switch with its explanation and a home destination picker to the profile form, with the "choose a home destination first" validation; copy in `locales/en.json`; verify form tests for the default off state, turning on without a destination, saving and reloading
- [x] 3.3 Extend the mock Supabase helper only as needed; verify no domain import is added to `@padel/ui` and `turbo boundaries` passes

## 4. Players package (`@padel/players`)

- [x] 4.1 Scaffold the package (`domain-feature` tag, `exports` `"."` only, jest and lint presets, locale namespace `players`, added to `package-exports.test.mjs` and the app's resources); verify `pnpm lint` and `turbo boundaries` pass and it imports no other domain-feature package
- [x] 4.2 Add the repository interface, the Supabase RPC implementation and a mapper that validates tier values and tolerates a missing `player_id`; verify tests on the fake client for rows, empty, error and the filters sent
- [x] 4.3 Add `usePlayers(filters)` with session-aware query keys and offsets limited to 0 and 50; verify hook tests for paging, guest and signed-in keys, and refetch after sign-out
- [x] 4.4 Add `PlayerCard` (name, home destination, tier, initials tile, Connect with disabled state and hint) and `PlayersStatus` (loading, empty with clear-filters, error with retry; no list, because Discover already owns the scrolling list); verify component tests including the accessible name, role and disabled state
- [x] 4.5 Export the public API and locale; verify `package-exports.test.mjs` passes

## 5. UI primitives (`@padel/ui`)

- [x] 5.1 Add `SegmentedControl` (two options, optional count, selected state, 48dp targets) and `InitialsTile` (initials from a name, deterministic colour from a five-colour palette added to the tokens); verify component tests for selection, counts, accessibility state, single-word names and determinism
- [x] 5.2 Export from the entry point; verify `package-exports.test.mjs` and that `ui` imports no domain

## 6. Authentication intent (`@padel/auth`)

- [x] 6.1 Add the `connectPlayer` intent (no payload), its validation and its copy ("Connect with players", "Create a free account or sign in to connect with other players"); verify unit tests for parsing, invalid shapes and extra properties dropped
- [x] 6.2 Map it in the app's intent routes to `/discover?view=players` using `navigate`; verify `intent-routes.test.ts` and the resolver tests for resume once and no double resume

## 7. Discover composition (`apps/mobile`)

- [x] 7.1 Add the Players | Open matches switch with counts to Discover, held as `view` state that a route parameter can set, sharing the destination chips, level chips and search field; keep the existing match list and its tests unchanged; verify `discover-guest.test.tsx` still passes and new tests cover the switch, counts, shared filters and that filters survive switching views
- [x] 7.2 Wire the Players list: guest Connect opens the sheet, signed-in Connect is disabled with its hint, no mutation exists; verify route tests for guest sheet, dismiss stays in place, return after sign-in lands on Players, signed-in disabled
- [x] 7.3 Update the Discover title block and empty state copy for Players ("Players in your destination", pointer to Profile for signed-in members); verify copy comes from locale JSON and no hardcoded text remains

## 8. Seed data and docs

- [ ] 8.1 Add `supabase/seed/players.mjs` (direct database connection like the RLS runner, dry run unless `--apply`, `@seed.invalid` emails, opted in, idempotent, `--remove`) for Jordi M., Hannah K., Lucía C. and Diego R.; verify with the owner's go-ahead by running it twice and then `--remove`, and that the directory shows and then drops them
- [x] 8.2 Update `docs/architecture.md` (the players package, the function-based public read and why it is not a view, the new intent) and the supabase README seed instructions; verify the docs match the code

## 9. Validation

- [x] 9.1 Run `pnpm check-types`, `pnpm lint`, `pnpm test`, `pnpm test:rls`; verify against the baseline from 1.1
- [ ] 9.2 Manually verify on iOS and Android against the dev project with seeded players: guest sees the list with no account and no ids, switch and counts, destination and level filters, Connect sheet then sign in returns to Players, signed-in Connect disabled, turning the setting on and off in Profile adds and removes the player, screen reader announces cards and the sheet

## Workflow follow-up

- Next changes: `trip-overlap-discovery` (trips table, overlap, filters, ranking, availability tags), then `player-connections`.
- Archive after this change merges: `password-reset-and-email-links` is independent.
