# Spec Delta

## Purpose
Shows a member who will be in the same place at the same time as each of their trips, and which matches are on there, without confirming anyone's availability to play.

## ADDED Requirements

### Requirement: My trips and Explore places
For a signed-in member, Discover SHALL offer a switch between "My trips" and "Explore places". A Guest SHALL see only Explore places and no switch. A member with at least one upcoming trip SHALL open on My trips, and a member without one SHALL open on Explore places.

#### Scenario: Member with trips
- **WHEN** a member with an upcoming trip opens Discover
- **THEN** My trips is selected

#### Scenario: Member without trips
- **WHEN** a member with no upcoming trip opens Discover
- **THEN** Explore places is selected and My trips is still offered

#### Scenario: Guest
- **WHEN** a Guest opens Discover
- **THEN** there is no My trips option and no trip data is requested

### Requirement: Saved trips row
My trips SHALL show the member's upcoming trips as a horizontally scrollable row of cards, soonest first. Each card SHALL show the destination, the country and the dates, and the number of days and of overlapping players ("8 days · 3 players overlap"). Exactly one card SHALL be selected, marked visibly and to assistive technology. The soonest trip, or the one under way today, SHALL be selected first.

#### Scenario: Selecting a trip
- **WHEN** the member taps another trip card
- **THEN** it becomes selected and the players and matches below change to that trip

#### Scenario: Days and overlap counts
- **WHEN** a trip runs from 14 to 21 June and three listed players share overlapping trips to the same destination
- **THEN** its card reads "8 days · 3 players overlap"

#### Scenario: No overlap
- **WHEN** no listed player shares an overlapping trip
- **THEN** the card reads "8 days · No overlaps yet"

#### Scenario: No upcoming trips
- **WHEN** the member has no upcoming trip
- **THEN** My trips shows a message and an "Add a trip" action that opens the trips section of their profile

### Requirement: Players who overlap a trip
For the selected trip, the Players list SHALL show listed players who have a shared trip to the same destination whose dates overlap, never the member themselves.

#### Scenario: Not shared or not listed
- **WHEN** another player's trip is not shared, or the player is not listed in Find players
- **THEN** they are not shown and are not counted

#### Scenario: Other destinations
- **WHEN** another player's shared trip overlaps in time but is to a different destination
- **THEN** they are not shown

#### Scenario: Overlap is not availability
- **WHEN** players are shown
- **THEN** the screen says that play times are not confirmed

### Requirement: What an overlapping player shows
Each entry SHALL show the first name and last initial, the destination, the other player's trip dates, the number of overlapping days and the skill tier. Days SHALL be counted inclusively, and when the overlap is the whole of the member's trip the text SHALL say "All N days overlap". Entries SHALL be ordered by most overlapping days, then name.

#### Scenario: Partial overlap
- **WHEN** the member's trip is 14 to 21 June and another player's shared trip is 17 to 23 June
- **THEN** that player is shown with "5 days overlap" and their dates "Jun 17–23"

#### Scenario: Full overlap
- **WHEN** another player's shared trip covers the whole of the member's trip
- **THEN** the entry says "All 8 days overlap"

#### Scenario: Single shared day
- **WHEN** the trips share only one day
- **THEN** the entry says "1 day overlap"

#### Scenario: Ordering
- **WHEN** several players overlap
- **THEN** the one with the most overlapping days comes first, and ties are ordered by name

### Requirement: This week, My level and search
My trips SHALL offer "This week" (only overlaps that include a day of the current calendar week, Monday to Sunday), "My level" (only players at the member's skill tier or the tier next to it) and a search over the overlapping players' names. Filters SHALL combine.

#### Scenario: This week
- **WHEN** the member turns on "This week" and the trip does not overlap this week for a player
- **THEN** that player is not shown

#### Scenario: My level
- **WHEN** the member turns on "My level" and is Intermediate
- **THEN** only Beginner, Intermediate and Advanced players within one tier are shown, which is all three tiers for Intermediate

#### Scenario: My level at an end
- **WHEN** the member is Beginner and turns on "My level"
- **THEN** only Beginner and Intermediate players are shown

#### Scenario: Name search
- **WHEN** the member types part of a name
- **THEN** only overlapping players whose displayed name contains it are shown

### Requirement: Open matches for the trip
With a trip selected, "Open matches" SHALL show open matches at the trip's destination whose dates fall within or overlap the trip, with their count on the switch.

#### Scenario: Matches during the trip
- **WHEN** a trip to Málaga runs 14 to 21 June and an open match in Málaga is on 17 June
- **THEN** the match is shown, and a match in Málaga on 30 June is not

### Requirement: Notice and heading
With a trip selected, My trips SHALL show the notice "Showing matches for {destination}, {dates}. Play times aren't confirmed yet." and the list heading "Players in {destination}" with the number of overlapping players.

#### Scenario: Notice
- **WHEN** the Málaga trip is selected
- **THEN** the notice names Málaga and the trip dates

### Requirement: Loading, empty, error and accessibility
My trips SHALL show loading, empty and error states with a retry, expose each trip card with its destination, dates, counts and selected state, and expose each player entry with name, destination, dates, overlap and tier.

#### Scenario: Error
- **WHEN** overlap results cannot be loaded
- **THEN** a message with a retry action is shown and the saved trips row stays visible

#### Scenario: Screen reader
- **WHEN** a screen reader focuses a trip card
- **THEN** it announces destination, dates, days, overlap count and whether it is selected
