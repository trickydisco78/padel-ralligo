# Proposal

## Why

A profile can hold only one saved trip, and nothing uses it except pre-filtering match search. The point of the product is meeting people who are in the same place at the same time: "I'm in Málaga 14 to 21 June, who else is?". Members need to keep several trips on their profile, see for each one how many players overlap, and see who they are. Guests and members also need a clearer Explore view that needs no trip, as in the supplied designs.

## What Changes

- A member can save **several trips** on their profile (destination, start date, end date), edit and delete them, and choose per trip whether other members may see it. New trips are **hidden by default**.
- Discover gets a top switch for members: **My trips | Explore places**. Guests only have Explore places.
- **My trips** shows a swipeable row of the member's upcoming trips. Each card shows destination, country, dates and "N days · M players overlap". One trip is selected (the soonest, or the one under way). Under it:
  - **Players** who overlap that trip: listed players who have also shared a trip to the same destination on overlapping dates, with the number of overlapping days;
  - **Open matches** at that destination during the trip;
  - the **This week** and **My level** chips, and a name search over the overlapping players;
  - the notice "Showing matches for Málaga, Jun 14–21. Play times aren't confirmed yet."
- **Explore places** is the existing Players and Open matches directory, restyled with the design's wording: for guests the heading "Find your next game.", "Browse player cards by location. No trip required." and "Public profile only: area and level. Trip dates stay private."; for members the same without a trip. Guest cards show **Sign in** instead of Connect.
- Trip overlap is calculated on the server, counting **days inclusively** (14 to 21 June is 8 days), and exposes only trips their owners chose to share.
- The old behaviour where a saved trip pre-filters the match list is replaced by My trips.
- All new copy goes in the locale JSON.
- **Out of scope** (next changes): the Women and Nearby chips and the gender and coordinates data they need; format, style and play-time preferences on cards ("Mixed doubles", "Plays most days", "After-work games"); Best fit ranking; connection requests; notifications; numeric player levels (tiers are kept, so the mock's "Level 4.5" is shown as the tier); a Past trips archive screen; dropping the old `profile_trips` table (kept, unused, until its removal is approved).
- **Prerequisite:** the player-directory change is archived first (done on `chore/archive-player-directory`), because this change modifies its requirements.

## Capabilities

### New Capabilities
- `trips`: a member's saved trips on their profile, their limits, validation, sharing setting, editing, deletion and past trips.
- `trip-discovery`: the My trips view on Discover, the saved-trips row with overlap counts, overlapping players, open matches for a trip, chips, search and notice.

### Modified Capabilities
- `player-profiles`: the single "Saved current trip" requirement is removed and replaced by `trips` and `trip-discovery`.
- `player-directory`: Explore places wording and layout, a Sign in button for guests, and the sport on the card.
- `public-data-security`: trips are readable only by their owner, and overlap results expose only shared trips of listed players, to signed-in callers only.

## Impact

- **Database:** one migration adds `trips` (owner-only RLS, a limit of 10 per member), copies existing `profile_trips` rows in as hidden trips, and adds two `SECURITY DEFINER` functions for signed-in callers: `my_trips_overview` and `find_overlapping_players`. `profile_trips` is left in place.
- **Code:**
  - New package `@padel/trips`: trip domain, repository, hooks, the Profile trips section, trip cards and the saved-trips row.
  - `@padel/profiles`: the single-trip code is removed.
  - `@padel/players`: overlapping-players hook and an overlap line on the card.
  - `@padel/ui`: optional icon on the segmented control and a notice banner.
  - `apps/mobile`: Discover modes and composition, Profile screen uses the new trips section.
- **Tests:** database checks (owner-only, sharing, overlap days, caps, ownership of the trip id), domain, component and route tests.
- **Dependencies:** none new.
