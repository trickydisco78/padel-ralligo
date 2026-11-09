# Spec Delta

## Purpose

Provides a curated list of places players can travel to or play in, so listings and trips group cleanly and can be filtered without free-text mismatches.

## ADDED Requirements

### Requirement: Curated destination list
The system SHALL hold a list of destinations, each with a name, a country and a short tagline, and SHALL provide at least Tenerife, The Algarve, Marbella and Barcelona at launch.

#### Scenario: Listing destinations
- **WHEN** a signed-in user opens a destination picker
- **THEN** all destinations are shown in alphabetical order

#### Scenario: Seed data
- **WHEN** the database is set up from scratch
- **THEN** the four launch destinations exist

### Requirement: Destination counts
The system SHALL show, for each destination, how many open listings it currently has.

#### Scenario: Counting open listings
- **WHEN** a destination has three open listings with end dates today or later and one closed listing
- **THEN** its count is 3

### Requirement: Destinations are read-only to users
Users SHALL be able to read destinations but SHALL NOT be able to create, change or delete them.

#### Scenario: Attempted change
- **WHEN** a signed-in user attempts to insert, update or delete a destination
- **THEN** the change is rejected

### Requirement: Destinations are maintainable without a release
Destinations SHALL be held as data, not code, so that one can be added or edited without releasing a new app version.

#### Scenario: New destination
- **WHEN** a destination row is added to the data store
- **THEN** it appears in pickers and counts the next time the app loads destinations
