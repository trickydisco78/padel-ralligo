# Proposal

## Why

The product is about finding people to play with, but Discover only lists matches. There is no way to see who else plays in a destination, so the "Find players" half of the idea is missing and guests have nothing to see beyond matches. Players are people, so this must be opt-in and show only a minimum of public information. This change delivers the first, safest slice: a **player directory** browsable by guests and members, with no profile pages, trips or connections yet. Trip-overlap discovery and connections follow as separate changes (see Out of scope).

## What Changes

- Add a **Players | Open matches** switch to the Discover screen, with a count on each, matching the supplied design. Open matches is the existing list, unchanged.
- Add a **Players** list: cards showing a first name and last initial, home destination, and skill tier, with a **Connect** button. Search and filters reuse the existing Discover controls (destination chips, level chips, text search over destination and country).
- Guests can browse the Players list with no account. Guests see no profile page, no user identifier, no trip, no bio and no home city.
- Players are **opt-in**: a new setting "Show me in Find players", off by default for every existing and new account, plus a **Home destination** choice so a player can be found by place. Both are added to the existing profile form.
- Read access is a single controlled server function with a hard result cap and no name search for guests. The base tables stay unreadable to the unauthenticated role.
- **Connect** is shown but not active in this change: a guest gets the contextual sign-in sheet, and a signed-in member sees a sheet saying "To be developed", the same pattern as "Join match". A new `connectPlayer` authentication intent returns the guest to the Players list after sign-in.
- Add Málaga and Lisbon to the curated destinations.
- Initials tiles replace photos: no avatar upload or storage is introduced.
- All new copy goes in the existing locale JSON.
- **Out of scope:** trip overlap, the trip banner, overlap days, the This week, My level, Women and Nearby chips, Best fit sorting and compatibility scoring (next change, `trip-overlap-discovery`); connection requests, accepting and declining (change after that, `player-connections`); messaging; blocking and reporting; avatars; availability tags such as "Plays most days" and "After-work games" (no data exists for them, to be added with trip discovery); requiring a verified email for connecting; opening a player profile.

## Capabilities

### New Capabilities
- `player-directory`: the Players list on Discover, who appears in it, what each card may show, search and filtering, the cap on results, and how guests and members see it.

### Modified Capabilities
- `player-profiles`: the discoverability setting and the home destination choice.
- `public-data-security`: the player directory as a second, explicitly controlled public read, with the matching grant rules.
- `contextual-authentication`: a connect-player intent in the fixed set, returning the guest to the Players list.
- `destinations`: Málaga and Lisbon exist.

## Impact

- **Database:** one migration: `profiles` gains `discoverable_at` (null = not discoverable) and `home_destination_id`; two rows added to `destinations`; one `SECURITY DEFINER` function for the directory with explicit grants. No new tables. No change to existing grants or policies.
- **Code:**
  - New package `@padel/players` (domain-feature tag): repository, mapper, query hook, `PlayerCard`, `PlayersList`.
  - `@padel/profiles`: the discoverability switch and home destination picker in the profile form.
  - `@padel/auth`: new `connectPlayer` intent and its copy.
  - `apps/mobile`: the Discover screen gains the switch and Players list; intent route mapping.
  - `@padel/ui`: a segmented switch and a deterministic initials tile.
- **Tests:** database tests for anonymous and member access, opt-out exclusion and the cap, domain and component tests, and the intent flow.
- **Dependencies:** none new. `password-reset-and-email-links` is unrelated; `trip-overlap-discovery` depends on this change.
