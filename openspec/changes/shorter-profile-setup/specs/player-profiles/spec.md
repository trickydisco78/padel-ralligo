## MODIFIED Requirements

### Requirement: Profile creation
A signed-in user SHALL have a profile with a display name, home city, short bio and padel skill tier, and SHALL be asked, after their first sign in, only for the display name, skill tier and home city. The bio, home destination and Find players setting are set from Edit profile.

#### Scenario: First sign in
- **WHEN** a user signs in for the first time and has no display name or skill tier
- **THEN** the app asks them for display name, skill tier and home city before showing Discover
- **AND** it does not ask for a bio, home destination or the Find players setting

#### Scenario: Required fields
- **WHEN** the user saves a profile
- **THEN** the display name (2 to 40 characters) and skill tier are required, home city is optional, and bio is optional up to 300 characters

#### Scenario: Fields setup does not show
- **WHEN** a member with an existing partial profile completes setup
- **THEN** the bio, home destination and Find players setting they already have are kept unchanged

#### Scenario: Find players stays off
- **WHEN** a new member completes setup
- **THEN** they are not listed in Find players until they turn it on from Edit profile

#### Scenario: Suggested name
- **WHEN** setup is given a suggested display name
- **THEN** the name field shows it as an editable value, and it is saved only when the member saves
- **AND** without a suggestion the field starts empty, and no name is taken from the email address

#### Scenario: Adding a bio later
- **WHEN** a member with no bio views their profile
- **THEN** they are offered "Add a bio", which opens Edit profile
