# Spec Delta

## Purpose
Lets a member keep the trips they are planning on their profile, and decide for each one whether other members may see it, so they can find players who will be in the same place at the same time.

## ADDED Requirements

### Requirement: Several saved trips
A member SHALL be able to save several trips on their profile, each made of a destination, a start date and an end date on or after the start date, up to a maximum of 10 trips.

#### Scenario: Saving a trip
- **WHEN** a member chooses a destination, a start date and an end date on or after the start date and saves
- **THEN** the trip is added to their trips

#### Scenario: Invalid dates
- **WHEN** the end date is before the start date, or a destination or date is missing
- **THEN** the trip is not saved and a field-level error is shown

#### Scenario: Limit reached
- **WHEN** a member who already has 10 trips tries to add another
- **THEN** it is not saved and the member is told they have reached the limit and can delete a trip to add another

### Requirement: Edit and delete trips
A member SHALL be able to change a trip's destination, dates and sharing setting, and to delete it. There SHALL be no separate cancelled state: deleting a trip removes it.

#### Scenario: Editing
- **WHEN** a member changes a trip's dates and saves
- **THEN** the trip shows the new dates and overlap results use them from then on

#### Scenario: Deleting
- **WHEN** a member deletes a trip
- **THEN** it disappears from their trips and from every overlap result

### Requirement: Sharing a trip is a choice
Each trip SHALL have a setting "Let other members see this trip" that is off when the trip is created. Only trips with the setting on SHALL count towards other members' overlap results.

#### Scenario: New trip
- **WHEN** a member saves a new trip without touching the setting
- **THEN** the trip is not shared and no other member can see it or be shown it

#### Scenario: Explanation
- **WHEN** a member views the setting
- **THEN** the text says that other signed-in members who are listed in Find players can see this trip's destination and dates

#### Scenario: Turning sharing on and off
- **WHEN** a member turns the setting off for a trip
- **THEN** it no longer appears in anyone else's results from the next request

### Requirement: Trips on the profile
The Profile screen SHALL have a "My trips" section listing the member's trips, soonest first, each with destination, dates and whether it is shared, with an "Add a trip" action, edit and delete. It SHALL show a clear empty state when there are none.

#### Scenario: Empty
- **WHEN** a member has no trips
- **THEN** the section says they have no trips yet and offers "Add a trip"

#### Scenario: Listing
- **WHEN** a member has trips
- **THEN** upcoming trips are listed soonest first with their destination, dates and sharing state

### Requirement: Past trips
A trip whose end date has passed SHALL be treated as past: it SHALL NOT appear in My trips on Discover or in anyone's overlap results, SHALL stay in the profile list marked as ended, and SHALL be deletable.

#### Scenario: A trip ends
- **WHEN** a trip's end date is before today
- **THEN** it is marked as ended on the profile and is not offered on Discover

### Requirement: Trips are private to their owner
A member's trips SHALL be readable and changeable only by that member. Other members and guests SHALL NOT be able to read, list or change them directly.

#### Scenario: Another member
- **WHEN** a member reads or edits another member's trip
- **THEN** nothing is returned or changed
