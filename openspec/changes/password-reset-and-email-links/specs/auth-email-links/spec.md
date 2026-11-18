# Spec Delta

## Purpose
Defines how links in authentication emails (password reset and email verification) reach the app, become a session or a clear outcome, and never expose the secrets they carry.

## ADDED Requirements

### Requirement: Links open the app
Links in password reset and email verification emails SHALL open the installed app on the matching screen, in production builds and in the Expo Go development client.

#### Scenario: Reset link on a device with the app
- **WHEN** a person taps the link in a password reset email on a device with the app installed
- **THEN** the app opens on the new-password screen

#### Scenario: Verification link
- **WHEN** a person taps the link in a sign-up verification email on a device with the app installed
- **THEN** the app opens on a screen saying their email is verified

#### Scenario: App already running
- **WHEN** the app is open in the background and the person taps either link
- **THEN** the running app handles the link without restarting

### Requirement: Both link formats are accepted
The app SHALL accept authentication links that carry a one-time code and links that carry session tokens, because emails sent from the Supabase dashboard cannot use a code.

#### Scenario: Link with a code
- **WHEN** a link carries a one-time code issued for a request made by this app
- **THEN** the code is exchanged for a session

#### Scenario: Link with tokens
- **WHEN** a link carries session tokens, as in an email sent from the Supabase dashboard
- **THEN** a session is established from them

### Requirement: Invalid, expired and reused links
The app SHALL show a clear message when a link is expired, already used, malformed or issued on a different device, and SHALL offer the next step for the kind of link. It SHALL NOT show a blank screen, a crash or a raw error.

#### Scenario: Expired reset link
- **WHEN** a person opens a reset link that has expired or was already used
- **THEN** the app says the link is no longer valid and offers to request a new one

#### Scenario: Verification link opened on another device
- **WHEN** a verification link is opened on a device that did not create the account and its code cannot be exchanged
- **THEN** the app says the email is verified if the server confirmed it, and invites the person to sign in

#### Scenario: Expired verification link
- **WHEN** a verification link has expired
- **THEN** the app says the link is no longer valid and tells the person to sign in or contact support, without sending anything automatically

#### Scenario: Unrecognised link
- **WHEN** the app receives an authentication link it cannot interpret
- **THEN** it ignores the secrets in it and shows the same invalid-link message

### Requirement: Secrets in links are never exposed
The app SHALL NOT write one-time codes, access tokens or refresh tokens to logs, error messages, analytics or on-screen text, and SHALL remove them from the visible route once they have been used.

#### Scenario: Link handled
- **WHEN** a link has been exchanged for a session or has failed
- **THEN** no code or token remains in the current route, in any message shown, or in anything logged

### Requirement: Links return to the app, not the web
Authentication emails requested by the app SHALL carry a redirect to the app's own address for the environment (the app scheme in builds, the Expo Go address in development). The allowed redirect addresses SHALL be documented, and wildcard development addresses SHALL be limited to development projects.

#### Scenario: Requested from a development build
- **WHEN** a reset or sign-up request is made from Expo Go
- **THEN** the email's link opens Expo Go, not a web address

#### Scenario: Production allow-list
- **WHEN** the production project's redirect allow-list is reviewed
- **THEN** it contains the app scheme address and no `localhost`, `127.0.0.1` or `exp://` entry
