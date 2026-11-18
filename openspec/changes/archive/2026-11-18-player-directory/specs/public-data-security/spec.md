# Spec Delta

## MODIFIED Requirements

### Requirement: Public reads are explicit
The unauthenticated role SHALL be able to read only intentionally published data: open, current matches and destinations with their counts, through read models with explicit column lists, and the player directory, through one controlled function with an explicit column list and a result cap. It SHALL NOT read closed, past or any non-public match, and the app SHALL NOT use a service-role or secret key.

#### Scenario: Anonymous read of matches
- **WHEN** a request with no session reads matches
- **THEN** only open, current matches with permitted columns are returned

#### Scenario: Grants are limited
- **WHEN** the unauthenticated role's table, view and function privileges are listed
- **THEN** only the two public read models are readable, only the player directory function is executable, and nothing is writable

## ADDED Requirements

### Requirement: Player directory exposes the minimum
The player directory function SHALL return only players who have opted in, only first name with last initial, home destination and skill tier, and, for signed-in callers only, the player's identifier. It SHALL NOT return email, consent data, trips, bios, free-text home cities, avatars, or a user identifier to the unauthenticated role, and SHALL cap results and paging.

#### Scenario: Anonymous call
- **WHEN** a request with no session calls the directory function
- **THEN** each row has name, home destination and skill tier and no player identifier

#### Scenario: Not opted in
- **WHEN** a player has not opted in, or has opted out
- **THEN** they are not returned to anyone

#### Scenario: Underlying data stays closed
- **WHEN** a request with no session reads profiles, profile sports or any table behind the directory
- **THEN** no rows are returned or the request is rejected

#### Scenario: Cap enforced by the server
- **WHEN** a caller asks for more than 50 rows at once or paging beyond 100
- **THEN** the server returns no more than the cap regardless of the request
