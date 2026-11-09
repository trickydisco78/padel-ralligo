# Proposal

## Why

The app opens straight to a sign-in wall, so a visitor cannot see whether there are any games before giving an email address. For a product that depends on listings existing, that loses people at the door. A landing Home screen and read-only anonymous browsing let someone see real games and destinations first, and sign in only for things that need an identity (posting, messages, their profile).

## What Changes

- Add a **Home** tab as the first tab and the screen the app opens on: a welcome with a sign-in / create-account call to action for visitors, destination shortcuts showing open-game counts, and a short list of upcoming games. Discover stays as the full browse and filter tab.
- Allow **anonymous browsing**: a signed-out visitor goes to Home instead of the sign-in screen and can browse Home, Discover, destinations and open listings (read-only).
- Anonymous visitors see only what the Discover read models already expose: destination, dates, venue, level, spots, description, and the poster's display name and skill tier. No profiles, email, trip or poster identifier.
- **Gate account features behind sign in**: Create, Matches (future messages) and Profile (view and edit) show a "Sign in to continue" prompt to visitors; sign in and sign up are reachable from Home and from those prompts.
- Open the database to the `anon` role for the two Discover read models only. Base tables (`profiles`, `listings`, ...) stay closed to anonymous requests, so there is no way to read raw profile rows without a session.
- **BREAKING**: tab order and count change (Home, Discover, Create, Matches, Profile); the signed-out route no longer forces the auth screens; the RLS rule "anonymous requests get nothing" is relaxed for listings and destinations (via the read models only).
- Out of scope: messaging itself, public poster profiles, share links or deep links to a listing, web app, SEO, analytics, personalised recommendations on Home.

## Capabilities

### New Capabilities
- `home-screen`: The landing tab: welcome and account call to action, destination shortcuts with open counts, upcoming games.
- `anonymous-browsing`: What a signed-out visitor can see and do, what is gated behind sign in, and the data-exposure limits for anonymous access.

### Modified Capabilities
- `app-shell`: Launch destination and tab set change (Home added and first); signed-out users enter the tabs rather than the auth screens.
- `match-listings`: "Listings visible only to signed-in users" changes to allow read-only anonymous access to open, current listings through the Discover read model.
- `destinations`: Destinations and their open counts become readable without a session.

## Impact

- Code: `apps/mobile/src/components/root-stack.tsx` (route guards), `app-tabs.tsx`, new `(tabs)/home.tsx` (or reshaped `index`), a sign-in prompt component, gating of `create`, `matches`, `profile`, a destination param on Discover, `auth/session.tsx` (signed-out remains a valid state inside the tabs), and sign-in/sign-up navigation back to the tabs.
- Database: a new migration changing grants and access on `discover_listings` and `destinations_with_counts`; `supabase/tests/rls.mjs` gains anonymous cases.
- Prerequisite: builds on `add-accounts-profiles-listings` (tabs, views, RLS) and its unarchived specs. Archive order: scaffold, then accounts, then this change. Open tasks 1.5 and 1.6 of that change touch the same views and RLS tests; coordinate so they are not done twice.
- Privacy: anonymous access is read-only and limited to columns already designed to be shown to other players; poster display names become visible to the public. Confirm that is acceptable before release (terms/privacy text should say so).
- Assumptions: the Home "upcoming games" list shows the next five open listings, soonest first; Matches is gated now because it will hold messages, though it is a placeholder today.
