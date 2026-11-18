# Spec Delta

## Purpose

Keeps the signed-in state accurate through launch, sign-in, sign-out and expiry, and guarantees private client state never outlives the user it belongs to.

## ADDED Requirements

### Requirement: Session restoration and changes
The app SHALL restore a stored session at launch using the existing secure storage, and SHALL react to sign-in, sign-out and token expiry through a single session provider and a single auth-state listener.

#### Scenario: Restore at launch
- **WHEN** a valid stored session exists at launch
- **THEN** the user is Authenticated once restoration completes

#### Scenario: Expired or revoked session
- **WHEN** the session can no longer be refreshed
- **THEN** the user becomes a Guest, stays on a public screen if they are on one, and is not shown a raw error

#### Scenario: Single listener
- **WHEN** screens mount and unmount repeatedly
- **THEN** only one auth-state subscription exists

### Requirement: Private state cleared on sign-out
When the signed-in user ends or changes, the app SHALL remove cached private data (profile, profile completeness, trip, own matches) and any pending authentication intent.

#### Scenario: Sign out
- **WHEN** a signed-in user signs out
- **THEN** Profile shows its Guest state and no previous profile data is shown

#### Scenario: A different user signs in
- **WHEN** user B signs in on a device where user A was signed in
- **THEN** user B never sees user A's cached profile, trip or own matches, even momentarily

#### Scenario: Public data after sign-out
- **WHEN** a user signs out
- **THEN** public matches and destinations remain browsable and refetch as needed
