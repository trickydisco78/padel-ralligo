# Spec Delta

## Purpose

Gives each player a profile with a self-rated skill level and a saved trip, so listings can show who is posting and Discover can open already filtered for where they are going.

## ADDED Requirements

### Requirement: Profile creation
A signed-in user SHALL have a profile with a display name, home city, short bio and padel skill tier, and SHALL be asked to complete the required fields after their first sign in.

#### Scenario: First sign in
- **WHEN** a user signs in for the first time and has no display name or skill tier
- **THEN** the app asks them to complete their profile before showing Discover

#### Scenario: Required fields
- **WHEN** the user saves a profile
- **THEN** the display name (2 to 40 characters) and skill tier are required, home city is optional, and bio is optional up to 300 characters

### Requirement: Padel skill tier
A profile SHALL record a self-rated skill tier for padel of Beginner, Intermediate or Advanced, held as a per-sport record.

#### Scenario: Choosing a tier
- **WHEN** the user selects a tier and saves
- **THEN** that tier is shown on their profile and on their listings

#### Scenario: Changing a tier
- **WHEN** the user later selects a different tier and saves
- **THEN** the new tier replaces the old one on their profile

### Requirement: Edit own profile only
A user SHALL be able to edit only their own profile.

#### Scenario: Editing another profile
- **WHEN** a user attempts to change another user's profile data
- **THEN** the change is rejected and the other profile is unchanged

### Requirement: Public profile fields
The system SHALL show other signed-in users a player's display name, home city, bio and skill tier, and SHALL NOT show their email address.

#### Scenario: Viewing a poster
- **WHEN** a user views the profile of a listing's poster
- **THEN** they see display name, home city, bio and skill tier, and no email address

### Requirement: Saved current trip
A profile SHALL allow one saved current trip made of a destination and a start and end date, and Discover SHALL open filtered to it.

#### Scenario: Saving a trip
- **WHEN** a user chooses a destination, a start date and an end date on or after the start date, and saves
- **THEN** the trip is stored on their profile

#### Scenario: Discover opens on the trip
- **WHEN** a user with a saved trip opens Discover
- **THEN** the destination and date filters are pre-set to that trip and the user can change or clear them

#### Scenario: Invalid dates
- **WHEN** the end date is before the start date
- **THEN** the trip is not saved and an error is shown

#### Scenario: Trip in the past
- **WHEN** a saved trip's end date has passed
- **THEN** Discover does not pre-apply it
