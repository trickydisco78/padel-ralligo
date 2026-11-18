# app-shell Specification

## Purpose
Defines the monorepo workspace, the runnable mobile app and its top-level tab navigation, giving every future app and feature a consistent place to live.

## Requirements

### Requirement: Monorepo workspace
The repository SHALL be a pnpm workspace in which one install at the root sets up every app and package, and root commands run across all workspaces through Turborepo.

#### Scenario: Single install
- **WHEN** a developer runs `pnpm install` at the repository root
- **THEN** dependencies for the mobile app and all shared packages are installed without errors

#### Scenario: Root commands
- **WHEN** a developer runs the root build, lint, type-check or test command
- **THEN** the command runs in every workspace that defines it

### Requirement: App launches on supported platforms
The mobile app SHALL start without errors on iOS and Android via the Expo development server and open on the "Home" tab, whether or not the user is signed in.

#### Scenario: Cold start
- **WHEN** a developer starts the dev server from the repository root and opens the app in Expo Go or a simulator
- **THEN** the app renders the "Home" tab without red-screen errors

### Requirement: Bottom tab navigation
The app SHALL provide a bottom tab bar with five tabs labelled "Home", "Discover", "Create", "Matches" and "Profile", in that order, visible to signed-in and signed-out users.

#### Scenario: Switching tabs
- **WHEN** the user taps the "Matches" tab
- **THEN** the Matches screen (or the sign-in prompt for a visitor) is shown and the tab is marked as active

#### Scenario: Placeholder screens
- **WHEN** a signed-in user opens the "Matches" tab
- **THEN** a placeholder screen with a title and short "coming soon" message is displayed

#### Scenario: Create and Profile tabs
- **WHEN** a signed-in user opens the "Create" or "Profile" tab
- **THEN** the listing form or the profile screen is shown, not a placeholder

### Requirement: Project quality checks pass
The project SHALL provide root commands for type checking, linting and unit tests, and all SHALL pass on the scaffolded code.

#### Scenario: Checks on a clean scaffold
- **WHEN** a developer runs the root type check, lint and test commands
- **THEN** each exits with status 0

### Requirement: Public routes stay public
The match details route SHALL be reachable by Guests and Authenticated users. The tabs group SHALL NOT be protected as a whole, and a protected action on a public screen SHALL NOT redirect.

#### Scenario: Open details signed out
- **WHEN** a Guest opens a match from Home
- **THEN** details are shown as a pushed screen and back returns to Home

### Requirement: Stable navigation during session restore
While the session is restored the app SHALL show no screen that depends on the outcome, and SHALL NOT briefly show the Guest UI to a user who is about to be Authenticated.

#### Scenario: Restore then render
- **WHEN** the app opens with a stored session
- **THEN** the first screen shown after loading is the Authenticated Home

### Requirement: Back navigation through authentication
Android back SHALL move from sign-in or sign-up to the screen that opened them, one step at a time, and SHALL NOT loop between them.

#### Scenario: Back from sign-in
- **WHEN** a Guest opened sign-in from the contextual sheet and presses back
- **THEN** they return to the match details they came from
