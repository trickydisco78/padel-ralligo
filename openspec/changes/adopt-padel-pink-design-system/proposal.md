# Proposal

## Why

The app's look is a rough estimate from one mock (emerald green, Plus Jakarta Sans, 14 flat components in `@padel/ui`). A complete design system, "Padel Pink", now exists (Claude artifact, built without access to this codebase): tokens, 17 components and four page mocks, organised as atoms, molecules and organisms. We want one source of truth for the look, a shared component set that follows its structure, and a clear rule for what is shared and what belongs to a domain.

## What Changes

- **Tokens:** replace the green palette and Plus Jakarta Sans with Padel Pink: pink palette, status colours, Outfit (one font family per weight), spacing, radius and shadow tokens, generated from the design system's `tokens.json`. Fonts must load before the first screen renders.
- **Structure:** `@padel/ui` components move into `atoms/`, `molecules/` and `organisms/`, shared components only.
  - Atoms: Button (primary, secondary, choice pill, icon button), Badge, Icon, Avatar, Input, Checkbox, Radio, Switch.
  - Molecules: FormField, SearchField, Card (with feature card and status banners).
  - Organisms: AppBar, BottomSheet.
- **Migration:** existing components (`PrimaryButton`, `SecondaryButton`, `Chip`, `TextField`, `CheckRow`, `InitialsTile`, `NoticeBanner`, `SegmentedControl`, `DateField`, `Logo`) are mapped onto the new components and their call sites updated. Components with no design-system equivalent are kept and restyled, or removed with a stated reason.
- **Icons:** the 26-icon set becomes SVG path data rendered with `react-native-svg`, replacing `@expo/vector-icons` in the app.
- **Domain UI stays out of `@padel/ui`:** `PlayerRow` goes to `@padel/players`; `ProfileHeader` and `EditProfileForm` to `@padel/profiles`; `SlotPicker` and `BookingBar` to a **new `@padel/bookings` package**. `@padel/ui` never imports a domain package.
- **Tab bar:** keep native tabs and restyle them with the design's colours, Outfit labels and filled active icons. The floating pill bar is not possible with native tabs and is deferred; the `TabBar` organism is not built in this change.
- **Docs and artifact:** update `docs/design-reference.md` and `docs/architecture.md`; afterwards update the Claude design system artifact to mark shared vs domain components and fix mismatches found in the code (diff confirmed with the user before publishing).
- **Out of scope:** dark theme; redesigning screens beyond applying the new components and tokens; booking data, availability or payments (`@padel/bookings` holds presentation components only for now); new product behaviour.

## Capabilities

### New Capabilities
- `design-system`: the shared visual language and component rules: tokens, fonts, the atoms/molecules/organisms structure, accessibility and touch-target rules, and the shared-vs-domain placement rule.

### Modified Capabilities
- `app-shell`: the bottom tab bar is restyled with the design system's colours, font and filled active icon (same five tabs, same order).

## Impact

- **Code:** `packages/ui` (tokens, all components, tests, `index.ts`); call sites in `apps/mobile` (`_layout.tsx`, `discover.tsx`, `app-tabs.tsx` (restyle only), `discover-filters.tsx`, `placeholder-screen.tsx`) and in `auth`, `listings`, `profiles`, `players`, `destinations` and `trips` presentation components.
- **New package:** `packages/booking` (tags, boundaries config and package-exports test updated).
- **Dependencies:** add `@expo-google-fonts/outfit` and `react-native-svg`; remove `@expo-google-fonts/plus-jakarta-sans`. `@expo/vector-icons` removed from `@padel/ui` once nothing uses it. No sheet library is added without asking.
- **Docs:** `docs/design-reference.md`, `docs/architecture.md`.
- **Risks:** a visual change across every screen; Android shadows are approximate; Outfit weights must all be loaded or text falls back to the system font.
