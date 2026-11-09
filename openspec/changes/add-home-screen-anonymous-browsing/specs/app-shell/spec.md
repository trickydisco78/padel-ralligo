# Spec Delta

## MODIFIED Requirements

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

#### Scenario: Placeholder screen
- **WHEN** a signed-in user opens the "Matches" tab
- **THEN** a placeholder screen with a title and short "coming soon" message is displayed

#### Scenario: Create and Profile tabs
- **WHEN** a signed-in user opens the "Create" or "Profile" tab
- **THEN** the listing form or the profile screen is shown, not a placeholder
