## ADDED Requirements

### Requirement: Own profile view
A signed-in member SHALL land on their own profile in view mode when they open the Profile tab, showing their display name, skill tier, home place and bio, followed by their trips and listings.

#### Scenario: Opening the Profile tab
- **WHEN** a signed-in member with a saved profile opens the Profile tab
- **THEN** they see their name, skill tier, home place and bio as text, and an Edit profile button
- **AND** they do not see the editable form

#### Scenario: Optional fields empty
- **WHEN** the member has no bio or home place
- **THEN** the profile shows the name and skill tier and leaves those two out without a placeholder gap

#### Scenario: Profile still loading
- **WHEN** a signed-in member opens the Profile tab before their profile has loaded
- **THEN** no form or profile content is shown until it has loaded

#### Scenario: Guest
- **WHEN** a guest opens the Profile tab
- **THEN** they see the sign-in prompt and no profile content

### Requirement: Edit profile from the view
A member SHALL open the profile form only by choosing Edit profile, and SHALL return to the view by saving or cancelling.

#### Scenario: Starting an edit
- **WHEN** the member chooses Edit profile
- **THEN** the form opens with their saved values and a Cancel button

#### Scenario: Cancelling
- **WHEN** the member chooses Cancel
- **THEN** the view returns showing the saved values, and nothing is saved

#### Scenario: Saving
- **WHEN** the member saves valid changes
- **THEN** the view returns showing the new values

#### Scenario: Save fails
- **WHEN** saving fails
- **THEN** the form stays open with the member's entries and the error

#### Scenario: Leaving the tab
- **WHEN** the member switches to another tab while editing and comes back
- **THEN** the profile opens in view mode
