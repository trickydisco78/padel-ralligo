# Spec Delta

## ADDED Requirements

### Requirement: Trips are shared only on purpose
A member's trips SHALL be readable only by their owner. Overlap results SHALL be available only to signed-in callers, only for a trip the caller owns, and SHALL include only players who are listed and trips their owners chose to share, returning only first name with last initial, destination, the other trip's dates, overlap days and skill tier. The unauthenticated role SHALL NOT be able to run these queries.

#### Scenario: Anonymous
- **WHEN** a request with no session calls an overlap or trip-overview query or reads trips
- **THEN** it is rejected and nothing is returned

#### Scenario: Someone else's trip
- **WHEN** a signed-in caller supplies another member's trip id to an overlap query
- **THEN** no results are returned

#### Scenario: Hidden trip
- **WHEN** a player's trip is not shared, or the player is not listed
- **THEN** it never appears in anyone's results and is not counted

#### Scenario: Grants
- **WHEN** the unauthenticated role's privileges are listed
- **THEN** it can still execute only the player directory function and read only the two public read models

#### Scenario: Result limits
- **WHEN** a caller asks for more than 50 overlapping players at once or beyond the first 100
- **THEN** the server returns no more than the limits
