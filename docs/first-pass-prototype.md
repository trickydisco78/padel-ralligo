# First-pass prototype: "Ralligo" (Lovable)

Source: https://global-court-finder.lovable.app/ (a Lovable-generated prototype). Treat it as a design reference for what we are building, not as a spec. Notes below come from a summary of the landing page only; the Create, Inbox, Profile and footer screens are named in the navigation but their content was not visible, so anything about them is unknown.

## What it is

"Find players for your holiday" / "Play when you're away". Travellers find and organise games at their destination, filtered by their trip dates.

## Navigation

Discover, Create (match), Inbox (messages), Profile. Footer: Privacy, Safety, Support.

## Discover screen

- Hero copy and a "Your current trip" selector (destination and date range). Sample: Tenerife, 15-22 Feb 2026.
- Popular destinations (Tenerife, The Algarve, Marbella, Barcelona), each with player and game counts, country and a tagline.
- Match listings with filters:
  - Sport: All, Padel, Tennis, Pickleball
  - Level: All levels, Beginner, Intermediate, Advanced
  - Format: All, Singles, Doubles
  - Timing: Any, or Trip dates only
- Calls to action on a listing: "Organise a game", "Message".

## Match listing fields

Sport, format (Singles, Doubles, Any), skill level, timing badge (e.g. "Within trip"), visibility (Public), date and time with timezone, location (city, country, venue), players needed ("Needs 2 player(s)"), free-text description, hashtags (#friendly, #social), organiser rating and verified badge.

## Profile fields visible

Display name or initial avatar, numeric rating, verified badge.

## Differences from what is built so far

| Prototype | Current scaffold |
| --- | --- |
| Unit of discovery is a **match listing** posted by an organiser | Unit of discovery is a **player** |
| Multi-sport: padel, tennis, pickleball | Padel only, one skill level per player |
| Trip context (destination + dates) drives results | No trip or date concept |
| Organiser posts a game with players needed, venue and time | No matches yet (Matches tab is a placeholder) |
| Message from a listing | No messaging |

## Open questions this raises (not yet decided)

- Is the primary object a match listing, a player profile, or both? The product summary says player profiles, skill profiles and messaging; the prototype leads with match listings.
- Is the app multi-sport from the start, or padel first?
- Do trips exist as their own object (see section 3 of `product-vision.md`), or only as a date filter on listings?
