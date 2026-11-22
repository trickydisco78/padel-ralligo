# Spec Delta

## Purpose

Defines what members see from a cold start until the app is ready: a branded, animated launch screen that plays its full intro once and is short afterwards, respects reduced motion, and is accessible.

## ADDED Requirements

### Requirement: Branded launch screen
From a cold start the app SHALL show a pink launch screen with the Fourth court mark until fonts are loaded and the first session and profile status is known, with no blank frame or unbranded spinner between the native splash and the app.

#### Scenario: Cold start
- **WHEN** the app starts and the session status has not arrived yet
- **THEN** the launch screen is shown over the app and the native splash is hidden only once it is on screen

#### Scenario: App ready
- **WHEN** fonts are loaded and the session and profile status is known
- **THEN** the launch screen fades out over about 300 ms and is removed, leaving the app usable

### Requirement: First launch intro
On the first launch on a device the launch screen SHALL play the full intro: the court draws, three balls arrive one after another, the fourth square fills, and the wordmark "fourth." appears fully visible, and it SHALL NOT leave before the intro has finished.

#### Scenario: App ready before the intro ends
- **WHEN** it is the first launch and the app is ready after 1 second
- **THEN** the intro keeps playing to the end, then the screen fades out

#### Scenario: Wordmark fully visible
- **WHEN** the intro has finished
- **THEN** the wordmark is fully opaque and in its final position, and the mark matches the app icon's final arrangement

#### Scenario: Waiting after the intro
- **WHEN** the intro has finished and the app is still loading
- **THEN** the last ball pulses gently until the app is ready

### Requirement: Short version on later launches
After the intro has played once, later launches SHALL show the finished mark and wordmark and fade out as soon as the app is ready, with no forced minimum time.

#### Scenario: Second launch
- **WHEN** the app is launched again after the intro was seen
- **THEN** the mark and wordmark are shown finished, and the screen fades out when the app is ready

#### Scenario: Intro interrupted
- **WHEN** the app is closed before the first intro finished
- **THEN** the next launch plays the full intro again

#### Scenario: Seen flag unreadable
- **WHEN** the stored flag cannot be read
- **THEN** the short version is shown and the app still starts

### Requirement: Intro seen flag
The app SHALL record that the intro has been seen once it has played to the end, storing only that fact on the device and nothing about the member.

#### Scenario: Intro finishes
- **WHEN** the first-launch intro reaches its end
- **THEN** the flag is stored, and it is not stored earlier

### Requirement: Reduced motion
When the device asks for reduced motion the launch screen SHALL show the finished mark and wordmark without drawing or popping animation, and only fade out.

#### Scenario: Reduce Motion on
- **WHEN** the device has Reduce Motion enabled
- **THEN** no drawing, popping, rising or pulsing animation plays, and the screen fades out when the app is ready

### Requirement: Launch screen accessibility
The launch screen SHALL be announced to screen readers as a loading state with the product name, and SHALL NOT keep focus or block interaction after it has been removed.

#### Scenario: Screen reader
- **WHEN** a screen reader is on during launch
- **THEN** it announces "Fourth, loading" in the app's language, and once the screen is gone focus is on the app's first screen

### Requirement: Plain native splash
On native builds the system splash SHALL be the plain brand pink with no logo, so the animated launch screen begins on the same colour without a visible jump.

#### Scenario: Native build launch
- **WHEN** a native build starts
- **THEN** the system splash is plain pink, and the launch screen appears on the same colour
