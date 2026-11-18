# Spec Delta

## ADDED Requirements

### Requirement: Discoverability setting
A member SHALL be able to turn "Show me in Find players" on or off from their profile, with a plain explanation of what others will see. It SHALL be off for every account until the member turns it on, and SHALL record when it was turned on.

#### Scenario: Default
- **WHEN** a member opens their profile for the first time, or after this setting is introduced
- **THEN** the setting is off

#### Scenario: Explanation
- **WHEN** a member views the setting
- **THEN** the text says that other people can see their first name and last initial, home destination and skill tier

#### Scenario: Turning on without a home destination
- **WHEN** a member turns the setting on without a home destination
- **THEN** they are asked to choose one and are not listed until they do

### Requirement: Home destination
A member SHALL be able to choose a home destination from the curated destinations. It SHALL be optional, separate from the free-text home city, and used only to place the member in the player directory.

#### Scenario: Choosing
- **WHEN** a member picks a destination as their home destination and saves
- **THEN** it is stored on their profile and shown when they edit it again

#### Scenario: Home city unchanged
- **WHEN** a member has a free-text home city
- **THEN** it is unaffected and is not shown in the player directory
