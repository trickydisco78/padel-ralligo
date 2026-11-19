# Spec Delta

## MODIFIED Requirements

### Requirement: Details expose public fields only
Match details SHALL NOT show or fetch email addresses, contact details, user identifiers or messages. For a Guest, details SHALL NOT show any participant list, and the poster SHALL appear only by display name and skill tier, as in Discover. Signed-in members see the people on a match as described by the `join-requests` capability.

#### Scenario: Anonymous data request
- **WHEN** a request with no session reads a match by id
- **THEN** only the Discover read-model columns are returned, and a closed, past or unknown id returns nothing

#### Scenario: Guest sees no people
- **WHEN** a Guest opens a match
- **THEN** no organiser row, player row or request is shown, and no request for people is made

#### Scenario: No contact data for members
- **WHEN** a signed-in member opens a match
- **THEN** no email address, contact detail or user identifier is shown or fetched

## ADDED Requirements

### Requirement: Requesting a place requires an account
The details screen SHALL offer a "Request to join" action to anyone who is not the organiser of the match. For a Guest it SHALL open the contextual prompt for the join intent for that match, and nothing is requested.

#### Scenario: Guest taps Request to join
- **WHEN** a Guest taps "Request to join"
- **THEN** the contextual sheet is shown and nothing is requested

#### Scenario: Member taps Request to join
- **WHEN** a signed-in member taps "Request to join" on a match with places left
- **THEN** a pending request is made, as in the `join-requests` capability

#### Scenario: Return after authentication
- **WHEN** a Guest taps "Request to join", authenticates and is returned to the match
- **THEN** they see an enabled "Request to join" button and no request has been made

#### Scenario: Organiser's own match
- **WHEN** the organiser opens their own match
- **THEN** no "Request to join" action is shown

### Requirement: Players progress and own status
The details screen SHALL show how many players the match has out of how many it wants, counting the organiser, and SHALL show a signed-in member's own request status as Pending, Accepted or Declined with an icon and text, never colour alone.

#### Scenario: Progress
- **WHEN** a match wants 3 players besides the organiser and one is accepted
- **THEN** it shows "2 of 4 players"

#### Scenario: Own status
- **WHEN** a member with a pending request opens the match
- **THEN** a pending banner with an icon and text is shown, with a "Withdraw request" action

#### Scenario: Accepted
- **WHEN** a member whose request was accepted opens the match
- **THEN** a success banner reads "You're in!" and a "Withdraw request" action is offered while the match is still to come, with no chat action

#### Scenario: Declined
- **WHEN** a member whose request was declined opens the match
- **THEN** a declined banner is shown and no "Request to join" action is offered

### Requirement: Hero and share
The details screen SHALL show a pink hero with the padel court motif behind a white sheet that covers about two thirds of the screen, with a round back button and a Share button over the hero. Share SHALL open the phone's share sheet with the match's destination, date and a link to the match, and SHALL work for Guests.

#### Scenario: Back from details
- **WHEN** the user taps the back button
- **THEN** they return to the screen they came from, or to Discover if there is none

#### Scenario: Share
- **WHEN** a user taps Share
- **THEN** the phone's share sheet opens with the destination, the date and a link to this match

#### Scenario: No favourite
- **WHEN** the details screen is shown
- **THEN** there is no favourite button, because saving matches is not available

### Requirement: Organiser sees Manage match
When the viewer is the organiser, the details screen SHALL replace "Request to join" with "Manage match", showing how many requests are waiting, and SHALL open the Manage match screen.

#### Scenario: Waiting requests
- **WHEN** the organiser opens their match and two requests are pending
- **THEN** the action reads "Manage match" with the count of two requests

### Requirement: Declined member can look for similar matches
A member whose request was declined SHALL be offered "Find similar matches", which opens Discover filtered to the same destination, and "View match details" SHALL keep showing the match.

#### Scenario: Find similar matches
- **WHEN** a declined member taps "Find similar matches"
- **THEN** Discover opens filtered to that match's destination

## REMOVED Requirements

### Requirement: Joining requires an account
**Reason**: Replaced by "Requesting a place requires an account". The old requirement described a disabled "Join match" button and forbade any join record, which no longer applies now that members can request a place.
**Migration**: The guest behaviour (the contextual sheet for the join intent, nothing requested) is kept in the new requirement. The signed-in behaviour is now defined by the `join-requests` capability.
