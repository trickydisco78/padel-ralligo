# public-data-security Specification

## Purpose
States what an unauthenticated request may read in the database and that every mutation and private record is protected by database-enforced authorisation, not by screens.

## Requirements

### Requirement: Public reads are explicit
The unauthenticated role SHALL be able to read only intentionally published data: open, current matches and destinations with their counts, through read models with explicit column lists. It SHALL NOT read closed, past or any non-public match, and the app SHALL NOT use a service-role or secret key.

#### Scenario: Anonymous read of matches
- **WHEN** a request with no session reads matches
- **THEN** only open, current matches with permitted columns are returned

#### Scenario: Grants are limited
- **WHEN** the unauthenticated role's table and view privileges are listed
- **THEN** only the two public read models are readable and nothing is writable

### Requirement: Private data is not public
Unauthenticated requests SHALL NOT read email addresses, consents, trips, profile bios or home cities, user identifiers, participant lists or messages, directly or through any view.

#### Scenario: Private profile fields
- **WHEN** a request with no session reads profiles or any public read model
- **THEN** no private profile field is available

### Requirement: Profiles are readable by signed-in users only
Profile rows (including bio and home city) SHALL remain readable by every signed-in user, as already decided, and SHALL NOT be readable by the unauthenticated role. Poster display name and skill tier SHALL be public through the public match read model.

#### Scenario: Signed-in user reads another profile
- **WHEN** an authenticated user reads another user's profile row
- **THEN** the row is returned

#### Scenario: Anonymous profile read
- **WHEN** a request with no session reads profiles
- **THEN** no rows are returned or the request is rejected

### Requirement: Mutations need an authorised user
Creating or changing a match, joining a match and sending or reading messages SHALL require an authenticated user who passes the database's own checks (ownership, verified email, membership). These checks SHALL NOT depend on the app hiding a button.

#### Scenario: Anonymous write
- **WHEN** a request with no session tries to create, change, join or message
- **THEN** it is rejected by the database

#### Scenario: Another user's data
- **WHEN** an authenticated user requests another user's trip, consents or editable records
- **THEN** no rows are returned or the request is rejected

### Requirement: New features keep the boundary
Any new table or view for joining or messaging SHALL be created by a migration with row-level security enabled and no grant to the unauthenticated role unless it is a deliberate public projection.

#### Scenario: Future table
- **WHEN** a migration adds participants or messages
- **THEN** the security test suite asserts anonymous access is denied
