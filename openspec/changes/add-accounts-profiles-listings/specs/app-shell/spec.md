# Spec Delta

## MODIFIED Requirements

### Requirement: App launches on supported platforms
The mobile app SHALL start without errors on iOS and Android via the Expo development server and, for a signed-in user, open on the "Discover" tab.

#### Scenario: Cold start
- **WHEN** a developer starts the dev server from the repository root and opens the app in Expo Go or a simulator while signed in
- **THEN** the app renders the "Discover" tab without red-screen errors

### Requirement: Bottom tab navigation
The app SHALL provide a bottom tab bar with four tabs labelled "Discover", "Create", "Matches" and "Profile".

#### Scenario: Switching tabs
- **WHEN** the user taps the "Matches" tab
- **THEN** the Matches screen is shown and the tab is marked as active

#### Scenario: Placeholder screen
- **WHEN** the user opens the "Matches" tab
- **THEN** a placeholder screen with a title and short "coming soon" message is displayed

#### Scenario: Create and Profile tabs
- **WHEN** the user opens the "Create" or "Profile" tab
- **THEN** the listing form or the profile screen is shown, not a placeholder
