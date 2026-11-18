# Proposal

## Why

The app is already partly guest-first (signed-out users can browse Home and Discover; account tabs show a prompt), but the guest experience is incomplete: Home leads with a large "Join in" registration card, a match cannot be opened (there is no match details screen), a protected action sends the user to a full-screen prompt with no memory of what they were doing, and after signing in they land on Home rather than where they started. This change finishes the model: browse and read everything public, ask for an account only at the moment an action needs an identity, and carry the user back to that action.

## Current behaviour vs. desired

| Area | Today (verified in code) | Desired |
| --- | --- | --- |
| Startup | `RootStack` shows a spinner while `useSession` is `loading`, then mounts tabs for `signedOut` or `ready`. No redirect to sign-in. No anonymous Supabase users (`enable_anonymous_sign_ins = false`, no `signInAnonymously`). No location-permission code. | Unchanged. Documented as the Guest / Authenticated / Initialising contract. |
| Home | Heading and description as requested, plus a "Join in" `Card` with `AccountActions` for signed-out users. Destinations and five upcoming games. No search entry. Match cards are not tappable. | Card removed, nothing in its place except the search entry (no Home sign-in link). Cards open match details. |
| Discover | Destination chips, From/To dates, level chips. No free-text search. Cards not tappable. | Adds a destination/place text search. Cards open match details. |
| Match details | Does not exist. | Public screen, public fields only. |
| Create | Full-screen `SignInPrompt` when signed out; `ListingForm` otherwise. | Same pattern, via the shared auth-entry component, which now records the intent. |
| Matches | Placeholder; full-screen `SignInPrompt` when signed out. Contains nothing public. | Stays gated (design D8). |
| Profile | `SignInPrompt` "Sign in to continue", a Sign in button and a "Create an account" text link. | "Your padel profile" heading and new copy, two clear actions. |
| After sign-in | `(auth)` is `Stack.Protected` for `signedOut`; on sign-in it unmounts and the router falls back to the anchor (Home). Intent is lost. | Return to the originating screen. Join returns to the match; the user confirms. |
| Protected action on a public screen | Not possible yet (no such action exists). | Contextual bottom sheet with Create account / Sign in / Dismiss. |

## What Changes

- Add a typed `AuthIntent` (join match, create match, open messages, open personal matches, open profile), held in memory by an intent provider in `@padel/auth`, plus a `useRequireAuth` hook that reports whether the user may proceed or opens the contextual sheet.
- Add a generic `BottomSheet` (and a secondary button variant) to `@padel/ui`, and an `AuthPromptSheet` in `@padel/auth` built on it.
- Make `AccountActions` and `SignInPrompt` the single auth entry UI. They accept an optional intent and title. The Home card is deleted.
- Add a public match details screen, `useDiscoverListing(id)` and a `getDiscoverable(id)` repository method in `@padel/listings`, reading the existing `discover_listings` view. Cards become tappable through an `onPress` prop.
- Resume the intent after authentication in `apps/mobile` (which owns routes), once the app status is `ready`.
- Home: remove the "Join in" card and add a search entry. No Home sign-in link. Discover: add a text search. Profile guest copy and actions updated.
- No database migration is required for public details (design D6). RLS test cases are added.
- **BREAKING (spec-level only):** the "Account call to action for visitors" requirement of `home-screen` is removed; the Profile guest heading changes.
- Match details shows a disabled "Join match" button for signed-in users. No join mutation is wired in this change.
- Naming: new code and copy use "match" (route `/match/[id]`, intent `joinMatch`, "Join match", "Join this match"). The package remains `@padel/listings` and the DB uses "listings".
- Out of scope: the join, messaging and participation features themselves, public player profiles, "match format", social login, deep-link/share URLs, persisting intent across app restarts.

## Security considerations

- Guests use the existing client with the publishable key and the `anon` role. No service-role or secret key reaches the app (verified: client reads only `EXPO_PUBLIC_SUPABASE_URL` and the publishable key).
- Public data stays limited to the `discover_listings` and `destinations_with_counts` views (explicit column projections). Base tables remain closed to `anon`.
- The schema has only `open | closed` listing statuses: no draft, cancelled or private state exists, so "explicitly eligible for public visibility" means open and current today. The public view filters `status = 'open'`, so a future `draft` status would not leak by default. Drafts are an open question, recommended out of scope.
- Decided: `profiles` stays readable by every signed-in user (bio and home city included). Anonymous users must not read it; security tests assert that.
- Decided: poster display names and skill tier are public, as in the current `discover_listings` view.
- Joining and messaging have no tables yet. When added they must ship with RLS and authenticated-only grants in the same change.

## Capabilities

### New Capabilities
- `contextual-authentication`: authentication intent, the contextual prompt for protected actions, resuming after sign-in, cancellation and stale intent.
- `match-details`: public match details screen and its data-exposure limits.
- `session-lifecycle`: session restore, sign-in and sign-out reactions, expiry, and clearing private client state so one user never sees another's cached data.
- `public-data-security`: what the unauthenticated database role may read, that mutations and private data need an authenticated and authorised user, and that authorisation is enforced in the database.
- `guest-access`: the Guest / Authenticated / Initialising states and the per-action access rules (authentication does not imply authorisation).

### Modified Capabilities
These live in unarchived changes (`openspec/specs/` is empty today), so the deltas follow the house style of `add-home-screen-anonymous-browsing`. Archive order: scaffold, accounts, home-screen, then this change.
- `home-screen`: removes the registration card; adds search entry; cards open details.
- `anonymous-browsing`: Profile guest copy and actions; return to the originating tab; public single-match read.
- `app-shell`: details route is public; no flicker on restore; Android back through authentication.

## Scope notes: deliberate follow-up

Existing UI strings that say "game(s)" are not rewritten here: Home "Upcoming games", "N open games" and "See all games", Discover "No games match your filters", the load-failure messages, the Create screen "Post a game" and the "Find your next padel game" heading (which must stay as is). A follow-up change can align them to "match(es)".

## Impact

- Code: `apps/mobile/src/app` (new `match/[id].tsx`; edits to Home, Discover, Create, Matches, Profile, `(auth)/_layout.tsx`), `components/root-stack.tsx`, a new intent-resolver component; `packages/auth` (intent, sheet, prompt changes), `packages/ui` (`BottomSheet`, secondary button), `packages/listings` (repository method, hook, details component, card `onPress`).
- Docs: `docs/architecture.md` (auth owns intent and sheet; the app owns intent-to-route mapping).
- Database: no migration; `supabase/tests/rls.mjs` gains cases.
- Dependencies: none new (React Native `Modal`).
- Packages: no new package. The brief's "Matches" is `@padel/listings` and "Players" is `@padel/profiles` (confirmed: listings own match queries, repository, DTO-like `DiscoverListing`, form and card; profiles own profile, skill tier and trip). A new `matches` or `players` package is not justified: it would duplicate `listings` and `profiles`, and the join rules have no code yet.
- Session: `queryClient` is never cleared today (verified: no `clear` or `removeQueries` anywhere); this change adds clearing on user change.
- Missing features this change depends on or assumes: see design "Gaps".
