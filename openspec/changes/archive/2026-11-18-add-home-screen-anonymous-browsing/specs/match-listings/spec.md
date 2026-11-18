# Spec Delta

## MODIFIED Requirements

### Requirement: Listings visible only to signed-in users
Open, current listings SHALL be readable by anyone, signed in or not, through the Discover read model, with the limited fields defined in `anonymous-browsing`. Closed listings, past listings and a poster's own closed listings SHALL remain readable only by the poster. Creating, changing or closing a listing SHALL require a signed-in user.

#### Scenario: No session
- **WHEN** a request for open listings is made with no valid session
- **THEN** open, current listings are returned with only the permitted fields

#### Scenario: Closed listing and no session
- **WHEN** a request is made with no valid session and a listing is closed or its end date has passed
- **THEN** that listing is not returned

#### Scenario: Direct table access
- **WHEN** a request with no session reads the listings table directly
- **THEN** no rows are returned or the request is rejected
