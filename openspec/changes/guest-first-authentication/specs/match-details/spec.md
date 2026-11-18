# Spec Delta

## Purpose

Lets anyone open a match from Home or Discover and see its public information, without exposing private participant or contact information.

## ADDED Requirements

### Requirement: Public match details
Selecting a match on Home or Discover SHALL open a details screen, for Guests and Authenticated users alike. It SHALL show the destination, venue when set, date or date range, start time when set, level, spots needed and description when set, using only stored data.

#### Scenario: Guest opens a match
- **WHEN** a Guest selects a match card
- **THEN** its details are shown with no sign-in prompt, and Android back returns to the screen it was opened from

#### Scenario: No invented data
- **WHEN** a field such as venue, time or description is empty
- **THEN** it is omitted rather than replaced with placeholder content

### Requirement: Details expose public fields only
Match details SHALL NOT show or fetch email addresses, contact details, user identifiers, participant lists or messages. The poster SHALL appear only by display name and skill tier, as in Discover.

#### Scenario: Anonymous data request
- **WHEN** a request with no session reads a match by id
- **THEN** only the Discover read-model columns are returned, and a closed, past or unknown id returns nothing

### Requirement: Unavailable matches
If the match is closed, has passed, does not exist or cannot be loaded, the screen SHALL say so and offer a way back to Discover, without crashing.

#### Scenario: Closed match opened from a stale list
- **WHEN** a user opens a match that has since closed
- **THEN** "This match is no longer available" is shown with a "Back to Discover" action

#### Scenario: Load failure
- **WHEN** the request fails
- **THEN** a retry message is shown

### Requirement: Joining requires an account
The details screen SHALL offer a "Join match" action. For a Guest it SHALL open the contextual prompt for the join intent for that match.

#### Scenario: Guest taps Join match
- **WHEN** a Guest taps "Join match"
- **THEN** the contextual sheet is shown and nothing is joined

#### Scenario: Authenticated user, joining not yet available
- **WHEN** an Authenticated user views details before a join feature exists
- **THEN** the "Join match" button is visible, has `accessibilityState.disabled` set, carries an accessible hint that joining is not available yet, and does nothing

#### Scenario: Return after authentication
- **WHEN** a Guest taps "Join match", authenticates and is returned to the match
- **THEN** they see the disabled "Join match" button and no join has been attempted

#### Scenario: No join mutation
- **WHEN** this change is complete
- **THEN** no code path writes a join or participation record
