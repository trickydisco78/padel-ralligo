# Design

## Context

Verified current state (see proposal.md for the comparison table):

- Routes: `src/app/_layout.tsx` (providers, `anchor: '(tabs)'`), `(tabs)` (native tabs: index, discover, create, matches, profile), `(auth)` (sign-in, sign-up), `profile-setup`. `RootStack` uses `Stack.Protected`: tabs for `signedOut | ready`, `(auth)` for `signedOut`, `profile-setup` for `needsProfile`; a spinner while `loading`.
- `@padel/auth` exposes `useSession` (`loading | signedOut | signedIn`), `SignInPrompt`, `AccountActions`, the two screens. It already imports `expo-router` for navigation, and must not import other domains.
- `@padel/listings` has `DiscoverListing`, `ListingCard` (not pressable), `useDiscoverListings`; the repository has no read-by-id.
- Data: `discover_listings` (security_invoker = false, granted to `anon` and `authenticated`) exposes destination, dates, time, venue, level, `players_needed`, description, poster display name and skill tier; no `poster_id`, no email. Base tables are closed to `anon`. Email confirmation is required to insert a listing (`is_email_confirmed()`).
- Tests: jest-expo, route tests in `apps/mobile/src/__tests__/app` using `renderRouter` and the fake `@padel/supabase/testing`; package tests in `packages/*/tests`; RLS via `pnpm test:rls` (needs a dev DB).
- Not found in the code: join, participants, messaging, public player profiles, a "match format" column, a search text field, any location use.

## Goals / Non-Goals

**Goals:** a single intent mechanism; guests never redirected from public screens; return to context after auth; no duplicate auth UI or providers; reuse existing tokens and components.

**Non-Goals:** implementing join/messages/personal matches; persisting intent; changing the session provider or auth service; schema changes; new dependencies (no bottom-sheet library).

## Decisions

**D1. Access state is derived, not new.** Initialising = `loading`, Guest = `signedOut`, Authenticated = `signedIn`. No change to `SessionProvider`. `RootStack` shows its spinner only for the very first status. A later `loading` (for example the profile check right after a guest signs in) keeps the previous status, so the screens underneath stay mounted instead of being replaced by the spinner and rebuilt from the URL, which would lose Discover's filters and scroll position and the history. *(Changed during apply: the spinner used to replace the whole navigator on every `loading`.)* *Alternative:* a new `guest` status or store, rejected as a duplicate of `signedOut`.

**D2. `@padel/auth` owns the intent type, provider and sheet; `apps/mobile` owns intent-to-route.** `AuthIntent` is a plain discriminated union (`joinMatch {matchId}`, `createMatch`, `openMessages`, `openPersonalMatches`, `openProfile`). Auth knows no routes and imports no domain: the app maps intents to routes in one function (and validates `matchId` shape). `useRequireAuth()` returns `(intent) => boolean`: `true` if signed in, otherwise it stores the intent, opens the sheet and returns `false`. Callers stay in control and no callback is stored. *Alternatives:* storing a `returnTo` route string (leaks route structure into auth, allows arbitrary destinations); a callback queue (the spec forbids it, and it invites auto-submission).

**D3. Intent lives in memory, in a provider mounted inside `SessionProvider`.** It survives sign-in/sign-up switching because those screens share the root provider, not route params. Not written to storage: it has no sensitive content but persisting adds stale-intent risk. Cost: lost on app kill, including while a user leaves to verify email (accepted; see Open Questions).

**D4. Resume after auth in the app.** An `AuthIntentResolver` component in `apps/mobile` (child of `RootStack`'s providers) watches `useAppStatus()`. When status is `ready`, the sign-in screens and profile setup have gone, and an intent is pending, it clears the intent and navigates, one tick later so the navigator has finished changing screens, so it cannot fire twice. `needsProfile` naturally defers it until setup completes. Join goes to `/match/[id]` with `router.push` (nothing if the user is already on that match), so Back returns to where they were; tab intents use `router.navigate`. It never auto-joins. *(Changed during apply: `router.replace` and then `dismissTo` were tried and lost the screen when the navigator re-synced.)*

**D5. Cancellation.** The sheet's dismiss and back clear the intent. A small root-level component (`AuthIntentCancellation`) clears a pending intent when the user leaves the sign-in and sign-up screens while still signed out, which covers "Continue browsing" and back. It lives outside the `(auth)` group because that layout can be unmounted in the same render as a successful sign-in, before it could see the new session. *(Changed during apply: the first design had the `(auth)` layout clear it on unmount.)* Sign-out clears it. Cleanup order versus the resolver on successful sign-in is a risk (R2) and gets an explicit test.

**D6. Public match details need no migration.** `getDiscoverable(id)` selects from `discover_listings` filtered by `id`, so closed and past listings return no row and no private column exists to leak. `id` is already exposed. `players_needed` is the only availability data; it is presented as "spots needed", not remaining places (no participants exist). New RLS test cases pin the column list for by-id reads. Any future field (format, participants) must be added to a view deliberately, never by exposing base tables to `anon`.

**D7. Details route is a root-level screen `match/[id]`** with the same guard as `(tabs)` (`signedOut | ready`), so it is a pushed screen (tab bar hidden, Android back pops it). The intent resolver pushes `/match/<id>` once the user is back on the tabs, so back returns to them. Naming is decided: UI, route, intent and new components say "match"; the package and DB keep "listing". Existing "game(s)" strings are left for a follow-up. `ListingCard` gets an optional `onPress`; screens pass navigation, so `listings` stays router-free.

**D8. Tabs.** Home and Discover public. Create: guest sees the in-screen prompt (a bottom sheet over an empty tab is worse than a prompt in place) with intent `createMatch`. Matches: the tab contains only a placeholder meant for personal matches and messages, so it stays gated (`openMessages`; the copy is generic until the tab has content). Profile: prompt with the new copy and intent `openProfile`. The tabs group is not protected.

**D9. One entry UI.** `AccountActions` gains `intent?`; `SignInPrompt` gains `title?` and `intent?`; the sheet renders `AccountActions` too. Sign in and Create account are two buttons (primary and a new secondary variant in `@padel/ui`), replacing today's text link. Sign-in and sign-up screens link to each other with `replace`-style navigation so back does not loop.

**D10. `BottomSheet` in `@padel/ui`.** Built on RN `Modal` (transparent, `onRequestClose` for Android back, backdrop press to dismiss, `accessibilityViewIsModal`, labelled close). Uses existing `Colors`, `Radius`, `Spacing` tokens. *Alternative:* `@gorhom/bottom-sheet` (reanimated and gesture-handler dependencies for a short prompt), rejected for now.

**D11. Search.** Discover gets a text field that filters destination chips and listings client-side by destination name, country or venue; Home gets a non-editable search entry that opens Discover with the field focused. Volume today is small; the filter stays a pure function in `listings` beside `matchesFilters`.

**D12. No Home sign-in link.** Decided: Home loses the card and gains only the search entry. Guests reach sign-in from the Profile tab, the contextual sheet and the tab prompts.

**D13. Package responsibilities (no new packages).** The brief's "Matches" is `@padel/listings`, "Players" is `@padel/profiles`.
- `@padel/auth`: session (existing), `AuthIntent` type and validation, intent provider/coordinator, `useRequireAuth` (protected-action helper), `AuthPromptSheet`, `AccountActions`/`SignInPrompt`. Imports no other domain.
- `@padel/listings`: public queries (`getDiscoverable`, `useDiscoverListing`), repository interface, `DiscoverListing` (the public DTO), `ListingDetail`, `ListingCard`, search filter. Join-match business rules (not own match, not full, not closed, not already joined) belong here but need a participants table; that is a follow-up change. This change only reserves the intent and the screen.
- `@padel/profiles`: unchanged. The public player view today is `posterName` and `posterSkillTier` on `DiscoverListing`; there is no public-profile screen. A public-player DTO is not added until one exists (avoids an unused abstraction).
- `@padel/ui`: `BottomSheet` and the secondary button, nothing domain-specific.
- `apps/mobile`: routes (`match/[id]`), `RootStack` guard, intent-to-route map and resolver, the cache-clearing component, wiring navigation callbacks into the intent provider, any platform-specific modal tweak.
No new `matches` or `players` package: it would duplicate `listings` and `profiles`, and the join rules have no code yet.

**D14. Where the sheet lives.** `AuthPromptSheet` lives in `@padel/auth` (presentation), on `@padel/ui`'s `BottomSheet`. Its content is domain-neutral (title and body come from the intent kind, not from listings), so it needs no other domain. `@padel/auth` already imports `expo-router` for its screens and `AccountActions`, so a sheet there adds no new class of dependency. The new code (intent type, provider, `useRequireAuth`) is router-free. Navigation stays in `AccountActions`, which already used the router and which the sheet renders, so there is one entry UI and no navigation callbacks to pass in. `AccountActions` records the intent in the provider, calls an optional `onNavigate` (the sheet closes without clearing the intent) and then pushes the sign-in or sign-up route. *(Changed during apply: the earlier text had the app pass `onSignIn` / `onCreateAccount` callbacks into the provider.)* *Alternatives:* sheet in `apps/mobile` (every domain component needing it, such as `ListingDetail`, would need app-level injection); sheet in `@padel/ui` (would need auth copy and intents, breaking "no domain knowledge").

**D15. Session and cache hygiene.** One `SessionProvider` and one `onAuthStateChange` subscription already exist; no change, and a test asserts a single subscription. A small `SessionCacheGuard` component in `apps/mobile` (it composes `@padel/auth` and `@padel/query`) watches `user?.id`; when it changes from one value to another (sign-out, or a different user) it calls `queryClient.clear()` and clears the pending intent. Clearing everything is deliberate: private keys (`['profile', id]`, `['profile-complete', id]`, `['trip', id]`, `['listings', 'mine', id]`) are keyed by user id, which already prevents cross-user reads, but entries would linger in memory, and prefix-based removal needs every future private key registered. Public queries refetch on mount (`staleTime: 0`). Expired sessions arrive as a `null` user through the same listener and take the same path. *Alternative:* clearing inside `SessionProvider` (auth would touch caches it does not own).

**D16. Database access.** Guests use the existing client and publishable key as `anon`; no new client and no service-role key. No new policy is needed (D6). Findings from the migrations: base tables have no `anon` grant; `discover_listings` and `destinations_with_counts` run as owner with explicit columns and no `poster_id`; listing writes need `authenticated` plus `is_email_confirmed()`; there is no draft, cancelled or private status (only `open | closed`), so public means open and current; no joins or messages tables exist. `profiles` select is `using (true)` for any authenticated user, so bio and home city are visible to every signed-in user. Decided boundary: this stays. Anonymous users must remain unable to read `profiles`, and `rls.mjs` keeps asserting it. Poster display name and skill tier are public through `discover_listings` (also decided). Never weaken a policy to serve guests: new guest reads go through views only.

**D17. Accessibility.** `BottomSheet` sets the dialog's accessible name from its title, announces on open, moves focus into the sheet, keeps focus inside (`accessibilityViewIsModal` on iOS, the modal window on Android), restores focus to the trigger on close (caller passes a ref; best effort), has a 48dp minimum dismiss target, and closes on hardware back. Buttons use `accessibilityState` for disabled and busy. Errors stay inline text. Existing tokens are reused.

**D18. Testing strategy.** Unit (packages): intent validation and invalid ids, `useRequireAuth` states, provider set/clear/replace, search filter, repository by id, session-status derivation (exists). Integration (`apps/mobile/src/__tests__/app`, `renderRouter` with the fake Supabase): the guest flows in the specs, resume after sign-in, needs-profile deferral, stale match, cancellation, join needing confirmation, sign-out returning Profile to its guest state, no cross-user cache. Security (`supabase/tests/rls.mjs`, extending its `check` and `asRole` helpers; never reads `.env`): anon reads only the two views with exact columns, anon by-id read, closed and past hidden, anon grants are exactly the two views, anon cannot write or call `is_email_confirmed`, anon cannot read profiles, consents or trips, user A cannot read user B's trip or consents, an unverified user cannot insert a match. Messaging: no tables exist, so nothing to test yet; the test is added with the table. Run `pnpm check-types`, `pnpm lint`, `pnpm test`, `pnpm test:rls`.

## Sequence: Guest to confirmed join

```mermaid
sequenceDiagram
    actor G as Guest
    participant D as Match details (app route)
    participant R as useRequireAuth and intent provider (@padel/auth)
    participant S as AuthPromptSheet
    participant A as Sign-in and sign-up screens
    participant X as AuthIntentResolver (app)
    participant DB as Supabase (RLS)

    G->>D: Open match
    D->>DB: select by id as anon (public view)
    DB-->>D: public columns only
    G->>D: Tap "Join match"
    D->>R: requireAuth(joinMatch, matchId)
    R-->>D: false (Guest); intent stored in memory
    R->>S: open "Join this match"
    alt Dismiss
        G->>S: Dismiss or Android back
        S->>R: clear intent
        Note over D: user stays on the match
    else Create account or Sign in
        G->>S: choose action
        S->>A: navigate (intent kept)
        G->>A: authenticate (may switch sign-in and sign-up)
        A->>DB: Supabase Auth
        DB-->>A: session
        Note over X: waits until app status is ready (profile complete)
        X->>R: read and clear intent (once)
        X->>D: router.replace to the match
        D->>DB: select by id (match may now be unavailable)
        G->>D: Tap "Join match" again (explicit confirmation)
        D->>DB: join (future; RLS enforces rules)
    end
```

## Gaps (spec items that rely on features that do not exist)

- **Draft, cancelled, private matches:** statuses do not exist (`open | closed` only).
- **Messages and conversations:** no tables or UI; messaging security cannot be tested yet.

- **Join match:** no participants table, repository or screen. The sheet and intent are real; for signed-in users "Join match" is visible but disabled (`accessibilityState.disabled`, with an accessible hint that joining is not available yet). No join mutation is wired in this change.
- **Own match:** `poster_id` is not exposed, so details cannot hide "Join" on one's own match.
- **Messages, personal matches, bookings:** nothing exists; the intents exist in the type but only `openMessages` (Matches placeholder) and `openProfile` have a destination. `openPersonalMatches` has no screen yet and maps to the Matches tab.
- **Public player profiles:** none; poster shows name and tier only.
- **Match format** (singles/doubles): no column or field. Omitted; needs a schema and form change in its own change.
- **Available places:** only "spots needed".
- **Location:** no location feature; nothing to avoid but also no "near me".
- **Sign-up verification:** accounts must confirm email before sign-in, so the intent usually waits on an email round trip.

**Re-confirmed during apply (task 1.2):** no code clears or resets the query cache on sign-out or user change (D15); `anon` has `select` on exactly `discover_listings` and `destinations_with_counts` and nothing else, and `is_email_confirmed()` is revoked from `anon` (D16); `profiles` has a `select ... to authenticated using (true)` policy and no `anon` grant. Baseline before any change: `pnpm check-types`, `pnpm lint` (including `turbo boundaries`) and `pnpm test` all pass, 231 tests.

## Risks / Trade-offs

- R1 Intent lost on app kill during email verification → accepted, documented; user lands on Home.
- R2 Race between `(auth)` unmount clearing and the resolver on successful sign-in → clear only when no session, resolver reads the intent when status is `ready`; test both orders.
- R3 `Stack.Protected` removes `(auth)` at sign-in and the router may land on the anchor; `router.replace` to the target after `ready` may cause a double transition → test with `renderRouter`, resolve only once.
- R4 Poster display names and skill tier are public (decided); details adds no new field but makes it easier to reach.
- R5 Client-side search will not scale past a few hundred matches → revisit with server-side filtering.
- R6 Deleting the Home card removes the main conversion nudge → measure sign-ups; the small link and contextual sheet partly replace it.
- R7 Modal-based sheet lacks drag-to-dismiss → acceptable; revisit if design requires.
- R9 Clearing the whole query cache on user change causes one refetch of public data → acceptable.
- R10 Focus restoration on Modal is best effort on Android → verify manually.
- R8 `MODIFIED` deltas reference unarchived specs → archive order must be respected.

## Migration Plan

No data migration. Ship in the task order below; each group leaves the app working. Rollback is a revert of the app and package changes; the database is untouched.

## Decisions confirmed by the product owner

- `profiles` stays readable by every signed-in user; anonymous cannot read it.
- Signed-in users see a disabled "Join match" until a join feature exists; guests get the contextual prompt; after authentication they return to the match and see the disabled button.
- Matches tab stays fully gated, with an `openMessages` intent.
- No Home "Sign in" link.
- Naming is "match" for new code and copy.
- Poster display name and skill tier are public.

## Open Questions

Recommended defaults are stated; none is decided.

- **Draft and published matches.** Default: not in this change; keep `open | closed`. The public view filters `status = 'open'`, so adding `draft` later would not leak by default. If wanted, it is a separate change: status enum migration, create flow with save-draft and publish, "my matches" states, RLS tests.
- **Email-verification round trip.** Default: no intent persistence; intent is in memory only. After sign-up the user verifies by email and signs in manually, landing on Home. Revisit if drop-off matters; persisting would need a short TTL and invalid-intent handling.

Deferrable: sheet animation details, exact secondary button styling, analytics.
