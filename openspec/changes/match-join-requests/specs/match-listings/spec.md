# Spec Delta

## MODIFIED Requirements

### Requirement: Browse open listings
Discover SHALL show open listings that still have a place left and whose end date, or start date if there is no end date, is today or later, ordered by start date soonest first. Each listing SHALL show destination, dates, time if any, venue if any, level wanted, places left, description and the poster's display name and skill tier.

#### Scenario: Default order
- **WHEN** a user opens Discover with no filters
- **THEN** open, current listings with places left are shown soonest first

#### Scenario: Past or closed listings hidden
- **WHEN** a listing's dates have passed or it has been closed
- **THEN** it does not appear in Discover

#### Scenario: Full listings hidden
- **WHEN** every place in a listing has been accepted
- **THEN** it does not appear in Discover, Home or the destination counts

#### Scenario: Places left
- **WHEN** a listing wanted three players and one has been accepted
- **THEN** its card shows two places left

#### Scenario: Empty state
- **WHEN** no listing matches the current filters
- **THEN** Discover shows an empty-state message and a way to clear the filters

### Requirement: Manage own listings
A poster SHALL be able to edit and close their own listings, open Manage match for a listing to handle its requests, and see their listings in a list, and SHALL NOT be able to change anyone else's. A poster SHALL NOT lower players needed below the accepted players.

#### Scenario: Editing
- **WHEN** a poster edits their open listing and saves valid values
- **THEN** Discover shows the updated listing

#### Scenario: Closing
- **WHEN** a poster closes their listing
- **THEN** it disappears from Discover and remains in their own list marked closed

#### Scenario: Another user's listing
- **WHEN** a user attempts to edit or close a listing they did not post
- **THEN** the change is rejected

#### Scenario: Opening a listing to manage requests
- **WHEN** a poster taps "Manage requests" on one of their listings
- **THEN** its Manage match screen opens, including for a full match

#### Scenario: Players needed below accepted
- **WHEN** a poster saves players needed lower than the number of accepted players
- **THEN** the change is rejected with a message
