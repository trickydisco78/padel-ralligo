# Tasks

Dependencies: 1 before 2; 2 and 3 before 5; 4 before 5; 5 before 6. Groups 3 and 4 can run in parallel. 7 can start after 1. 8 last.

## 1. Audit and baseline

- [x] 1.1 Run `pnpm check-types`, `pnpm lint`, `pnpm test` on a clean tree and record the baseline; verify all pass before any change
- [x] 1.2 Re-confirm the findings in design D15 and D16 (no cache clear, anon grants, `profiles` readability) against the code and `supabase/migrations`; verify with a short note appended to the design's Gaps section

## 2. UI primitives (`@padel/ui`)

- [x] 2.1 Add `BottomSheet` (RN `Modal`, accessible title, announce and focus on open, backdrop dismiss, Android back, 48dp dismiss target, optional focus-return ref) and a secondary button variant using existing tokens; verify with component tests for open, dismiss via backdrop and `onRequestClose`, labels, and no domain import
- [x] 2.2 Export from the entry point; verify `packages/eslint-config/tests/package-exports.test.mjs` passes

## 3. Authentication intent and prompt (`@padel/auth`)

- [x] 3.1 Add the `AuthIntent` union and validation (known type, well-formed match id) in `domain/`; verify unit tests including invalid and unknown intents
- [x] 3.2 Add the in-memory intent provider (router-free, no callback props; `AccountActions` navigates) and `useAuthIntent` (set, clear, replace, clear on sign-out); verify tests
- [x] 3.3 Add `useRequireAuth` returning `(intent) => boolean` (loading neither proceeds nor prompts); verify guest, signed-in and loading cases
- [x] 3.4 Add `AuthPromptSheet` with per-intent copy (including "Join this match"), built on `BottomSheet`; verify copy, the three actions, and that dismiss clears the intent
- [x] 3.5 Give `AccountActions` an optional intent and two buttons, and `SignInPrompt` optional `title` and `intent`; sign-in and sign-up link to each other without stacking; verify the intent survives switching
- [x] 3.6 Export the new API; verify lint and `turbo boundaries` pass and `auth` imports no other domain
- [x] 3.7 Update `docs/architecture.md` for the new auth responsibilities and sheet placement; verify it matches the code

## 4. Public matches (`@padel/listings`)

- [x] 4.1 Add `getDiscoverable(id)` to the repository and Supabase implementation (reads `discover_listings`, null when absent); verify repository tests on the fake client
- [x] 4.2 Add `useDiscoverListing(id)` and a pure search filter (destination, country, venue); verify hook and unit tests
- [x] 4.3 Add `ListingDetail` (public fields, omits empty ones, unavailable and error states) and optional `onPress` on `ListingCard`; verify component tests for closed, missing and failed

## 5. App composition (`apps/mobile`)

- [x] 5.1 Wire `AuthIntentProvider` inside `SessionProvider` with router callbacks; add `SessionCacheGuard` (clear the query cache and intent when the user id changes); verify tests: user B never sees user A's cached profile, sign-out returns Profile to guest state, one auth listener
- [x] 5.2 Add root-level `match/[id]` route guarded like `(tabs)`, with "Join match" via `useRequireAuth` and a visible disabled button (`accessibilityState.disabled`, accessible hint that joining is not available) when signed in, with no join mutation wired; verify route tests (guest sees sheet, nothing joined, dismiss stays on the match, signed-in sees disabled button, return after auth shows it disabled)
- [x] 5.3 Add the intent-to-route map and `AuthIntentResolver` (once, on `ready`, clear before navigating); verify route tests for each intent, needs-profile deferral, stale match, no double resume, and that join needs a second explicit tap
- [x] 5.4 Clear a pending intent when the user leaves the auth screens while signed out (root-level component, not the `(auth)` layout); verify "Continue browsing" and back both clear it, and Android back returns to the match, then Discover with filters intact

## 6. Guest UI

- [x] 6.1 Home: remove the "Join in" card, add the search entry only (no sign-in link), make cards open details; verify `home.test.tsx` (heading and description kept, no card, no sign-in entry for guests)
- [x] 6.2 Discover: add text search, cards open details, Home search entry focuses the field; verify it combines with existing filters
- [x] 6.3 Create, Matches, Profile: pass intents to `SignInPrompt`; Profile uses "Your padel profile", the new description and two actions; verify `gated-tabs.test.tsx` and `profile-tab.test.tsx`
- [x] 6.4 Verify `route-guard.test.tsx` still covers loading shows nothing, guest on tabs, ready on tabs, and no Guest flash before a restored session

## 7. Supabase review and security tests

- [ ] 7.1 Extend `supabase/tests/rls.mjs` (anon cannot read `profiles`, a signed-in user can read another profile): anon by-id read returns exactly the permitted columns; closed and past ids hidden; anon grants are exactly the two views; anon cannot write or execute `is_email_confirmed`; anon cannot read profiles, consents or trips; user A cannot read B's trip or consents; unverified user cannot insert; run `pnpm test:rls`
- [x] 7.2 Record the decided `profiles` boundary and public poster name and skill tier in `supabase/README.md`; drafts, if ever wanted, are a separate change with a migration; verify no migration is needed here

## 8. Validation

- [ ] 8.1 Run `pnpm check-types`, `pnpm lint`, `pnpm test`, `pnpm test:rls`; verify against the baseline from 1.1
- [ ] 8.2 Manually verify on iOS and Android against the dev project: guest launch with no location prompt, details from Home and Discover, Join sheet then sign in returns to the match and needs a second tap, sign up with verification, profile setup then resume, dismiss, Android back at each step, screen reader announces the sheet, sign-out then another user signing in shows no earlier data

## Workflow follow-up

- Archive earlier unarchived changes first (scaffold, accounts, home-screen), then this one.
- Follow-up change needed: participants table, join rules and RLS in `@padel/listings`.
