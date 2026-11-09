# Proposal

## Why

The scaffold shows a hard-coded list of players. The product is a place to find people to play padel with, on holiday or at home, and the agreed core object is a **match listing** that one player posts and others browse (see `docs/product-vision.md`, `docs/first-pass-prototype.md`). Listings need real accounts, profiles with a skill level, a list of destinations and a database, so this change adds that foundation and replaces the mock player list with listings.

## What Changes

- Add a Supabase backend (Postgres, auth, row-level security) with migrations checked into the repo, and connect `apps/mobile` to it. The project is a personal one, so the user creates and owns the Supabase project.
- Add email/password accounts: sign up with a terms and age confirmation, email verification, sign in and sign out. No social login in this change.
- Add a player profile: display name, home city, short bio and a self-rated padel skill tier (Beginner, Intermediate, Advanced). The skill record is keyed by sport (padel only) so more sports and ratings can be added later.
- Add a curated, database-held list of destinations (seeded with Tenerife, The Algarve, Marbella and Barcelona).
- Add match listings: a signed-in user posts a listing with a destination, a date or date range, an optional time, optional venue, level wanted, number of players needed and a description. Others browse and filter listings by destination, dates and level. The poster can edit or close their own listings.
- Add a saved "current trip" (destination and dates) on the profile that pre-filters Discover.
- Apply the visual language from `docs/design-reference.md` (green accent, white cards, pill chips, light theme only), with shared card, chip and button components. Only the look is adopted; content in the mock that is not described in the specs (stats, achievements, photos, preferences) is not built.
- Change navigation: the "Find players" tab becomes **Discover** (listings), a **Create** tab is added, and Matches and Profile remain. **BREAKING**: the mock player list, `Player` type and `filterPlayers` in `packages/core` are replaced by listing equivalents.
- Out of scope (later changes): requests to join and accept/decline, chat, report/block, notifications, photos, availability, verification badges, reviews and ratings, social login, password reset, map and geo-search, a web app, and an admin UI for destinations.

## Capabilities

### New Capabilities
- `user-accounts`: Email/password sign up with terms and age confirmation, email verification, sign in, sign out and session handling.
- `player-profiles`: A player's profile, their padel skill tier and their saved current trip.
- `destinations`: The curated list of destinations that listings and trips refer to.
- `match-listings`: Creating, browsing, filtering, editing and closing match listings.

### Modified Capabilities
- `app-shell`: Tab navigation changes from Find players / Matches / Profile to Discover / Create / Matches / Profile, and the app opens on Discover.
- `player-discovery`: Its requirements (mock player list, skill filter, mock data) are removed because listings replace them.

## Impact

- New: `supabase/` (migrations, seed), `apps/mobile` auth, profile, create and discover screens, a Supabase client, `.env` configuration (never committed).
- Changed: `apps/mobile` theme tokens and shared UI components (`constants/theme.ts`, card, chip, button), light appearance in `app.json`.
- Changed: `packages/core` (listing types, validation and filtering replace `Player` and `filterPlayers`), `apps/mobile` tabs and tests.
- New dependencies: `@supabase/supabase-js`, a secure session storage package for Expo, and the Supabase CLI as a dev dependency.
- Prerequisite: `scaffold-padel-player-finder-app` should be archived first, so that `app-shell` and `player-discovery` exist as main specs for the modified and removed requirements here. Its two manual simulator checks (3.3, 4.2) are still open.
- Assumptions: the minimum age is 18; Docker and the Supabase CLI are not installed on this machine, so work targets a hosted development Supabase project; the Supabase anon key is a public client key but is still kept in untracked env files.
