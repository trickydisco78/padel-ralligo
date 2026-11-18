# Spec Delta

## ADDED Requirements

### Requirement: Sign in offers password recovery
The Sign in screen SHALL let a person who cannot remember their password start recovery without leaving the sign-in flow.

#### Scenario: Forgotten password
- **WHEN** a Guest on Sign in chooses "Forgot password?"
- **THEN** they reach the password reset request screen, and the email they typed on Sign in is offered as the starting value

### Requirement: Verification link completes verification in the app
The link in a sign-up verification email SHALL return the person to the app and tell them their email is verified. Verification SHALL be treated as complete once the server has confirmed it, whether or not the app could establish a session from the link.

#### Scenario: Verify on the same device
- **WHEN** a person opens the verification link on the device where they signed up
- **THEN** the app shows that their email is verified and they continue as an Authenticated user

#### Scenario: Verify on another device
- **WHEN** a person opens the verification link on a different device
- **THEN** the app shows that their email is verified and invites them to sign in

#### Scenario: Posting after verification
- **WHEN** a person has verified their email through the link and then signs in
- **THEN** they can post a match without being told to verify
