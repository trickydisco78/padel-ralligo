# Spec Delta

## REMOVED Requirements

### Requirement: Account call to action for visitors
**Reason**: Guests should be led into discovery, not registration. Accounts are requested in context when an action needs one.
**Migration**: Use the contextual authentication sheet and the Profile tab. Home SHALL NOT show any sign-in or create-account entry for Guests.

## MODIFIED Requirements

### Requirement: Match cards on Home
Matches on Home SHALL use the same card as Discover, SHALL NOT require sign in to view, and selecting one SHALL open its match details.

#### Scenario: Visitor views a match
- **WHEN** a signed-out visitor views Home
- **THEN** match cards are shown and selecting one opens its details without a sign-in prompt

## ADDED Requirements

### Requirement: Discovery first
Home SHALL keep the heading "Find your next padel game" and the text "Meet players at your level, at home or on holiday.", and SHALL NOT show a large registration promotion. It SHALL offer a way to search for a destination that opens Discover.

#### Scenario: Guest views Home
- **WHEN** a Guest opens Home
- **THEN** the heading, description, search entry, destinations and upcoming games are shown and no "Join in" card or sign-in entry is shown

#### Scenario: Search from Home
- **WHEN** the user selects the search entry
- **THEN** Discover opens ready for a destination search
