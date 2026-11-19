# Spec Delta

## Purpose

Lets signed-in members ask for a place in a match and organisers choose who plays, with capacity and privacy enforced by the database rather than by the screens.

## ADDED Requirements

### Requirement: Request to join
A signed-in member with a verified email SHALL be able to request a place in an open, current match from its details. The request SHALL start as pending and SHALL be recorded for that member and match only.

#### Scenario: Member requests a place
- **WHEN** a member taps "Request to join" on an open match with places left
- **THEN** a pending request is recorded and the screen shows "Pending" for them

#### Scenario: Unverified email
- **WHEN** a member whose email is not verified requests a place
- **THEN** the request is rejected and the screen asks them to verify their email

#### Scenario: Request sent confirmation
- **WHEN** a request is recorded
- **THEN** a "Request sent!" sheet explains that the answer will show on the match, makes no promise of a notification, and "Done" closes it

### Requirement: Who can request
A member SHALL NOT request a place in their own match, in a match that is closed, past or full, or in a match they already have an active request for. A member whose request was declined SHALL NOT request again.

#### Scenario: Own match
- **WHEN** an organiser tries to request a place in their own match
- **THEN** the request is rejected and the screen offers no "Request to join" action

#### Scenario: Second request
- **WHEN** a member with a pending or accepted request requests the same match again
- **THEN** no second request is created

#### Scenario: Declined member
- **WHEN** a member whose request was declined requests the same match again
- **THEN** the request is rejected

#### Scenario: Closed, past or full
- **WHEN** a member requests a match that is closed, past or full
- **THEN** the request is rejected and the screen says why

### Requirement: Withdraw a request
A member SHALL be able to withdraw their pending request, and their accepted request while the match is still to come. A withdrawn request SHALL free its place and SHALL allow the member to ask again.

#### Scenario: Withdraw while pending
- **WHEN** a member confirms "Withdraw request" on a pending request
- **THEN** the request is withdrawn and "Request to join" is offered again

#### Scenario: Withdraw an accepted place
- **WHEN** an accepted player withdraws before the match's start date
- **THEN** their place is freed and the match shows one more place left

#### Scenario: Confirm first
- **WHEN** a member taps "Withdraw request"
- **THEN** a sheet asks them to confirm before anything changes

### Requirement: Organiser decides requests
The organiser SHALL be able to accept or decline each pending request on their own match, and nobody else SHALL be able to. Accepting SHALL be refused when every place is taken.

#### Scenario: Accept
- **WHEN** an organiser accepts a pending request and places are left
- **THEN** the requester becomes a player and the match shows one place fewer

#### Scenario: Decline
- **WHEN** an organiser declines a pending request
- **THEN** the requester sees "Declined" and cannot request again

#### Scenario: Not the organiser
- **WHEN** a user who is not the organiser tries to accept or decline a request
- **THEN** it is rejected and nothing changes

### Requirement: Manage match screen
The organiser SHALL have a Manage match screen for their own match with a Players tab, a Requests tab, each with its count, and a way to close the match. Tapping a request SHALL open a sheet with the requester's name and skill tier and "Accept request" and "Decline request" actions. Nobody else SHALL be able to open it.

#### Scenario: Tabs
- **WHEN** the organiser opens Manage match for a match with two accepted players and one pending request
- **THEN** "Players (3)" lists the organiser and the two players, and "Requests (1)" lists the requester as "Requesting to join"

#### Scenario: Review a request
- **WHEN** the organiser taps a request
- **THEN** a sheet shows the requester's name and skill tier, and no message, place or contact detail, with Accept and Decline actions

#### Scenario: Request decided
- **WHEN** the organiser accepts or declines in the sheet
- **THEN** the sheet closes, the list updates and the Players and Requests counts change

#### Scenario: Close match
- **WHEN** the organiser closes the match from Manage match
- **THEN** the match is closed as in `match-listings` and no request can be decided

#### Scenario: Someone else opens it
- **WHEN** a user who is not the organiser opens a Manage match link
- **THEN** no requests are shown and they are taken to the match details

### Requirement: Capacity is never exceeded
The number of accepted players SHALL NOT exceed the players needed, including when two accept actions happen at the same moment. The players needed SHALL NOT be lowered below the number of accepted players.

#### Scenario: Last place
- **WHEN** two requests are accepted at the same time and one place is left
- **THEN** exactly one is accepted and the other is refused as full

#### Scenario: Lowering players needed
- **WHEN** an organiser with two accepted players saves players needed as one
- **THEN** the change is rejected

### Requirement: Full matches
A match whose places are all taken SHALL be full. A full match SHALL take no new requests, SHALL NOT appear in Discover, Home or the destination counts, and SHALL still open from its details for anyone with its link. The organiser SHALL still be able to decline pending requests on it.

#### Scenario: Match fills
- **WHEN** the last place is accepted
- **THEN** the match leaves Discover and shows "This match is full" on its details

#### Scenario: Place freed
- **WHEN** a player withdraws from a full match that is still to come
- **THEN** the match returns to Discover with one place left

#### Scenario: Pending request on a full match
- **WHEN** a member with a pending request opens a match that has since filled
- **THEN** they still see "Pending" and a note that the match is full

### Requirement: Who sees the people
Signed-in members SHALL see the organiser and the accepted players, each by first name with last initial and skill tier. The organiser SHALL also see everyone with a request on their match. Any other member SHALL see only their own request status. Guests SHALL see no people.

#### Scenario: Member views a match
- **WHEN** a signed-in member who is not involved opens a match
- **THEN** they see the organiser and accepted players and no one with a pending or declined request

#### Scenario: Organiser views requests
- **WHEN** the organiser opens their own match
- **THEN** each pending request shows the requester's name and skill tier with accept and decline actions

#### Scenario: Guest views a match
- **WHEN** a guest opens a match
- **THEN** no player or request is shown

### Requirement: Rules are enforced by the database
Requesting, withdrawing and deciding SHALL be performed only through server functions that check the caller, the match and its capacity themselves. Clients SHALL NOT write requests directly, and a request SHALL fail with a stable reason the app can translate.

#### Scenario: Direct write
- **WHEN** a signed-in user tries to insert, update or delete a request directly in the table
- **THEN** the database rejects it

#### Scenario: Reason shown
- **WHEN** a request fails because the match is full
- **THEN** the screen says the match is full, in its own wording, not a generic error
