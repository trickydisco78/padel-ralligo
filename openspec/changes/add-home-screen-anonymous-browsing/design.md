# Design

## Context

Today the app has a single gate: `RootStack` (`apps/mobile/src/components/root-stack.tsx`) shows `(auth)` when `status === 'signedOut'`, `profile-setup` when `needsProfile`, and `(tabs)` when `ready`. Tabs are Discover (`index`), Create, Matches (placeholder), Profile. Discover reads the `discover_listings` view and Home will also use `destinations_with_counts`; both are created `security_invoker = true`, with `revoke ... from anon` and `grant select ... to authenticated`, and the underlying tables (`profiles`, `profile_sports`, `listings`, `destinations`) have RLS policies only `to authenticated` and no grants to `anon`. `useSession` exposes `status`, `user`, `signOut`. The view joins `profiles` and `profile_sports` for poster name and skill tier.

Builds on `add-accounts-profiles-listings` (unarchived, tasks 1.5 and 1.6 still open) and its specs.

## Goals / Non-Goals

**Goals:**
- A visitor opens the app on Home and can browse listings and destinations with no account.
- Anonymous data exposure is limited to the fields in the `anonymous-browsing` spec, enforced in the database, not the UI.
- Signing in from anywhere returns the user to the tabs without a dead end.

**Non-Goals:** public poster profiles, deep links or share URLs, web app, SEO, messaging, personalised Home content, rate limiting beyond Supabase defaults.

## Decisions

- **Expose the two read models to `anon`, keep tables closed.** The views currently use `security_invoker`, so granting `anon` select on the views would also need `anon` select on `profiles`, `profile_sports`, `listings` and `destinations`, which would let anonymous callers read raw rows through the API (full bios, home cities). Instead, recreate `discover_listings` and `destinations_with_counts` without `security_invoker` (they run with the owner's rights, so they bypass table RLS), keep their column lists to the permitted fields, keep the `status = 'open'` and current-date filters in the view itself, and `grant select ... to anon, authenticated`. Tables keep no `anon` grants. Alternatives: (a) add `anon` select policies on the tables with column-level grants: more policies to get wrong and still exposes row existence; (b) `security definer` RPC functions: equivalent protection, but loses PostgREST filtering/ordering the app already uses. Trade-off: owner-rights views are easy to widen by accident, so the RLS test script asserts the exact column set seen by `anon`.
- **Drop `poster_id` from the anon-visible view.** It is not used by Discover today (`apps/mobile/src/data/discover.ts` does not select it) and a stable user id lets visitors correlate posters. Re-add it for signed-in users in the messaging change if needed (via a separate authenticated-only view or column).
- **Routing: signed-out is a valid state inside the tabs.** In `RootStack`, show `(tabs)` when status is `signedOut` or `ready`; show `(auth)` also when `signedOut` (reached by navigation from Home or a prompt, not as the initial route); keep `profile-setup` for `needsProfile`. `unstable_settings`/initial route is `(tabs)`. When sign in succeeds the session provider changes status, the `(auth)` guard turns false, and Expo Router moves the user to `(tabs)` (ready) or `profile-setup` (needsProfile). Confirm the exact `Stack.Protected` redirect behaviour against the Expo Router version in use (the template's `AGENTS.md` asks to check docs before coding), including that a screen removed by a guard falls back sensibly rather than showing a blank screen.
- **Gate by screen, not by hiding tabs.** All five tabs stay visible; `Create`, `Matches` and `Profile` render a shared `SignInPrompt` component when `status === 'signedOut'`. Keeps the tab bar stable and teaches visitors what they get with an account. Alternative: hide those tabs for visitors (cleaner but surprising, tab positions shift on sign in).
- **Home is a new `(tabs)/home` screen; Discover keeps its screen but moves to a new `discover` route.** `index` becomes Home. Discover accepts an optional `destinationId` search param and applies it on mount; the saved-trip prefilter only applies when no param is given (explicit choice wins). Home reuses `useDestinations` and `fetchDiscoverListings` (slice of five) and `ListingCard`.
- **Data on Home:** two parallel loads (destinations with counts, listings), each with its own error state, pull-to-refresh and reload on focus, as Discover does.
- **No change to write paths.** Inserts and updates keep their `to authenticated` policies and the verified-email check; anonymous writes are rejected by the absence of grants.
- **Tests:** component tests for Home (visitor vs signed-in, counts, empty and error states), the prompt in each gated tab, route guard states, Discover param handling; extend `supabase/tests/rls.mjs` with anon cases (views readable with exact columns, tables not readable, writes rejected, closed and past listings hidden).

## Risks / Trade-offs

- [Owner-rights views can leak if columns are added later] → Column list is explicit; RLS test asserts the exact anon column set and fails on additions.
- [Poster display names become public] → Visible only as first-class display names the poster chose; confirm acceptable, reflect in terms/privacy text before public release; poster can close listings to remove them.
- [Scraping of listings without an account] → Accepted for now (data is low sensitivity); Supabase API rate limits apply; revisit with caching or a CDN if abused.
- [Route guard change could trap users on a blank screen or loop] → Cover each status (`loading`, `signedOut`, `needsProfile`, `ready`) with route-guard tests and verify sign in, sign up, sign out and email-unverified flows in the simulator.
- [Overlap with open tasks 1.5 and 1.6 of the accounts change] → Do those first, then add the new migration on top; do not edit the already-pushed migration files (add a new migration instead).
- [Spec deltas reference specs that are not yet in `openspec/specs/`] → Archive the scaffold and accounts changes first.

## Migration Plan

1. Add a new migration that recreates the two views (drop and create, owner rights, explicit columns, no `poster_id`) and grants select to `anon` and `authenticated`; push to the hosted dev project.
2. Ship the app change; behaviour is additive for signed-in users.
3. Rollback: a follow-up migration re-creating the views as `security_invoker` and revoking `anon`; app falls back to the sign-in wall by restoring the guards.

## Open Questions

- Should Matches be gated now, or only once messages exist? Assumed gated now so the tab behaves consistently.
