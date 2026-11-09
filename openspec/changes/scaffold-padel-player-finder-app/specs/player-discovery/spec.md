# Spec Delta

## Purpose

Lets a padel player browse other players available to play and narrow the list by skill level, as the core of the player-finding experience.

## ADDED Requirements

### Requirement: Player list
The "Find players" screen SHALL display a scrollable list of players, each showing name, skill level, location and preferred side.

#### Scenario: Initial list
- **WHEN** the user opens the "Find players" tab
- **THEN** all available players from the local mock data are listed with name, skill level, location and preferred side

#### Scenario: Empty result
- **WHEN** no players match the current filter
- **THEN** the screen shows an empty-state message instead of a blank list

### Requirement: Skill level filter
The screen SHALL let the user filter the list by skill level (Beginner, Intermediate, Advanced) or show all levels.

#### Scenario: Filter by level
- **WHEN** the user selects "Intermediate"
- **THEN** only players with the Intermediate level are listed

#### Scenario: Clear filter
- **WHEN** the user selects "All" after filtering
- **THEN** every player is listed again

### Requirement: Local mock data source
Until a backend exists, player data SHALL come from a local static data set containing at least one player per skill level, provided by a package shared across apps rather than code local to the mobile app.

#### Scenario: Data coverage
- **WHEN** the mock data is loaded
- **THEN** each skill level has at least one player and every player has all displayed fields

#### Scenario: Reuse by another app
- **WHEN** another app in the workspace depends on the shared package
- **THEN** it can import the player data and filtering behaviour without copying code
