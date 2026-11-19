## 0. Setup

- [x] 0.1 Branch `feat/match-join-requests` created from `origin/main` (the design system PR is merged, so there was nothing to choose between)

## 1. Database

- [x] 1.1 Migration: `join_requests` table, constraints, indexes and row-level security (owner select only, no write grants, nothing for `anon`)
- [x] 1.2 Migration: `request_to_join`, `withdraw_join_request`, `decide_join_request` and `match_people` as `SECURITY DEFINER` with fixed search path, revoked from `public` and `anon`, with the listing row locked while counting; error codes as in the design
- [x] 1.3 Migration: trigger rejecting `players_needed` below the accepted count; `spots_left` on `discover_listings`; destination counts only for matches with places left
- [x] 1.4 Apply the migration to the dev project and regenerate the `@padel/supabase` types
- [x] 1.5 Extend `supabase/tests/rls.mjs`: anonymous denied, own rows only, no direct writes, privileges listed, each rule (self, duplicate, declined, closed, past, full, unverified email, not organiser), the last-place race, who sees whom, and the new view column list; run it
- [x] 1.6 Update `supabase/README.md` (tables, functions, who sees what, the widened view)

## 2. Listings package

- [x] 2.1 Domain: join request status and error codes, `MatchPeople` types (viewer role, own status, places, pending count, people), `spotsLeft` on `DiscoverListing`; mapper and mapper tests
- [x] 2.2 Repository through the four functions, mapping error codes to translation keys; `listDiscoverable` hides full matches; repository tests on the fake client
- [x] 2.3 Hooks: `useMatchPeople`, `useRequestToJoin`, `useWithdrawRequest`, `useDecideRequest`, invalidating listing and people queries; hook tests
- [x] 2.4 `MatchHero` (pink block, decorative circles, court motif) and the match sheet pieces: date tile, players progress, people section
- [x] 2.5 `MatchActions` for every state (request, pending, accepted, declined, full, organiser) and the "Request sent!" and "Withdraw request?" sheets; component tests for each state
- [x] 2.6 Places left on cards and details using `spotsLeft`; copy in `en.json`
- [x] 2.7 My listings: "Manage requests" action; edit form shows the rejection when players needed is below the accepted count

## 3. UI package, app and auth

- [x] 3.1 `BottomSheet`: the design's centred confirmation layout (grabber, icon disc, centred title and message, stacked actions) as an option; keep existing behaviour and tests
- [x] 3.2 Match screen rebuilt as hero, overlay `AppBar` (back and Share), sheet and pinned action area; guests never call the people function; refetch on focus
- [x] 3.3 Share with the destination, date and `padel-ralligo://match/<id>`; test that it works for a guest
- [x] 3.4 Manage match route `match/[id]/manage`: tabs with counts, `PlayerRow`s, review sheet, accept and decline, Close match with confirm, redirect for a non-organiser
- [x] 3.5 "Find similar matches": Discover accepts a destination route parameter and applies it as its filter
- [x] 3.6 Reword the `joinMatch` intent copy; confirm the return path still makes no request
- [x] 3.7 Update the existing match screen, guest-first and Discover tests for "Request to join" and the new states; screen tests for Manage match

## 4. Docs and checks

- [x] 4.1 `docs/architecture.md`: join requests, who sees what, why the app composes `PlayerRow`
- [x] 4.2 Run type check, lint, boundaries and tests at the root; run `pnpm test:rls`; fix failures
- [ ] 4.3 Try the flow on the iOS simulator: guest, member requests and sees Request sent, organiser reviews, accepts and declines, withdraw, declined member finds similar matches, full match, share; note anything unchecked on Android
