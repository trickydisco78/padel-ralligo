## ADDED Requirements

### Requirement: Collapsing screen headings
Home and Discover SHALL show their heading large at the top of the screen, and as the member scrolls the content up the heading SHALL shrink to a smaller title that stays visible, pinned below the status bar, for as long as they scroll.

#### Scenario: At the top
- **WHEN** Home or Discover is shown and not scrolled
- **THEN** the heading is large and, where the screen has one, the subtitle is shown under it

#### Scenario: Scrolling down
- **WHEN** the member scrolls the content down
- **THEN** the heading shrinks to a smaller size, the subtitle fades away, and the heading stays pinned and fully readable at the top of the screen
- **AND** the content scrolls underneath it, not behind it

#### Scenario: Scrolling back up
- **WHEN** the member scrolls back to the top
- **THEN** the heading grows back to its large size and the subtitle returns

#### Scenario: One heading per screen
- **WHEN** either screen is shown
- **THEN** it exposes exactly one heading to screen readers, the one in the pinned bar

#### Scenario: Search and filters
- **WHEN** the member scrolls Discover
- **THEN** only the title stays in place; search, filters and the Trips and Explore switch scroll away with the content

#### Scenario: Pull to refresh
- **WHEN** the member pulls the content down from the top on either screen
- **THEN** it refreshes as it did before, with the pinned heading staying where it is

#### Scenario: Status bar
- **WHEN** the screen is shown on a device with a notch or dynamic island
- **THEN** the heading sits below the status bar and is not covered by it
