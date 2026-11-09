# Spec Delta

## Purpose

Lets someone look around before they sign up, while keeping personal data and account features behind an account.

## ADDED Requirements

### Requirement: Browse without an account
A signed-out visitor SHALL be able to use Home and Discover, filter listings by destination, dates and level, and see destinations with their open counts.

#### Scenario: Visitor filters
- **WHEN** a signed-out visitor applies a destination and level filter in Discover
- **THEN** matching open listings are shown with no sign-in prompt

### Requirement: Account features require sign in
Creating a listing, the Matches tab (messages) and the Profile tab (viewing or editing a profile) SHALL require a signed-in user. A visitor who opens one SHALL see a prompt to sign in or create an account instead of the feature.

#### Scenario: Visitor opens Profile
- **WHEN** a signed-out visitor opens the Profile tab
- **THEN** a "Sign in to continue" prompt with sign-in and create-account actions is shown and no profile data or form is shown

#### Scenario: Visitor opens Create or Matches
- **WHEN** a signed-out visitor opens the Create or Matches tab
- **THEN** the same prompt is shown

#### Scenario: Return after signing in
- **WHEN** a visitor signs in from a prompt and their profile is complete
- **THEN** they land in the tabs signed in, and the account features are available

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
