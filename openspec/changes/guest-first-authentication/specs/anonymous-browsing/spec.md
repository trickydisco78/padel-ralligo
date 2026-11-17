# Spec Delta

## MODIFIED Requirements

### Requirement: Account features require sign in
Creating a listing, the Matches tab (messages) and the Profile tab (viewing or editing a profile) SHALL require a signed-in user. A visitor who opens one SHALL see an in-screen prompt with sign-in and create-account actions instead of the feature. The Profile prompt SHALL read "Your padel profile" with the text "Sign in or create an account to connect with players, manage your matches and track your activity."

#### Scenario: Visitor opens Profile
- **WHEN** a signed-out visitor opens the Profile tab
- **THEN** the "Your padel profile" prompt with clear "Sign in" and "Create account" actions is shown and no profile data or form is shown

#### Scenario: Visitor opens Create or Matches
- **WHEN** a signed-out visitor opens the Create or Matches tab
- **THEN** a prompt with the same actions is shown, and the Matches prompt records an `openMessages` intent

#### Scenario: Return after signing in
- **WHEN** a visitor signs in from a prompt and their profile is complete
- **THEN** they land on the tab they opened, signed in, and the account feature is available

#### Scenario: Incomplete profile
- **WHEN** a visitor signs in and their profile is incomplete
- **THEN** they are asked to complete their profile before using the tabs, as for any new account

## ADDED Requirements

### Requirement: Public match details for anonymous requests
An anonymous request SHALL be able to read a single open, current listing by id through the Discover read model only, with the same permitted fields and no others.

#### Scenario: Anonymous read by id
- **WHEN** a request with no session reads one open listing by id
- **THEN** the row has only the permitted columns, and a closed or past listing returns no row
