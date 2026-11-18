# anonymous-browsing Specification

## Purpose
Lets someone look around before they sign up, while keeping personal data and account features behind an account.

## Requirements

### Requirement: Browse without an account
A signed-out visitor SHALL be able to use Home and Discover, filter listings by destination, dates and level, and see destinations with their open counts.

#### Scenario: Visitor filters
- **WHEN** a signed-out visitor applies a destination and level filter in Discover
- **THEN** matching open listings are shown with no sign-in prompt

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

### Requirement: Limited data for anonymous visitors
Anonymous requests SHALL return only these listing fields: destination, dates, start time, venue, level wanted, players needed, description, and the poster's display name and skill tier. They SHALL NOT return email addresses, consent timestamps, trips, bios, home cities, user identifiers or closed or past listings.

#### Scenario: Anonymous listing request
- **WHEN** a request is made with no session for open listings
- **THEN** only open, current listings are returned and only the permitted fields are present

#### Scenario: Anonymous profile request
- **WHEN** a request is made with no session for profiles, trips, consents or the listings table directly
- **THEN** no rows are returned or the request is rejected

### Requirement: Read-only for anonymous visitors
Anonymous requests SHALL NOT be able to create, change or delete any data.

#### Scenario: Anonymous write
- **WHEN** a request with no session tries to insert, update or delete a listing, profile or destination
- **THEN** the request is rejected

### Requirement: Signing out
After signing out, a user SHALL return to the signed-out Home with account features gated again.

#### Scenario: Sign out
- **WHEN** a signed-in user signs out
- **THEN** the Home tab is shown with sign-in and create-account actions, and Profile shows the sign-in prompt

### Requirement: Public match details for anonymous requests
An anonymous request SHALL be able to read a single open, current listing by id through the Discover read model only, with the same permitted fields and no others.

#### Scenario: Anonymous read by id
- **WHEN** a request with no session reads one open listing by id
- **THEN** the row has only the permitted columns, and a closed or past listing returns no row
