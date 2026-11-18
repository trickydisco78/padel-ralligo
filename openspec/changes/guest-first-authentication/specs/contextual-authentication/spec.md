# Spec Delta

## Purpose

Lets a Guest start sign-in or sign-up from the point where an action needs an account, and brings them back to that point afterwards without performing the action for them.

## ADDED Requirements

### Requirement: Contextual prompt for protected actions
When a Guest attempts a protected action on a public screen, the app SHALL show a bottom sheet naming the action and offering "Create account", "Sign in" and a way to dismiss. It SHALL be usable with a screen reader, have a labelled dismiss control and close on the Android back action.

#### Scenario: Guest taps Join match
- **WHEN** a Guest taps "Join match" on a match
- **THEN** a sheet titled "Join this match" reads "Create a free account or sign in to reserve your place and connect with other players." with "Create account", "Sign in" and "Dismiss"

#### Scenario: Dismiss
- **WHEN** the Guest dismisses the sheet, taps outside it or presses Android back
- **THEN** the sheet closes, the user stays on the same screen in the same state and the intent is discarded

#### Scenario: Authenticated user
- **WHEN** an Authenticated user attempts the same action
- **THEN** no sheet is shown and the action proceeds

### Requirement: Typed authentication intent
The app SHALL represent what the Guest was trying to do as one of a fixed set of intents (join match with a match id, create match, open messages, open personal matches, open profile). It SHALL NOT store callbacks or free-form routes, SHALL hold the intent in memory only, and SHALL keep it while the user moves between sign-in and sign-up.

#### Scenario: Switching between sign-in and sign-up
- **WHEN** a Guest with a pending intent opens "Create account" and then goes to "Sign in" (or the reverse)
- **THEN** the same intent is still pending

#### Scenario: App restart
- **WHEN** the app is closed before authentication completes
- **THEN** the intent is gone and the app opens on Home

### Requirement: Return after authentication
After the user becomes Authenticated and their profile is complete, the app SHALL take them to the screen for the pending intent and then clear it. Consequential operations SHALL NOT be performed automatically.

#### Scenario: Join intent
- **WHEN** a Guest taps "Join match" on a match, signs in and has a complete profile
- **THEN** they land on that match's details with the "Join match" action available and nothing has been joined

#### Scenario: Tab intents
- **WHEN** a Guest opens the Create tab, signs in and has a complete profile
- **THEN** they land on the Create tab with the listing form

#### Scenario: Profile still incomplete
- **WHEN** a new account must complete its profile first
- **THEN** profile setup is shown, and once complete the user is taken to the intent's screen

#### Scenario: Sign-up needs email verification
- **WHEN** a Guest creates an account that must verify its email before signing in
- **THEN** the existing "check your email" step is shown and the intent stays pending for the sign-in that follows in the same app session

### Requirement: Cancellation and invalid intents
The app SHALL discard a pending intent when the user leaves the authentication screens without authenticating, or signs out. If the intent's target no longer exists, the user SHALL see an explanatory state rather than an error or a loop.

#### Scenario: Leaving authentication
- **WHEN** a Guest with a pending intent chooses "Continue browsing" or presses back out of the authentication screens
- **THEN** the intent is cleared and a later sign-in lands on Home

#### Scenario: Stale match
- **WHEN** the intent is to join a match that has since closed or passed
- **THEN** the user lands on a "This match is no longer available" state with a way back to Discover

#### Scenario: No navigation loop
- **WHEN** an intent has been resumed once
- **THEN** it is not resumed again on later session changes or screen focus

### Requirement: One authentication entry UI
The Sign in and Create account actions SHALL be provided by one shared component used by the contextual sheet and the Create, Matches and Profile guest states, and SHALL NOT be duplicated.

#### Scenario: Tab guest state
- **WHEN** a Guest opens Create, Matches or Profile
- **THEN** the in-screen prompt offers the same actions and records the matching intent

### Requirement: Accessible prompt
The contextual sheet SHALL expose its title as its accessible name, announce itself to screen readers when it opens, move focus into it, keep focus inside while open, and return focus to the control that opened it on dismissal where the platform allows. Actions SHALL meet platform touch-target size, and loading, disabled and error states SHALL be conveyed to assistive technology.

#### Scenario: Screen reader opens the sheet
- **WHEN** a screen-reader user triggers a protected action
- **THEN** the sheet title is announced and focus moves to the sheet

#### Scenario: Dismissed with a screen reader
- **WHEN** the sheet is dismissed
- **THEN** focus returns to the control that triggered it, and the screen's state is unchanged

### Requirement: Navigation context preserved
Starting authentication SHALL NOT discard the user's navigation context: the screens beneath the authentication screens stay in the back stack, and the match list scroll, filters and search remain as they were.

#### Scenario: Back to Discover
- **WHEN** a Guest opens a match from filtered Discover, starts sign-in, and presses back twice
- **THEN** they return to Discover with the same filters applied
