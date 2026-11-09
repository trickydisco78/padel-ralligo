# Spec Delta

## Purpose

Gives every user, signed in or not, a landing screen that shows what the app is for and where the games are.

## ADDED Requirements

### Requirement: Home tab
The app SHALL provide a "Home" tab as the first tab, and the app SHALL open on it.

#### Scenario: Cold start signed out
- **WHEN** a signed-out visitor opens the app
- **THEN** the Home tab is shown, not the sign-in screen

#### Scenario: Cold start signed in
- **WHEN** a signed-in user with a completed profile opens the app
- **THEN** the Home tab is shown

### Requirement: Account call to action for visitors
Home SHALL show signed-out visitors a way to sign in and a way to create an account, and SHALL NOT show them to signed-in users.

#### Scenario: Visitor sees actions
- **WHEN** a signed-out visitor views Home
- **THEN** "Sign in" and "Create an account" actions are shown and each opens the matching screen

#### Scenario: Signed-in user
- **WHEN** a signed-in user views Home
- **THEN** no sign-in or create-account actions are shown

### Requirement: Destination shortcuts
Home SHALL list the destinations with their open-listing counts, and selecting one SHALL open Discover filtered to that destination.

#### Scenario: Counts shown
- **WHEN** Home loads
- **THEN** each destination is shown with its current number of open listings

#### Scenario: Open a destination
- **WHEN** the user selects "Tenerife"
- **THEN** Discover opens with the Tenerife destination filter applied

### Requirement: Upcoming games
Home SHALL show up to five open, current listings, soonest first, and a way to see all games in Discover.

#### Scenario: Games exist
- **WHEN** there are more than five open listings
- **THEN** the five with the earliest start dates are shown, followed by a "See all games" action that opens Discover

#### Scenario: No games
- **WHEN** there are no open listings
- **THEN** an empty message is shown and the destination shortcuts still appear

#### Scenario: Load failure
- **WHEN** destinations or listings cannot be loaded
- **THEN** Home shows a retry message for the failed part and stays usable

### Requirement: Game cards on Home
Games on Home SHALL use the same card as Discover and SHALL NOT require sign in to view.

#### Scenario: Visitor views a game
- **WHEN** a signed-out visitor views a game on Home
- **THEN** they see the same details as on the Discover card and no sign-in prompt appears
