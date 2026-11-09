# Spec Delta

## Purpose

Defines the monorepo workspace, the runnable mobile app and its top-level tab navigation, giving every future app and feature a consistent place to live.

## ADDED Requirements

### Requirement: Monorepo workspace
The repository SHALL be a pnpm workspace in which one install at the root sets up every app and package, and root commands run across all workspaces through Turborepo.

#### Scenario: Single install
- **WHEN** a developer runs `pnpm install` at the repository root
- **THEN** dependencies for the mobile app and all shared packages are installed without errors

#### Scenario: Root commands
- **WHEN** a developer runs the root build, lint, type-check or test command
- **THEN** the command runs in every workspace that defines it

### Requirement: App launches on supported platforms
The mobile app SHALL start without errors on iOS and Android via the Expo development server and open on the "Find players" tab.

#### Scenario: Cold start
- **WHEN** a developer starts the dev server from the repository root and opens the app in Expo Go or a simulator
- **THEN** the app renders the "Find players" tab without red-screen errors

### Requirement: Bottom tab navigation
The app SHALL provide a bottom tab bar with three tabs labelled "Find players", "Matches" and "Profile".

#### Scenario: Switching tabs
- **WHEN** the user taps the "Matches" tab
- **THEN** the Matches screen is shown and the tab is marked as active

#### Scenario: Placeholder screens
- **WHEN** the user opens the "Matches" or "Profile" tab
- **THEN** a placeholder screen with a title and short "coming soon" message is displayed

### Requirement: Project quality checks pass
The project SHALL provide root commands for type checking, linting and unit tests, and all SHALL pass on the scaffolded code.

#### Scenario: Checks on a clean scaffold
- **WHEN** a developer runs the root type check, lint and test commands
- **THEN** each exits with status 0
