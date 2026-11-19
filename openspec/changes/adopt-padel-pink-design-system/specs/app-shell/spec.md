# Spec Delta

## MODIFIED Requirements

### Requirement: Bottom tab navigation
The app SHALL provide a native bottom tab bar with five tabs labelled "Home", "Discover", "Create", "Matches" and "Profile", in that order, visible to signed-in and signed-out users. The bar SHALL use the design system's colours and font, with the active tab shown in brand pink, with a filled icon where the platform has a filled symbol for it, and inactive tabs in the soft ink colour with outline icons.

#### Scenario: Switching tabs
- **WHEN** the user taps the "Matches" tab
- **THEN** the Matches screen (or the sign-in prompt for a visitor) is shown and the tab is marked as active

#### Scenario: Placeholder screens
- **WHEN** a signed-in user opens the "Matches" tab
- **THEN** a placeholder screen with a title and short "coming soon" message is displayed

#### Scenario: Create and Profile tabs
- **WHEN** a signed-in user opens the "Create" or "Profile" tab
- **THEN** the listing form or the profile screen is shown, not a placeholder

#### Scenario: Active and inactive styling
- **WHEN** any tab is active
- **THEN** its icon and label are brand pink, its icon is filled where the platform has a filled symbol for it, and the other four tabs show outline icons in the soft ink colour
