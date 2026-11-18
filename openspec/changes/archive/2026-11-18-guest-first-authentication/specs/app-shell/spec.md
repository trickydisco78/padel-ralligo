# Spec Delta

## ADDED Requirements

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
