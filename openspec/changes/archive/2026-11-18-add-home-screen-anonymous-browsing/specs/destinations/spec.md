# Spec Delta

## MODIFIED Requirements

### Requirement: Destinations are read-only to users
Anyone, signed in or not, SHALL be able to read destinations and their open-listing counts, but nobody SHALL be able to create, change or delete them through the app.

#### Scenario: Visitor reads destinations
- **WHEN** a signed-out visitor opens Home or Discover
- **THEN** all destinations are shown with their open counts

#### Scenario: Attempted change
- **WHEN** a signed-in user or a visitor attempts to insert, update or delete a destination
- **THEN** the change is rejected
