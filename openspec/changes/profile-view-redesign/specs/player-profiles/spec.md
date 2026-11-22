## ADDED Requirements

### Requirement: Own profile view layout
The own-profile view SHALL present the member's identity in a branded hero: a pink band, a white sheet overlapping it, and the member's initials avatar overlapping both, followed by their name, a line of skill tier and home place, an Edit profile button, a level card and their bio.

#### Scenario: Identity block
- **WHEN** a signed-in member with a saved profile opens the Profile tab
- **THEN** they see their initials avatar, their name as a heading, and a line combining skill tier and home place
- **AND** an Edit profile button below it

#### Scenario: Level card
- **WHEN** the member has a skill tier
- **THEN** a card captioned "Your level" shows that tier

#### Scenario: Missing optional details
- **WHEN** the member has no home place, no bio or no skill tier
- **THEN** the line shows only the parts that exist, the level card is left out without a gap if there is no tier, and the About section is replaced by the Add a bio prompt if there is no bio

#### Scenario: Layout does not hide the name
- **WHEN** the view is shown at a large text size or on a narrow screen
- **THEN** the name stays fully visible and is not covered by the avatar

### Requirement: View layout follows the shared styling
The view's colours, radii and type SHALL come from the shared design tokens, and all of its copy from the profiles locale file.

#### Scenario: Language and tokens
- **WHEN** the view is rendered
- **THEN** every label comes from the locale file and no colour is written as a literal in the component
