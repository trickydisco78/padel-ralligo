# Spec Delta

## ADDED Requirements

### Requirement: Join requests are private
Join requests SHALL be readable only by the member who made them, and by the organiser of the match through the match people function. The unauthenticated role SHALL have no access to join requests or the people function, and other members SHALL never read who has requested.

#### Scenario: Anonymous access
- **WHEN** a request with no session reads join requests or calls the people function
- **THEN** it is rejected

#### Scenario: Another member's request
- **WHEN** a signed-in member reads the join requests table
- **THEN** only their own rows are returned

#### Scenario: Match people for a member
- **WHEN** a signed-in member who is not the organiser calls the people function
- **THEN** the result has the organiser, accepted players and their own request, and no other request

### Requirement: Join requests are written only through checked functions
Creating, withdrawing and deciding join requests SHALL be possible only through server functions, and signed-in users SHALL hold no insert, update or delete privilege on the table. The functions SHALL set a fixed search path and SHALL NOT be executable by the unauthenticated role.

#### Scenario: Function privileges
- **WHEN** the privileges on the join request functions are listed
- **THEN** only signed-in users can execute them

#### Scenario: Table privileges
- **WHEN** the privileges on the join requests table are listed
- **THEN** signed-in users can only select, and the unauthenticated role has none
