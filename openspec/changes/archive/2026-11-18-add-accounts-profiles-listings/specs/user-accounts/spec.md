# Spec Delta

## Purpose

Lets people create an account and sign in, so that listings and profiles belong to a verified, adult, consenting person.

## ADDED Requirements

### Requirement: Sign up with email and password
The app SHALL let a new user create an account with an email address and a password.

#### Scenario: Successful sign up
- **WHEN** a user submits a valid email, a password that meets the minimum length and the required confirmations
- **THEN** an account is created and the user is told to check their email to verify it

#### Scenario: Email already registered
- **WHEN** a user signs up with an email that already has an account
- **THEN** the app shows an error and does not create a second account

#### Scenario: Weak or invalid input
- **WHEN** the email is malformed or the password is shorter than 8 characters
- **THEN** the app shows a field-level error and does not submit

### Requirement: Terms and age confirmation
The app SHALL require a user to accept the terms and confirm they are at least 18 years old before an account is created.

#### Scenario: Confirmations missing
- **WHEN** the user has not accepted the terms or has not confirmed their age
- **THEN** sign up is blocked and the missing confirmation is indicated

#### Scenario: Confirmations recorded
- **WHEN** an account is created
- **THEN** the acceptance of terms and age confirmation, with the time, is stored against the account

### Requirement: Email verification
The system SHALL require a verified email address before a user can post a listing.

#### Scenario: Unverified user posts
- **WHEN** a user whose email is not verified tries to create a listing
- **THEN** the listing is not created and the user is told to verify their email

#### Scenario: Verified user posts
- **WHEN** a user whose email is verified creates a listing
- **THEN** the listing is created

### Requirement: Sign in and sign out
The app SHALL let a user sign in with their email and password and sign out again.

#### Scenario: Valid credentials
- **WHEN** a user enters a correct email and password
- **THEN** they are signed in and shown the Discover tab

#### Scenario: Invalid credentials
- **WHEN** a user enters an incorrect email or password
- **THEN** the app shows a generic "invalid credentials" error that does not reveal which part was wrong

#### Scenario: Sign out
- **WHEN** a signed-in user signs out
- **THEN** their session ends and the app shows the sign-in screen

### Requirement: Session persistence
The app SHALL keep a user signed in across app restarts until they sign out or the session expires.

#### Scenario: Restart while signed in
- **WHEN** a signed-in user closes and reopens the app
- **THEN** they are still signed in and see the Discover tab without re-entering credentials

### Requirement: Signed-out access
The app SHALL show only the sign-in and sign-up screens to a signed-out user.

#### Scenario: Signed-out launch
- **WHEN** the app opens with no valid session
- **THEN** the sign-in screen is shown and no listing or profile data is displayed
