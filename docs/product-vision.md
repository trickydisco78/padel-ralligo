# Product vision: player and court finder

Reference for what we are trying to build. This is a feature inventory, not a committed scope: each area becomes its own OpenSpec change when we pick it up. Current implementation status is tracked in `openspec/`, not here. A first-pass UI prototype is summarised in `first-pass-prototype.md`; the visual direction is in `design-reference.md`.

**Core idea:** an app for finding players to play with, whether you are on holiday or just at home. It has three pillars:

- **Player profiles**: who someone is, where they are based, when they are free.
- **Skill profiles**: how well they play, so matches are well balanced.
- **Messaging**: players can contact each other directly to arrange a game.

Trip posting (travelling to a city on given dates) is the mechanic that sets this apart from a generic profile app. The sections below are the detailed inventory behind those pillars.

## 1. Auth & registration

- Email/password and social login (Google, Apple)
- Email verification, password reset
- Onboarding: sport(s) played, skill level, home location
- Terms acceptance and age gate (liability around in-person meetups)

## 2. User profiles

- Name, photo(s), bio
- Sport(s) and skill level per sport (self-rated or a rating system such as DUPR/UTPR)
- Home city and "currently travelling to" field(s) with date ranges
- Availability (days/times)
- Verification badges (optional: phone/ID verification, since users meet strangers)
- Reviews/ratings from past matches (trust signal)

## 3. Trip / destination posting

- "I'm travelling to [city] from [date] to [date]" posts
- Editable and deletable trip entries
- Notifications when someone matches your trip window/location

## 4. Search & discovery

- Search by destination city and date range
- Filter by sport, skill level, gender (if relevant), availability
- Map view of nearby players and courts
- "Players near me right now" vs "players travelling to X later"

## 5. Court / venue data

- Court database: location, sport type, indoor/outdoor, booking link if available
- Own curated DB or a third-party API (Google Places, or sport-specific APIs)
- Map integration (Mapbox or Google Maps)

## 6. Matching / connection requests

- "Request to play" button on a profile
- Accept/decline flow
- Optional: swipe-style or list-style discovery

## 7. Messaging (inbox)

- 1:1 chat tied to a match/connection
- Real-time (websockets) or polling
- Push/email notifications for new messages
- Basic safety: block/report user

## 8. Notifications

- New match nearby, new message, trip reminders
- Email and push (web push, or native on mobile)

## 9. Trust & safety

- Report/block
- Moderation queue for reported profiles/messages
- Optional identity verification

## 10. Backend / infrastructure

- Database (users, trips, courts, matches, messages)
- Geolocation / geo-search (PostGIS or similar for SQL, or geohash indexing)
- File storage for photos
- Admin panel for moderation and court-data management
