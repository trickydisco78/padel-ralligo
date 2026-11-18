# Design

## Context

Observed in the repo (see proposal.md for motivation):

- `profile_trips` holds one trip per profile (`profile_id` is its primary key), private to its owner by RLS. `@padel/profiles` owns it end to end: `Trip`, `validateTrip`, `useTrip`, `useSaveTrip`, `useClearTrip` and `TripSection` (rendered on the Profile screen), and Discover reads it to pre-fill filters (`activeTrip`).
- The player directory (`public.search_players`, `@padel/players`) lists opted-in players by home destination only. Opt-in is `profiles.discoverable_at`; a listed player also needs a `padel` row in `profile_sports`. Caps (50 per call, nothing from offset 100) live in the function.
- Discover already has a `players | matches` switch (`view`), shared destination, level and search filters, date fields for matches, and a `useDebouncedValue` helper in the app.
- Turborepo tags: `profiles`, `listings` and `players` are `domain-feature` and may not import one another; `auth` and `destinations` are `domain-base`. The app composes feature packages (as it does for `useAppStatus`).
- Match filtering by destination and date overlap already exists in `@padel/listings` (`matchesFilters`).
- The player-directory change is archived; its requirements are in the main specs.
- The supplied designs show a guest view (Explore public players) and a member view (Players for your trips) with the My trips | Explore places switch.

## Goals / Non-Goals

**Goals:**
- Several trips per member, each shared or hidden by choice, managed on the Profile.
- Server-side overlap, with the same caps and minimum-data rules as the directory.
- A My trips view that matches the design's structure, reusing the existing Players | Open matches lists.

**Non-Goals:**
- Women, Nearby, preference tags, Best fit, connections, notifications, numeric levels, dropping `profile_trips`, a Past trips screen (see proposal).

## Decisions

1. **New `trips` table, additive.** Columns: `id uuid pk`, `profile_id` (FK, cascade), `destination_id` (FK), `start_date`, `end_date`, `visibility text` (`hidden | members`, default `hidden`), `created_at`; a check that `end_date >= start_date`. Owner-only RLS (select, insert, update, delete where `profile_id = auth.uid()`), no grants to `anon`. A `before insert` trigger refuses an 11th trip per profile. The migration copies existing `profile_trips` rows in as hidden trips. `profile_trips` stays, unused: dropping a table is destructive and needs the owner's approval, so a later cleanup migration does it. *Alternative:* alter `profile_trips` in place (change its primary key), rejected for the same reason.

2. **No stored status.** Past, active and upcoming are derived from the dates and the caller's "today". There is no `cancelled`: deleting removes the row. This avoids a job that flips statuses and removes a state that could go stale.

3. **Two `SECURITY DEFINER` functions for signed-in callers**, `search_path = ''`, schema-qualified, `revoke ... from public, anon`, `grant execute ... to authenticated`:
   - `my_trips_overview(p_today date)`: the caller's trips with `end_date >= today`, soonest first, with `days` and `overlap_players`.
   - `find_overlapping_players(p_trip_id, p_my_level, p_this_week, p_query, p_today, p_limit, p_offset)`: players for one of the caller's trips.
   Both use the same inner rule so counts match lists: another profile with `discoverable_at` set, a padel tier, and a trip with `visibility = 'members'`, to the same destination, `start_date <= my end` and `end_date >= my start`, not the caller, not already ended. `find_overlapping_players` returns nothing unless `p_trip_id` is owned by `auth.uid()`, so a supplied id proves nothing. Never accept a profile id from the client.

4. **Overlap days are inclusive.** `overlap_days = least(end dates) - greatest(start dates) + 1`. When one other player has several overlapping shared trips to the same destination, the one with the most overlapping days is used (`distinct on`). The mock's "All 7 days" for 14 to 21 June is 8 days inclusive and becomes "All 8 days".

5. **Filters in SQL, week and "today" from the client but clamped.** "This week" means an overlap that includes a day from Monday to Sunday of the week containing `p_today`. The server accepts the client's date only within one day of its own date (`greatest(current_date - 1, least(current_date + 1, p_today))`), so the device's time zone is respected without trusting it. "My level" is decided on the server from the caller's own tier (tiers are ordered Beginner < Intermediate < Advanced; within one step), so the client cannot ask for another member's view. Name search is `strpos` on the displayed name (never `LIKE`, query capped at 40 characters), allowed here because results are already limited to players sharing a trip.

5a. **Caps match the directory.** At most 50 rows per call and nothing from offset 100; `total_count` is returned for display.

6. **Indexing is plain.** A partial btree index on `(destination_id, start_date, end_date) where visibility = 'members'` serves the overlap predicate, plus `(profile_id, start_date)` for the owner's list. `daterange` with GiST would need `btree_gist` to combine with the destination and buys nothing at this scale; revisit if query plans say otherwise.

7. **New package `@padel/trips` (`domain-feature`).** It takes over the trip code from `@padel/profiles`: `Trip`, validation (with the 10-trip limit), `tripLengthDays`, date-range formatting, repository (list, create, update, delete, overview RPC), hooks (`useTrips`, `useSaveTrip`, `useDeleteTrip`, `useTripsOverview`), and the UI: `TripsSection` for Profile (list, add, edit, delete, share switch, empty state, past trips marked), `TripCard` and `SavedTripsRow`. It imports only shared packages, `auth` and `destinations`. `@padel/profiles` loses its single-trip files; nothing else imported them but Discover and the Profile screen.

8. **Overlapping players live in `@padel/players`.** `useOverlappingPlayers(tripId, filters)` calls `find_overlapping_players`; `PlayerCard` gains an optional overlap line ("Jun 17–23 · 5 days overlap" / "All 8 days overlap") and keeps its minimum fields. `players` never imports `trips`: Discover passes it a trip id.

9. **Discover composition stays in the app.** State: `mode` (`trips | explore`), `selectedTripId`, `view` (`players | matches`) and the My trips chips. Default mode is My trips when the overview has an upcoming trip, else Explore; the selected trip defaults to the one under way, otherwise the soonest. Guests never call the trips functions. In My trips, Open matches are the existing listings filtered by the trip's destination and dates with `matchesFilters`. The old effect that pre-fills filters from a saved trip is removed.

10. **UI additions, all from the design.** `SegmentedControl` gains an optional icon per option (calendar and compass), and `@padel/ui` gets a small `NoticeBanner` (icon, text) for the three notices. The saved-trips row is a horizontal scroll of selectable cards using existing card, spacing and colour tokens. No new colours.

11. **Guest wording and button.** Guest cards say "Sign in" and still open the contextual sheet (one authentication entry UI); members see "Connect" and the "To be developed" sheet, as now. Explore places copy comes from the locale JSON. The card shows the sport ("Padel") as in the design; the design's "area" wording waits for the change that adds destination coordinates.

12. **Seed data.** The development seed gains shared trips for the four players with dates relative to today (Jordi 8 days, Hannah, Lucía travelling from Lisbon to Málaga, Diego), and a documented SQL snippet adds a trip for the test account. Dates are relative so the data never goes stale.

## Design notes (supplied designs vs this change)

- The mock shows numeric levels (4.5, 4.0, 3.5); tiers are shown instead, by decision.
- Women, Nearby, "Plays most days", "Mixed doubles", "Social + competitive", "After-work games" and "Best fit" are the next change. Until then the card's second line is destination, dates and overlap only, and the list heading reads "Players in Málaga" with the count of overlapping players (the mock's "good fits" implies ranking).
- The mock's search says "Search players or a destination". In My trips the field searches the overlapping players' names ("Search players"); in Explore it says "Search a city" because names are not searched there.
- The design drops the level chips and date fields; they stay for now because match filtering still uses them. A follow-up can remove them if the design is meant literally.
- Guest and member toggles at the top of the mock are prototype controls.
- The design's "Explore near" shows four popular cities; this change shows all destinations under that label.

## Risks / Trade-offs

- [Few shared trips at launch, so overlap lists are empty] → Trips are hidden by default on purpose; clear empty states and a prompt to share; seed data in development.
- [Two switches before anyone is visible: listed in Find players, and the trip shared] → Both are explained in the forms; a member can use My trips for the matches list even with nobody overlapping.
- [Trip dates are sensitive (they reveal when someone is away from home)] → Hidden by default, shared per trip, only to signed-in listed members, only for overlapping destination and dates, never to guests; the explanation text says exactly this. Terms and privacy text need review before production, the project owner's call.
- [`profile_trips` rows stay behind] → Documented as deprecated and unused; removal is its own approved migration.
- [Overlap counts and lists could disagree] → Both use the same predicate in the same migration, with a database test that counts equal list totals.
- [Client "today" could be abused] → Clamped to within one day of the server's date; it only moves a week boundary and "ended" cut-off.
- [Moving trip code out of `profiles` touches an existing flow] → Moved with its tests; the Profile screen swaps one section for another; behaviour is verified by the existing and new tests.

## Migration Plan

1. One additive migration: `trips`, indexes, limit trigger, RLS, copy from `profile_trips`, the two functions and grants. No existing table is dropped or altered.
2. Apply to dev, run `pnpm test:rls` with the new checks, run the seed script and the tester's trip snippet.
3. Ship the app: Profile shows My trips; Discover shows the switch for members. Existing single trips appear as hidden trips.
4. Rollback: drop the two functions and the `trips` table; `profile_trips` is untouched, so the previous app version still works.

## Open Questions

- Maximum of 10 trips is a product guess; it can change by editing the trigger without touching the spec's meaning.
- Whether the design's missing level chips and date fields should be removed from Discover is left for the follow-up that adds the remaining filters.
