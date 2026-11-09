# Design

## Context

See proposal.md for motivation and the product docs in `docs/`. Current state: an Expo SDK 58 app (`apps/mobile`, Expo Router with native tabs under `src/app`), a `packages/core` TypeScript package consumed as source (`Player`, mock `players`, `filterPlayers`), pnpm + Turborepo, jest and jest-expo for tests. There is no backend. Docker and the Supabase CLI are not installed on the development machine, so local Supabase is not available and the plan uses a hosted development project.

Decisions already made in discussion: listing is the core object (a fixed match and a loose invite are one record); self-rated skill tiers keyed by sport; padel only; no trip record, only a saved current trip; a curated destination list; Supabase as backend; personal project.

## Goals / Non-Goals

**Goals:**
- A signed-in user can post a listing and another signed-in user can find it by destination, dates and level.
- Rules that protect people (adults only, verified email to post, own-data-only writes, no email exposure) are enforced by the database, not only by the UI.
- Domain rules (validation, date overlap, filtering) live in `packages/core` as pure, tested functions the future web app can reuse.

**Non-Goals:**
- Requests, chat, report/block, notifications, photos, ratings, social login, password reset, geo-search, admin UI. These come in later changes; the schema leaves room for them but does not create their tables.
- Offline support, pagination beyond a simple page size, realtime updates of the listing feed.

## Decisions

- **Supabase (Postgres + Auth + RLS), migrations in `supabase/migrations/`, applied to a hosted dev project.** The data is relational and the key safety rules are row-level security policies. Alternatives: Firebase (document model is awkward for listings plus requests), own API (builds auth and realtime ourselves). Without Docker, `supabase db push` against the hosted project is the path; `supabase start` is not used.
- **Tables: `profiles`, `profile_sports`, `profile_trips`, `user_consents`, `destinations`, `listings`.**
  - `profiles` (id = auth user id, display_name, home_city, bio, created_at): only public columns, so other users can read it freely and email never lives here.
  - `profile_sports` (profile_id, sport default `padel`, skill_tier) with primary key (profile_id, sport), so ratings and sports can grow without reshaping profiles.
  - `profile_trips` (profile_id, destination_id, start_date, end_date): the saved current trip, readable only by its owner. Kept out of `profiles` so other users can never see where someone is going.
  - `user_consents` (user_id, terms_accepted_at, age_confirmed_at): stamped with server time by a trigger on sign up. The trigger rejects sign up unless both confirmations are present, so the age and terms gate holds even if the client is bypassed. Kept out of `profiles` because the profile row is only created after sign up, once the user has a display name.
  - `destinations` (id, name, country, tagline), seeded in a migration.
  - `listings` (id, poster_id, destination_id, sport default `padel`, start_date, end_date nullable, start_time nullable, venue nullable, level_wanted, players_needed 1..3, description, status `open` or `closed`, created_at).
- **Access rules in RLS.**
  - Profiles: any signed-in user can read the public columns; only the owner can insert or update their row. Email stays in `auth.users` and is never copied into `profiles`.
  - Destinations: read-only for signed-in users, no write policies.
  - Listings: read open listings when signed in; insert only if the caller owns `poster_id`, their email is confirmed and their profile exists; update only own rows.
  - Anonymous requests get nothing.
  - A database check or trigger enforces date order and players_needed range, so bad data is rejected even if the client is bypassed.
- **Discover reads through a view or RPC that joins listing, destination and the poster's public fields and counts open listings per destination.** Alternative: multiple client queries — more round trips and easier to leak columns. Filtering uses date overlap (`start_date <= filter_end and coalesce(end_date, start_date) >= filter_start`) and `level_wanted in (filter, 'any')`.
- **Domain logic in `packages/core`.** Types (`Listing`, `SkillTier`, `LevelWanted`, `Destination`), `validateListing`, `validateTrip`, `datesOverlap`, `matchesFilters`. The same rules exist in the database; core is for fast client feedback and tests. `Player`, `players` and `filterPlayers` are deleted.
- **Auth in `apps/mobile`: `@supabase/supabase-js` with session stored via `expo-secure-store`.** A small session provider exposes the user and a loading state; Expo Router `Stack.Protected` guards (or equivalent redirect in the root layout) route signed-out users to `(auth)` and signed-in users with an incomplete profile to profile setup. Confirm exact guard API against the SDK 58 docs before coding (the template's `AGENTS.md` says to).
- **Config via `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` in an untracked `apps/mobile/.env.local`, with a committed `.env.example`.** The anon key is designed to be public but RLS is what protects data, so the service-role key is never put in the app or the repo.
- **Age gate and terms at sign up: required checkboxes, with timestamps stored on the profile via the sign-up flow.** Minimum age 18 is an assumption; no date of birth is collected, only a confirmation. Terms text is a placeholder until real terms exist.
- **Navigation:** tabs become Discover (`index`), Create, Matches (placeholder until requests), Profile. Auth screens live in an `(auth)` group outside the tabs. The saved trip is edited on Profile and read by Discover for its initial filters.
- **Theme: replace the template's `Colors`, `Spacing` and related tokens in `constants/theme.ts` with values from `docs/design-reference.md`, light theme only, plus three small shared components (`Card`, `Chip`, `PrimaryButton`).** Plain `StyleSheet` stays; no UI library. The hex values are estimated from an image, so they live only in the theme file and change in one place. Alternative: a styling library such as NativeWind or Tamagui — more setup than this scope justifies. The raised centre tab button in the mock is not built, since the native tab bar does not support it.
- **Testing:** pure logic in `packages/core` with jest; screens in `apps/mobile` with RNTL and a mocked Supabase client module; database rules verified by running SQL as different roles (anon, signed-in user, other user) against the dev project and recording the checks as a script in `supabase/tests/`. No end-to-end framework in this change.

## Risks / Trade-offs

- [No Docker, so no local database] → Use a separate hosted dev project, never a project with real users; keep migrations idempotent and reviewable; revisit local Supabase if Docker is installed later.
- [RLS mistakes expose data] → Policies are tested with SQL scripts for anon, owner and other-user cases, and the public profile columns are explicit so email and age timestamps are not returned to other users.
- [Email verification needs a mail provider and redirect handling] → Rely on Supabase's built-in email for development (rate-limited); the app only shows "check your email" and re-checks the session on sign in. Deep-link handling of the confirmation link is deferred; the user can confirm in a browser and sign in again.
- [Age gate is a self-declaration] → Accepted for v1; it is a record of consent, not verification. Check legal needs before public launch.
- [Cold start: an empty destination looks dead] → Not solved by this change; seeding or invites are a product task. Counts per destination make emptiness visible.
- [This change depends on the scaffold change being archived first for the modified specs] → Archive the scaffold change before archiving this one; apply work can still start now because it only touches code.
- [Expo and Supabase versions move quickly] → Install packages with `expo install` where the package is an Expo module, and check the Supabase docs for the current React Native setup before writing client code.

## Migration Plan

1. Create a personal Supabase dev project (manual), put its URL and anon key in `apps/mobile/.env.local`.
2. Apply migrations with the Supabase CLI against that project (`supabase link`, then `supabase db push`); seed destinations.
3. Rollback: migrations are additive. To undo, drop the new tables in a down script kept alongside, or recreate the dev project; there is no production data yet.
4. App rollout is by development builds only; there is no store release in this change.

## Open Questions

- Terms and privacy text: placeholder links for now; real documents are needed before anyone outside testing signs up.
- Whether the Create tab should be a tab or a button on Discover is a UI detail that can change without affecting specs.
