# home-screen Specification

## Purpose
Gives every user, signed in or not, a landing screen that shows what the app is for and where the games are.

## Requirements

### Requirement: Home tab
The app SHALL provide a "Home" tab as the first tab, and the app SHALL open on it.

#### Scenario: Cold start signed out
- **WHEN** a signed-out visitor opens the app
- **THEN** the Home tab is shown, not the sign-in screen

#### Scenario: Cold start signed in
- **WHEN** a signed-in user with a completed profile opens the app
- **THEN** the Home tab is shown

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

### Requirement: Match cards on Home
Matches on Home SHALL use the same card as Discover, SHALL NOT require sign in to view, and selecting one SHALL open its match details.

#### Scenario: Visitor views a game
- **WHEN** a signed-out visitor views Home
- **THEN** match cards are shown and selecting one opens its details without a sign-in prompt

### Requirement: Discovery first
Home SHALL keep the heading "Find your next padel game" and the text "Meet players at your level, at home or on holiday.", and SHALL NOT show a large registration promotion. It SHALL offer a way to search for a destination that opens Discover.

#### Scenario: Guest views Home
- **WHEN** a Guest opens Home
- **THEN** the heading, description, search entry, destinations and upcoming games are shown and no "Join in" card or sign-in entry is shown

#### Scenario: Search from Home
- **WHEN** the user selects the search entry
- **THEN** Discover opens ready for a destination search
