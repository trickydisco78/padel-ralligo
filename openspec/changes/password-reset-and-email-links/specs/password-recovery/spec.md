# Spec Delta

## Purpose
Lets a person who has forgotten their password regain access to their account by proving they control its email address, without revealing to anyone else whether an account exists.

## ADDED Requirements

### Requirement: Request a reset link
The app SHALL let a Guest request a password reset link by entering an email address. The app SHALL show the same confirmation whether or not an account exists for that address.

#### Scenario: Request for a registered address
- **WHEN** a Guest submits a well-formed email address that has an account
- **THEN** a reset email is sent and the app shows "If an account exists for this address, we have sent a link to reset the password"

#### Scenario: Request for an unknown address
- **WHEN** a Guest submits a well-formed email address that has no account
- **THEN** the app shows exactly the same confirmation and nothing reveals that no account exists

#### Scenario: Malformed address
- **WHEN** the entered email address is not well formed
- **THEN** the app shows a field-level error and sends nothing

#### Scenario: Sending temporarily refused
- **WHEN** the request fails because of rate limiting or a network problem
- **THEN** the app shows a generic "try again in a few minutes" message that does not mention the account

### Requirement: Reset entry from Sign in
The Sign in screen SHALL offer a "Forgot password?" action that opens the request screen, and the request screen SHALL offer a way back to Sign in.

#### Scenario: Open from Sign in
- **WHEN** a Guest taps "Forgot password?" on Sign in
- **THEN** the request screen opens and Android back returns to Sign in

### Requirement: Set a new password
A person who opens a valid reset link SHALL be taken to a screen where they choose a new password, entered twice. The password SHALL meet the same minimum length as sign up.

#### Scenario: Valid new password
- **WHEN** the person enters matching passwords that meet the minimum length and submits
- **THEN** the password is changed, they are told so, and they continue into the app as an Authenticated user

#### Scenario: Passwords differ or too short
- **WHEN** the two entries differ or the password is shorter than 8 characters
- **THEN** a field-level error is shown and the password is not changed

#### Scenario: Change refused by the server
- **WHEN** the server rejects the new password (for example it equals the old one)
- **THEN** the app shows a message that the password could not be changed and the person can try again without opening the link again

### Requirement: Recovery is held at the new-password screen
Until the new password is saved, a person who arrived through a reset link SHALL see only the new-password screen. They SHALL NOT be shown Home, Discover or any account feature as a signed-in user.

#### Scenario: Reset link opened while a Guest
- **WHEN** a Guest opens a valid reset link
- **THEN** the new-password screen is shown and back does not reveal the app's tabs as signed in

#### Scenario: Reset link opened while signed in
- **WHEN** a signed-in user opens a valid reset link
- **THEN** the new-password screen is shown for the account named in the link

#### Scenario: Abandoning recovery
- **WHEN** the person leaves the new-password screen without saving
- **THEN** the recovery session is ended and they are a Guest again

### Requirement: Other sessions end after a reset
After a successful password change through recovery, the system SHALL end the account's sessions on other devices, and SHALL keep the current device signed in.

#### Scenario: Reset on one device
- **WHEN** a password is reset on device A while device B is signed in to the same account
- **THEN** device B is signed out the next time its session is refreshed and device A stays signed in

### Requirement: Accessible reset screens
The request and new-password screens SHALL give every field a visible label, announce errors and confirmations to screen readers, and keep touch targets at least 48dp.

#### Scenario: Error announced
- **WHEN** a field-level error appears
- **THEN** it is exposed to assistive technology with the field it belongs to
