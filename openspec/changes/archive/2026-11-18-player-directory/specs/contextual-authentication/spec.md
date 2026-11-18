# Spec Delta

## MODIFIED Requirements

### Requirement: Typed authentication intent
The app SHALL represent what the Guest was trying to do as one of a fixed set of intents (join match with a match id, connect with a player, create match, open messages, open personal matches, open profile). It SHALL NOT store callbacks or free-form routes, SHALL hold the intent in memory only, and SHALL keep it while the user moves between sign-in and sign-up.

#### Scenario: Switching between sign-in and sign-up
- **WHEN** a Guest with a pending intent opens "Create account" and then goes to "Sign in" (or the reverse)
- **THEN** the same intent is still pending

#### Scenario: App restart
- **WHEN** the app is closed before authentication completes
- **THEN** the intent is gone and the app opens on Home

## ADDED Requirements

### Requirement: Connecting prompts and returns to Players
When a Guest taps "Connect" on a player card, the app SHALL show the contextual sheet titled "Connect with players" reading "Create a free account or sign in to connect with other players", and after authentication SHALL return them to the Players list on Discover. The intent SHALL carry no player identifier.

#### Scenario: Guest taps Connect
- **WHEN** a Guest taps "Connect"
- **THEN** the sheet is shown with "Create account", "Sign in" and "Dismiss"

#### Scenario: Return after sign-in
- **WHEN** the Guest signs in from that sheet
- **THEN** they are shown the Players list on Discover and nothing is connected
