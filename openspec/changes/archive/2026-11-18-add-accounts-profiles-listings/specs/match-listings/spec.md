# Spec Delta

## Purpose

Lets a player post a match or an open invite for a destination and dates, and lets other players browse and filter those listings to find a game.

## ADDED Requirements

### Requirement: Create a listing
A signed-in user with a verified email and a completed profile SHALL be able to post a listing with a destination, a start date, an optional end date, an optional start time, an optional venue, a level wanted, the number of players needed and a description.

#### Scenario: Fixed match
- **WHEN** a user posts a listing with one date, a start time, a venue and 2 players needed
- **THEN** the listing is created as open and appears in Discover for that destination and date

#### Scenario: Loose invite
- **WHEN** a user posts a listing with a date range, no time and no venue
- **THEN** the listing is created as open and appears in Discover for every date in that range

#### Scenario: Profile incomplete
- **WHEN** a user without a completed profile tries to post
- **THEN** the listing is not created and the user is sent to complete their profile

### Requirement: Listing validation
The system SHALL reject a listing whose destination is missing, whose dates are in the past or out of order, whose players needed is outside 1 to 3, or whose description is longer than 500 characters.

#### Scenario: Players needed out of range
- **WHEN** a user submits a listing needing 0 or 4 players
- **THEN** the listing is rejected with an error on that field

#### Scenario: Dates out of order
- **WHEN** the end date is before the start date, or the start date is before today
- **THEN** the listing is rejected with an error on the date fields

#### Scenario: Description too long
- **WHEN** the description exceeds 500 characters
- **THEN** the listing is rejected with an error on that field

### Requirement: Level wanted
A listing SHALL state a level wanted of Any, Beginner, Intermediate or Advanced, and the sport SHALL be padel.

#### Scenario: Any level
- **WHEN** a listing's level wanted is Any
- **THEN** it matches every level filter in Discover

#### Scenario: Default sport
- **WHEN** a listing is created
- **THEN** its sport is stored as padel without the user choosing it

### Requirement: Browse open listings
Discover SHALL show open listings whose end date, or start date if there is no end date, is today or later, ordered by start date soonest first, and each listing SHALL show destination, dates, time if any, venue if any, level wanted, players needed, description and the poster's display name and skill tier.

#### Scenario: Default order
- **WHEN** a user opens Discover with no filters
- **THEN** open, current listings are shown soonest first

#### Scenario: Past or closed listings hidden
- **WHEN** a listing's dates have passed or it has been closed
- **THEN** it does not appear in Discover

#### Scenario: Empty state
- **WHEN** no listing matches the current filters
- **THEN** Discover shows an empty-state message and a way to clear the filters

### Requirement: Filter listings
Discover SHALL let a user filter by destination, by dates and by level, and a listing SHALL match a date filter if its dates overlap the filter's dates.

#### Scenario: Destination filter
- **WHEN** the user selects Marbella
- **THEN** only listings for Marbella are shown

#### Scenario: Date overlap
- **WHEN** the user filters 15 to 22 Feb and a listing runs 20 to 25 Feb
- **THEN** the listing is shown

#### Scenario: Level filter
- **WHEN** the user filters by Intermediate
- **THEN** listings with level wanted Intermediate or Any are shown

#### Scenario: Clearing filters
- **WHEN** the user clears all filters
- **THEN** every open, current listing is shown

### Requirement: Manage own listings
A poster SHALL be able to edit and close their own listings and see them in a list, and SHALL NOT be able to change anyone else's.

#### Scenario: Editing
- **WHEN** a poster edits their open listing and saves valid values
- **THEN** Discover shows the updated listing

#### Scenario: Closing
- **WHEN** a poster closes their listing
- **THEN** it disappears from Discover and remains in their own list marked closed

#### Scenario: Another user's listing
- **WHEN** a user attempts to edit or close a listing they did not post
- **THEN** the change is rejected

### Requirement: Listings visible only to signed-in users
Listings SHALL be readable only by signed-in users.

#### Scenario: No session
- **WHEN** a request for listings is made with no valid session
- **THEN** no listings are returned
