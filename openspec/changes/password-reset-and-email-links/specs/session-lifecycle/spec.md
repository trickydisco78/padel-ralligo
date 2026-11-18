# Spec Delta

## ADDED Requirements

### Requirement: Recovery session
A session created from a password reset link SHALL be a distinct state in which the app shows only the new-password screen. The state SHALL end when the password is saved (the user becomes Authenticated) or when the person leaves the screen (the session ends and they become a Guest).

#### Scenario: Recovery then success
- **WHEN** the person saves a valid new password
- **THEN** the app treats them as Authenticated and shows the screens an Authenticated user sees

#### Scenario: Recovery abandoned
- **WHEN** the person leaves the new-password screen without saving
- **THEN** the session ends, private cached data is removed, and they are a Guest

#### Scenario: App closed during recovery
- **WHEN** the app is closed during recovery and reopened later
- **THEN** the person is Authenticated only if the stored session is still valid, and never sees another user's data

### Requirement: Authentication links do not disturb navigation
Handling an authentication link SHALL NOT discard a pending authentication intent that was not created by the link, and SHALL NOT leave the person on a blank or loading screen.

#### Scenario: Link handled while browsing
- **WHEN** a Guest who is viewing a match opens a verification link
- **THEN** the verified message is shown and dismissing it returns to where they were
