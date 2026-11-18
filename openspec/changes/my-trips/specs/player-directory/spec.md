# Spec Delta

## MODIFIED Requirements

### Requirement: What a player card shows
A player card SHALL show the first name and the initial of the last name, the home destination, the sport, the skill tier and a button. The button SHALL read "Sign in" for a Guest and "Connect" for a signed-in member. It SHALL NOT show an email address, phone number, bio, free-text home city, trip, user identifier, photo, or any other profile field.

#### Scenario: Guest views a card
- **WHEN** a Guest views a player card
- **THEN** only first name with last initial, home destination, "Padel", skill tier and "Sign in" are shown

#### Scenario: Single-word name
- **WHEN** a player's display name is a single word
- **THEN** the card shows that word and no initial

#### Scenario: No profile page
- **WHEN** a user taps a player card outside its button
- **THEN** no profile page opens

### Requirement: Connect is not yet active
Each card SHALL show a button. For a Guest ("Sign in") it SHALL open the sign-in prompt. For a signed-in member ("Connect") it SHALL open a bottom sheet saying "To be developed". No connection SHALL be created.

#### Scenario: Guest taps Connect
- **WHEN** a Guest taps the button on a card (labelled "Sign in")
- **THEN** a sheet titled "Connect with players" offers "Create account", "Sign in" and "Dismiss", and the Players list stays as it was if dismissed

#### Scenario: Member taps Connect
- **WHEN** a signed-in member taps "Connect"
- **THEN** a sheet titled "Connect with players" says "To be developed", it can be dismissed with its close control, by tapping outside or with Android back, and nothing is sent

## ADDED Requirements

### Requirement: Explore places for guests
For a Guest, Explore places SHALL show the label "Explore public players", the heading "Find your next game.", the text "Browse player cards by location. No trip required." and the notice "Public profile only: area and level. Trip dates stay private."

#### Scenario: Guest opens Discover
- **WHEN** a Guest opens Discover
- **THEN** the label, heading, text and notice above are shown and no trip data is requested

### Requirement: Explore places list
Explore places SHALL label the destination chips "Explore near", head the list "Public players in {destination}" (or "Public players" when no destination is chosen) with the number of results, and use the search hint "Search a city". For a signed-in member the heading SHALL be "Find your kind of game.". Names SHALL NOT be searched there.

#### Scenario: Destination chosen
- **WHEN** the user chooses Málaga
- **THEN** the list is headed "Public players in Málaga" with the number of results

#### Scenario: Search hint
- **WHEN** Explore places is shown
- **THEN** the search field says "Search a city" because names are not searched there

#### Scenario: Member heading
- **WHEN** a signed-in member opens Explore places
- **THEN** the heading reads "Find your kind of game." 
