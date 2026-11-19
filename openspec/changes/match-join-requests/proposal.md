# Proposal

## Why

A match can be listed and opened, but nobody can actually take a place in it: "Join match" is disabled for signed-in members and only prompts guests to sign in. That is the point where the product stops being useful. Members need to ask for a place, organisers need to choose who plays, and everyone needs to see who is in.

## What Changes

- A signed-in member can **request to join** a match from its details screen. The organiser sees the requests on their own match and **accepts or declines** each one. The requester sees their own status: **Pending**, **Accepted** ("You're in!") or **Declined**.
- A member can **withdraw** a pending request, or an accepted one while the match is still to come (this frees the place). After a withdrawal they may ask again; after a decline they may not.
- **Capacity is enforced by the database.** "Players needed" is how many others the organiser wants (1 to 3). A request cannot be accepted once every place is taken, even if two accept taps race. A match with no places left is **full**: it takes no new requests and no longer appears in Discover, Home or the destination counts, but its details still open for the people involved and for anyone with the link.
- **Who sees what.** Signed-in members see the organiser and the accepted players (first name with last initial, and skill tier) on the match, with "N of M players". The organiser also sees the people who have requested. Other members never see who requested. Guests still see public fields only, with no people list.
- **Rules:** nobody can request their own match, or a match that is closed, past or full, or twice. A member needs a verified email to request, as they do to post.
- **The screens follow the supplied designs** (canvas <https://claude.ai/artifact/SfUSwPjN1KHwUYk7c7RUgp>, artboards 1 to 8) and the Padel Pink design system:
  - **Match details:** a pink hero with the padel court motif and a white sheet over about two thirds of the screen, with a round back button and a **Share** button over the hero (the phone's share sheet with a link to the match). Below: date tile, title, place and time, level, the organiser, "About this match" and "Players N of M" with a progress bar. A primary **"Request to join"** sits at the bottom ("Join match" is replaced).
  - **States:** "Request sent!" confirmation sheet; **Pending** banner with "Withdraw request"; **Accepted** banner "You're in!" with "View match details"; **Declined** banner with "Find similar matches" (opens Discover for the same place); a **Withdraw request?** confirm sheet.
  - **Organiser:** a **Manage match** screen with **Players** and **Requests** tabs, a review sheet (Accept request, Decline request) and **Close match**. The organiser's match shows "Manage match" instead of "Request to join".
- The organiser can reach Manage match from **My listings**.
- All new copy goes in the locale JSON.
- **Out of scope** (later changes): notifications (nobody is told about a request or a decision, so no copy promises one; people see changes when they open the match), messaging or chat ("Open match chat" on the Accepted design is left out), a message with a request, Favourite (saved matches) and the heart button, tapping the organiser to open a player profile, a "My matches" screen and the Notifications screen from the canvas, the organiser removing an accepted player, level matching (the level wanted is shown but not enforced), numeric levels and the "Doubles" tag (the app has tiers), and live updates.

## Capabilities

### New Capabilities
- `join-requests`: asking for a place, withdrawing, the organiser's decision, capacity and the full state, who can see the people on a match, and database-enforced rules.

### Modified Capabilities
- `match-details`: the "Join match" action becomes a real request flow, the screen gets the hero, share, request states and confirmations, and participants become visible to signed-in members.
- `match-listings`: Discover shows places left and hides full matches; the organiser can open Manage match from My listings.
- `public-data-security`: join requests are private to the people involved and are written only through checked server functions, never by direct table access.

## Impact

- **Database:** one migration adds `join_requests` (row-level security, owner read only, no direct write grants) and four `SECURITY DEFINER` functions for signed-in callers: `request_to_join`, `withdraw_join_request`, `decide_join_request` and `match_people`. It also adds `spots_left` to `discover_listings`, makes the destination counts count only matches with places left, and adds a trigger that stops an organiser lowering players needed below the accepted count. `supabase/tests/rls.mjs` and `supabase/README.md` gain the new checks and notes.
- **Code:**
  - `@padel/listings`: join-request types, repository (through the functions), hooks and the match people and join action components; `useDiscoverListings` hides full matches; error codes map to copy.
  - `@padel/players`: unchanged. `PlayerRow` is already there; the app screen composes it, because `listings` and `players` may not depend on each other.
  - `@padel/auth`: the `joinMatch` intent and copy are reworded; the return path is unchanged and still makes no request.
  - `@padel/ui`: the bottom sheet gets the design's centred confirmation layout (icon disc, title, message, actions).
  - `apps/mobile`: the match screen composes hero, details, people and the action; a new Manage match route; My listings gets a "Manage requests" action.
  - `@padel/supabase`: generated types regenerated after the migration.
- **Docs:** `docs/architecture.md` (new tables and functions, who sees what).
- **Risks:** a race on the last place (handled by locking the match row); Discover hiding full matches by a client filter on the read model (not a security boundary, unlike who sees people, which is enforced in the functions); no notifications, so a request can sit unseen.
