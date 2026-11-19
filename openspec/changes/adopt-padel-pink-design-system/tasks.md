## 1. Tokens, fonts and dependencies

- [x] 1.1 Add `@expo-google-fonts/outfit` and `react-native-svg` (`expo install`); remove `@expo-google-fonts/plus-jakarta-sans`
- [x] 1.2 Read the artifact's `tokens.json` and write `packages/ui/scripts/generate-tokens.mjs`; generate `src/theme/tokens.ts` (colors, spacing, radius, type styles with family per weight, shadows)
- [x] 1.3 Test the token output: px to numbers, em letter spacing to px, 1.5 borders, all five font families present
- [x] 1.4 Load Outfit in `apps/mobile/src/app/_layout.tsx` and hold the splash until loaded
- [x] 1.5 Rework `ThemedText` and `ThemedView` onto the new type styles; remove old `Colors`, `Typeface`, `Radius`, `Spacing` names and fix every call site

## 2. Atoms

- [x] 2.1 `Icon` with `paths.ts` (26 icons from the artifact) on `react-native-svg`; list any icons the app uses that are missing and raise them
- [x] 2.2 `Button` (primary, secondary, choice pill) and `IconButton`; replace `PrimaryButton`, `SecondaryButton`, `Chip`
- [x] 2.3 `Badge`, `Avatar` (replaces `InitialsTile`)
- [x] 2.4 `Input` with focus state (pink border plus ring), error state and disabled state
- [x] 2.5 `Checkbox`, `Radio`, `Switch` (44 point rows, roles and checked state; Switch uses the built-in with `trackColor`)
- [x] 2.6 Tests per atom: roles, states, touch target, disabled behaviour

## 3. Molecules

- [x] 3.1 `FormField` (label, optional marker, helper, error with icon) wrapping `Input`; replace `TextField`
- [x] 3.2 `SearchField`
- [x] 3.3 `Card` with feature card and status banners; replace `NoticeBanner`
- [x] 3.4 Restyle `SegmentedControl` and `DateField` on the new tokens
- [x] 3.5 Tests per molecule

## 4. Organisms

- [x] 4.1 `BottomSheet` restyled (radius xl, slide, dimmed backdrop, backdrop and Android back dismissal, focus return); existing tests pass
- [x] 4.2 `AppBar` (large to scrolled title on scroll, overlay variant, safe-area top)
- [x] 4.3 Restyle `NativeTabs` in `apps/mobile/src/components/app-tabs.tsx` per design decision 6: pink tint, ink-soft inactive, Outfit labels, Android indicator and ripple pink100, filled active vs outline icons per tab on iOS and Android where the platform has a filled symbol (Discover and Matches have none)
- [ ] 4.4 Check tab labels and icons on iOS and Android, and note in the summary that the floating bar is not possible with native tabs
- [x] 4.5 Tests for each organism

## 5. Domain components

- [x] 5.1 `PlayerRow` in `@padel/players`; reconcile with `player-card` rather than duplicating
- [x] 5.2 `ProfileHeader` (hero with two clipped decorative circles) and `EditProfileForm` in `@padel/profiles`, composing the existing `profile-form`
- [x] 5.3 Create `packages/bookings` following "Adding a domain" (package files, turbo tag, `publicApi` test; `DOMAIN_PACKAGES` already lists `@padel/bookings`)
- [x] 5.4 `SlotPicker` (date chips and 3-column slot grid, selected and disabled state) and `BookingBar` in `@padel/bookings`, with tests
- [x] 5.5 Run `turbo boundaries` and lint to confirm `@padel/ui` imports no domain package

## 6. Apply across the app

- [x] 6.1 Move remaining call sites in `apps/mobile` and the `auth`, `listings`, `profiles`, `players`, `destinations` and `trips` packages onto the new components; delete the old components and unused `@expo/vector-icons` usage
- [x] 6.2 Update `docs/design-reference.md` and `docs/architecture.md` (package table, atomic structure, shared vs domain rule)
- [x] 6.3 Run type check, lint and tests at the root; fix failures
- [ ] 6.4 Run the app on iOS and Android; note Android shadow differences and any other visual deviations in the summary

## 7. Design system artifact

- [x] 7.1 Prepare a diff of artifact edits (shared vs domain marking, mismatches found, the TabBar organism not built because native tabs are kept) and show it to the user
- [x] 7.2 After confirmation, publish the edits to the artifact
