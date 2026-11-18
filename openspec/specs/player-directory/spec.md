# player-directory Specification

## Purpose
Lets guests and members see which players are in a destination and how well they play, without profile pages, trips or any private data, and only for players who chose to be listed.

## Requirements

### Requirement: Players and Open matches on Discover
The Discover screen SHALL offer a switch between "Players" and "Open matches", each showing a count of its current results. "Open matches" SHALL show the existing match list unchanged.

#### Scenario: Switching
- **WHEN** a user selects "Players" or "Open matches"
- **THEN** the matching list is shown and the selected side is marked as selected

#### Scenario: Counts
- **WHEN** Discover is shown with filters applied
- **THEN** each side shows the number of results for the current filters

### Requirement: Who appears in the directory
A player SHALL appear in the Players list only if they chose "Show me in Find players", have a home destination and have a skill tier. Every account SHALL start not listed.

#### Scenario: New or existing account
- **WHEN** an account has never turned the setting on
- **THEN** the player does not appear to anyone

#### Scenario: Turning the setting off
- **WHEN** a listed player turns the setting off
- **THEN** they no longer appear in any new request

#### Scenario: Own entry
- **WHEN** a signed-in member views the list
- **THEN** their own entry is not shown

### Requirement: What a player card shows
A player card SHALL show the first name and the initial of the last name, the home destination, the skill tier and a "Connect" button. It SHALL NOT show an email address, phone number, bio, free-text home city, trip, user identifier, photo, or any other profile field.

#### Scenario: Guest views a card
- **WHEN** a Guest views a player card
- **THEN** only first name with last initial, home destination, skill tier and "Connect" are shown

#### Scenario: Single-word name
- **WHEN** a player's display name is a single word
- **THEN** the card shows that word and no initial

#### Scenario: No profile page
- **WHEN** a user taps a player card outside the "Connect" button
- **THEN** no profile page opens

### Requirement: Search and filters
The Players list SHALL be searchable by destination or country text and filterable by destination and skill tier, combined with each other. Search SHALL NOT match player names.

#### Scenario: Filter by destination
- **WHEN** the user selects a destination
- **THEN** only listed players whose home destination is that destination are shown

#### Scenario: Search by text
- **WHEN** the user types part of a destination or country name
- **THEN** players in matching destinations are shown

#### Scenario: Name search
- **WHEN** the user types a player's name
- **THEN** no player is found by that name

#### Scenario: No results
- **WHEN** no player matches
- **THEN** an empty state is shown with a way to clear the filters

### Requirement: Results are capped
A single request SHALL return at most 50 players, and the app SHALL page no deeper than 100 players in total, so the directory cannot be copied wholesale.

#### Scenario: More players than the cap
- **WHEN** more than 50 listed players match
- **THEN** the first 50 are returned with the full count of matches available for display

#### Scenario: Paging beyond the limit
- **WHEN** a request asks for results beyond the first 100
- **THEN** no further players are returned

### Requirement: Connect is not yet active
Each card SHALL show a "Connect" button. For a Guest it SHALL open the sign-in prompt. For a signed-in member it SHALL open a bottom sheet saying "To be developed". No connection SHALL be created.

#### Scenario: Guest taps Connect
- **WHEN** a Guest taps "Connect"
- **THEN** a sheet titled "Connect with players" offers "Create account", "Sign in" and "Dismiss", and the Players list stays as it was if dismissed

#### Scenario: Member taps Connect
- **WHEN** a signed-in member taps "Connect"
- **THEN** a sheet titled "Connect with players" says "To be developed", it can be dismissed with its close control, by tapping outside or with Android back, and nothing is sent

### Requirement: States and accessibility
The Players list SHALL show loading, empty and error states, and SHALL expose each card and its "Connect" button to screen readers with a name and a role.

#### Scenario: Error
- **WHEN** the list cannot be loaded
- **THEN** a message with a retry action is shown, not a blank screen

#### Scenario: Screen reader
- **WHEN** a screen reader focuses a card
- **THEN** it announces the name, destination and skill tier, and reaches "Connect" with its state
