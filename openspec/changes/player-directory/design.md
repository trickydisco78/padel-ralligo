# Design

## Context

Observed in the repo (see proposal.md for motivation):

- `profiles` holds `display_name` (2–40 characters, free text), a free-text `home_city`, `bio`, and is readable by every signed-in user (`using (true)`); `profile_sports` holds one self-rated tier (`Beginner | Intermediate | Advanced`) per sport. There is no discoverability flag and no home destination.
- `destinations` is the curated place table (4 rows) already used by listings and the saved trip. The UI has a `DestinationPicker` (`@padel/destinations`).
- Anonymous reads are two views, `discover_listings` and `destinations_with_counts`, running with the owner's rights and granted to `anon`; base tables carry no anon grants and `rls.mjs` asserts the exact grant list. `poster_id` was deliberately kept out of the public view so visitors cannot correlate people.
- Discover (`apps/mobile/src/app/(tabs)/discover.tsx`) filters matches by destination chips, level chips and a text field; it keeps state across tab switches. `@padel/ui` has chips and cards but no segmented switch.
- Turborepo tags: `profiles` and `listings` are `domain-feature` and may not depend on each other; `auth` and `destinations` are `domain-base`; `shared` packages must not depend on domains.
- The guest-first change gave us `AuthIntent`, the contextual sheet, the intent resolver and a disabled "Join match" pattern for signed-in users.
- The supplied design shows the member view of the final feature. In this change only the structure around it is built: switch with counts, title block, search, chips and cards. Items that belong to later changes are listed under "Design notes".

## Goals / Non-Goals

**Goals:**
- Opt-in, minimum-data player list for guests and members.
- One server-enforced public read for players with a hard cap, tested with real anonymous and signed-in clients.
- Reuse existing Discover controls, intents and the disabled-button pattern.

**Non-Goals:**
- Trip overlap, ranking, connections, messaging, blocking, avatars, profile pages, name search (see proposal).

## Decisions

1. **One `SECURITY DEFINER` function, not a view, for the player directory.** `public.search_players(p_destination_id, p_query, p_level, p_limit, p_offset)` returns `player_id` (null unless the caller is signed in), a formatted `display_name`, `destination_id`, `destination_name`, `skill_tier` and `total_count`. A view cannot enforce a result cap or a paging depth, and PostgREST's `max-rows` is a project setting outside our migrations. The function applies `least(p_limit, 50)`, returns nothing when `p_offset >= 100`, orders by name then id for stable pages, sets `search_path = ''`, schema-qualifies everything, and is granted by an explicit `revoke … from public` plus `grant execute … to anon, authenticated`. Anonymous callers keep no grant on any table or view behind it. *Alternative:* a view like `discover_listings`, rejected because it cannot cap results.

2. **Public name is derived in SQL.** First word of `display_name`, plus the upper-cased first letter of the last word and a full stop when there are two or more words ("Jordi M."); a single word is shown as is. Deriving it server-side means the full name never reaches the client. The initials tile is built on the client from this same string.

3. **Opt-in is a timestamp, with a database check.** `profiles.discoverable_at timestamptz` (null = not listed, default null) records when the player agreed; `profiles.home_destination_id uuid references destinations` places them; `check (discoverable_at is null or home_destination_id is not null)` stops a listed player without a place. The function also requires a `padel` row in `profile_sports`. Existing rows stay null, so nobody is listed by this migration. Existing RLS on `profiles` is unchanged: members can already update their own row.

4. **Search never touches names.** The text parameter is matched with `strpos(lower(…), lower(p_query)) > 0` against destination name and country (no `LIKE` wildcards, no dynamic SQL, query length capped at 40). Name search is a member feature and arrives with trip discovery, where it can be limited to players who share a trip window.

5. **No identifier for guests.** The function returns `player_id` only when `auth.uid()` is not null. The Players list therefore keys rows by position within the request. Guests have nothing to correlate across sessions, consistent with the existing rule that user identifiers are not public. The `connectPlayer` intent carries no id for the same reason: the guest returns to the list, and Connect does nothing yet anyway.

6. **Members are excluded from their own results** with `p.id is distinct from auth.uid()` inside the function (it still sees the caller's JWT).

7. **New package `@padel/players` (tag `domain-feature`).** Layers like the others: `domain/` (`Player`, `PlayerFilters`, filter-to-query rules), `infrastructure/` (Supabase RPC call, mapper that validates tier values), `presentation/` (`usePlayers`, `PlayerCard`, `PlayersList`, locale JSON `players.*`). It imports only `ui`, `core`, `supabase`, `query`, `i18n` and `auth` (a domain-base package), never `profiles` or `listings`. The app composes it with the existing match list.

8. **Query keys and caching.** `['players', userId ?? 'guest', filters]` because results differ by caller (self excluded, ids present). `useInfiniteQuery` with offsets 0 and 50 only, matching the cap. The existing session cache guard already clears everything on user change.

9. **Discover composition lives in the app.** A `view` state (`players | matches`) is held in the Discover screen and settable by a route parameter (`/discover?view=players`) so the auth resolver can return there. Destination chips, level chips and the text field are shared by both views; each view applies them to its own data. The switch shows counts: matches from the filtered list already in memory, players from `total_count`. Closing the sheet or switching views never resets filters.

10. **UI additions, kept to the supplied design.** `SegmentedControl` (two options, optional count, selected state, 48dp targets) and `InitialsTile` (initials, plus a colour chosen deterministically from a small palette by hashing the displayed name) in `@padel/ui`. The five pastel tile colours are the only new visual tokens and come from the supplied design. Existing chips, cards, spacing and typography are reused.

11. **Connect reuses the Join pattern.** `useRequireAuth({ type: 'connectPlayer' })`: a guest gets the sheet "Connect with players"; a signed-in member sees `accessibilityState.disabled` with a hint, and no mutation exists. `AuthIntent` gains `{ type: 'connectPlayer' }` (a simple intent, no id), `intent-copy` gains its keys, and the resolver navigates to `/discover?view=players`.

12. **Profile form.** `@padel/profiles` adds a switch ("Show me in Find players") with the explanation text and a home destination picker using `DestinationPicker` (profiles already depends on `destinations`, a domain-base package). Saving writes `home_destination_id` and sets `discoverable_at` to now when turned on from off, or keeps the existing value; turning off writes null.

13. **Seed data is a script, not SQL.** Profiles reference `auth.users`, so development players are created through the admin API by a script in `supabase/seed/` using the secret key from `.env.local` (never in the app), tagged with an `@seed.invalid` email domain, idempotent, with a `--remove` option. Players mirror the design: Jordi M., Hannah K., Lucía C., Diego R., opted in, with tiers and home destinations (Málaga for three, Lisbon for one). It runs against the hosted dev project only with the project owner's go-ahead.

## Design notes (supplied design vs this change)

- The Guest/Member toggle in the picture is a prototype control, not a feature; the real state comes from the session.
- "All 7 days overlap" for a 14–21 June trip is 8 days inclusive; the next change fixes one counting rule (inclusive days) and its copy.
- Initials tiles need no photo storage.
- The trip banner, overlap line, "Trip dates overlap" notice, This week / My level / Women / Nearby chips, Best fit sort and the availability tags ("Plays most days", "After-work games") are the next change. Availability tags have no data behind them yet and need a `play_times` preference there.
- The Players subtitle in the picture ("These players saved trips that overlap yours") belongs to member overlap mode; this change uses "Players in your destination".

## Risks / Trade-offs

- [Nobody is opted in at launch, so the list is empty] → Clear empty state with a pointer for signed-in members to Profile; seed players in dev; accept an empty production list until people opt in.
- [A first name, last initial, home destination and tier can still identify someone in a small community] → Opt-in only, plain explanation next to the switch, turning it off removes the player from the next request; terms and privacy text need review before production, which is the project owner's call.
- [A determined caller can page through destination × level combinations] → 50 per request, 100 depth, no ids, no names in search, platform rate limits; revisit with stronger limits if the directory grows.
- [Profiles remain readable by any signed-in user regardless of the opt-in] → Unchanged here by decision; revisit when connections arrive (the opt-in does not hide a member from the profile table).
- [Offset paging can show duplicates if players opt out between pages] → Acceptable at a depth of 100; ordering is stable.
- [Palette tokens drift from the design system] → Defined once in `@padel/ui` tokens with tests that the colour choice is deterministic.

## Migration Plan

1. One additive migration: columns, check, two destination rows, function and grants. No data change to existing users.
2. Apply to the dev project, run `pnpm test:rls` with the new checks, then run the seed script with the owner's approval.
3. Ship the app changes; the list stays empty until someone opts in.
4. Rollback: drop the function, then the columns and the check, and delete the two destination rows if unused. Nothing else depends on them.
