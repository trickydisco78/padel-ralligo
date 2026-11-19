# Spec Delta

## Purpose

Defines the shared visual language of the app and the rules for shared user-interface components, so every screen looks consistent and shared and domain-specific UI stay separate.

## ADDED Requirements

### Requirement: Tokens are the single source of visual values
The app SHALL take every colour, font style, spacing step, radius and shadow from one token set derived from the Padel Pink design system, and components SHALL NOT hard-code these values.

#### Scenario: Brand colour
- **WHEN** any screen shows a primary action or selected state
- **THEN** it uses the brand pink token, and small pink text on white or soft pink uses the darker text pink

#### Scenario: Hairlines
- **WHEN** a card, divider or control border is drawn
- **THEN** it is 1.5 points wide, not the platform hairline width

### Requirement: Outfit typeface loaded before first screen
The app SHALL render text in Outfit, using a separate font family for each weight, and SHALL NOT render the first screen until the fonts are loaded.

#### Scenario: Cold start
- **WHEN** the app starts
- **THEN** the splash stays visible until the fonts are loaded, and no text appears in a fallback font

#### Scenario: Android weights
- **WHEN** bold text is shown on Android
- **THEN** it uses the bold font family rather than a font-weight style

### Requirement: Shared components follow the atomic structure
Shared UI SHALL be organised as atoms, molecules and organisms. A level SHALL be built only from the levels below it and SHALL NOT restyle them.

#### Scenario: Placement
- **WHEN** a new shared component is added
- **THEN** it is an atom (one element), a molecule (a few atoms as one unit) or an organism (a self-contained screen section), and is exported from the UI package's public entry point

#### Scenario: Reuse before adding
- **WHEN** a screen needs a pattern that appears on only one screen
- **THEN** it is composed from existing components, or placed in the owning domain, rather than added to the shared set

### Requirement: Domain-specific UI lives in its domain
A component that depends on domain concepts (players, profiles, bookings) SHALL live in that domain's package, and the shared UI package SHALL NOT depend on any domain package.

#### Scenario: Player row
- **WHEN** a list needs a player row
- **THEN** it uses the component from the players package, built from shared atoms and molecules

#### Scenario: Boundary check
- **WHEN** the shared UI package imports a domain package
- **THEN** the repository's lint and boundary checks fail

### Requirement: Interactive components are accessible
Every interactive shared component SHALL have at least a 44 point touch target, an accessibility role, and its state exposed to assistive technology. Colour SHALL NOT be the only signal of an error or status.

#### Scenario: Checkbox row
- **WHEN** a checkbox row is rendered
- **THEN** the label is part of the touch target and the checked state is announced

#### Scenario: Field error
- **WHEN** a form field is in error
- **THEN** an error icon and message appear below it, and the message replaces the helper text

### Requirement: Form fields show label, helper and error
A form field SHALL show an always-visible label above the input, optional helper text below, and an error message that replaces the helper. Focus SHALL be shown by a pink border and a soft pink ring.

#### Scenario: Focus
- **WHEN** an input receives focus
- **THEN** its border turns brand pink and a soft pink ring appears around it

#### Scenario: Optional field
- **WHEN** a field is optional
- **THEN** its label row shows "Optional" on the right and required fields carry no asterisk

### Requirement: Bottom sheet dismissal
The bottom sheet SHALL slide up over a dimmed backdrop and SHALL close on a backdrop tap and on the Android back button.

#### Scenario: Backdrop tap
- **WHEN** the user taps the dimmed backdrop
- **THEN** the sheet closes and focus returns to the control that opened it
