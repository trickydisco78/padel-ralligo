# Spec Delta

## Purpose

Defines the three access states of the app (Initialising, Guest, Authenticated) and which actions each may perform, so that browsing never needs an account and protected actions always do.

## ADDED Requirements

### Requirement: Access states
The app SHALL distinguish Initialising (session being restored), Guest (no session) and Authenticated (valid session). Guest SHALL be an application state only: the app SHALL NOT create any Supabase Auth user, anonymous or otherwise, for a guest.

#### Scenario: Cold start without a session
- **WHEN** the app opens and no stored session exists
- **THEN** the Home tab is shown as a Guest and no authentication user is created

#### Scenario: Cold start with a session
- **WHEN** the app opens and a valid session is stored
- **THEN** the user is Authenticated without being shown the Guest Home first

#### Scenario: Restoration in progress
- **WHEN** the session is still being restored
- **THEN** only a loading indicator is shown, no tab, prompt or sign-in screen, and the user is never redirected to sign in

### Requirement: Browsing needs no permission or account
Guests and Authenticated users SHALL be able to view Home, browse destinations, search and filter open matches and view match details. The app SHALL NOT request location permission to do so.

#### Scenario: Guest browses
- **WHEN** a Guest uses Home, Discover and match details
- **THEN** all content loads with no sign-in prompt and no permission request

### Requirement: Actions that need an identity
Joining a match, creating a match, sending messages, viewing private conversations, managing a profile and viewing personal matches SHALL require an Authenticated user. A Guest who attempts one SHALL be offered authentication in context and SHALL NOT be redirected away from the public screen they are on.

#### Scenario: Guest attempts a protected action
- **WHEN** a Guest attempts a protected action
- **THEN** the action does not run and authentication is offered in context

### Requirement: Authentication does not imply authorisation
Being Authenticated SHALL NOT bypass existing rules. Email verification, profile completion, ownership checks and row-level security SHALL continue to apply to every protected action.

#### Scenario: Incomplete profile
- **WHEN** an Authenticated user without a completed profile opens the app
- **THEN** they are held at profile setup before using the tabs, as today

#### Scenario: Unverified email creates a match
- **WHEN** an Authenticated user whose email is not verified submits a new match
- **THEN** the database rejects it and the existing error handling applies
