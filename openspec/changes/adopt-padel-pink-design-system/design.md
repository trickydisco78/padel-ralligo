# Design

## Context

See `proposal.md`. Current state: `@padel/ui` has 14 flat components, `theme/tokens.ts` (green, Plus Jakarta Sans, `Colors.light`, `Spacing`, `Radius`), and uses `@expo/vector-icons` (`Ionicons` in `PrimaryButton`, plus app screens). The app uses `NativeTabs` from `expo-router`. Domain packages own their presentation components; `turbo boundaries` tags `@padel/ui` as `shared` and denies it any domain dependency. Padel Pink is web HTML/CSS with `tokens.json`; it was written without sight of this code, so some parts will not map one to one.

## Goals / Non-Goals

**Goals:** one token source; atoms/molecules/organisms in `@padel/ui`; domain components in domain packages; same public behaviour of existing screens.
**Non-Goals:** dark mode, new screens, booking data or logic, a design-token build pipeline beyond a one-off generation script.

## Decisions

1. **Tokens are a checked-in `tokens.ts`, generated once from `tokens.json` by a small script (`packages/ui/scripts/generate-tokens.mjs`), not at build time.** Names follow the translation table: `colors.pink500`, `spacing.space4`, `radius.lg`, `type.displayXl`. px become numbers; `letterSpacing` em becomes px (em x fontSize); shadows become React Native shadow objects (iOS) plus `elevation` (Android). *Alternative:* build-time generation: more moving parts for one source file. Re-run the script when the artifact changes.
2. **Old token names are removed, not aliased.** `Colors.light.primary` and friends are replaced and call sites updated in this change. *Alternative:* keep aliases for a soft migration; rejected because aliases would keep the green semantics alive and the app is small enough to migrate at once.
3. **Fonts:** `@expo-google-fonts/outfit` with `Outfit_400Regular` to `Outfit_800ExtraBold`, loaded in the root layout with the splash held until ready. Text styles are `{ fontFamily, fontSize, lineHeight, letterSpacing }`; `ThemedText` maps its `type` prop onto the design system's styles. No `fontWeight`.
4. **Folder layout** in `packages/ui/src/components/{atoms,molecules,organisms}/<Name>/` with `<name>.tsx`, `index.ts` and a test. The package `index.ts` stays the only public entry. Old names are mapped as follows; each old name is deleted once call sites move.

   | Old | New |
   | --- | --- |
   | `PrimaryButton`, `SecondaryButton`, `Chip` | `Button` (variants `primary`, `secondary`, `choice`) and `IconButton` |
   | `TextField` | `Input` (atom) wrapped by `FormField` (molecule) |
   | `CheckRow` | `Checkbox` (also `Radio`, `Switch` rows) |
   | `InitialsTile` | `Avatar` (keeps `initialsOf` and `tileColorFor` helpers if still used) |
   | `NoticeBanner` | `Card` status banner variants |
   | `BottomSheet` | `BottomSheet` organism, behaviour kept (title, focus return, Android back) |
   | `SegmentedControl`, `DateField`, `Logo`, `ThemedText`, `ThemedView` | kept; restyled on the new tokens. Placed as molecule, molecule, atom, atom, atom |

5. **Icons:** path data moves from the artifact's `Icon/preview.html` to `atoms/Icon/paths.ts`, rendered with `react-native-svg` (24x24 grid, 1.8 stroke, round caps and joins; props `name`, `color`, `size`; the active tab icon is also filled). `@expo/vector-icons` is removed from `@padel/ui` and the app once unused. Icons the app needs that are not in the 26 (e.g. arrow, chevron) are checked against the set first; any gap is listed in tasks and raised rather than invented.
6. **Keep `NativeTabs` and restyle it; no custom `TabBar`.** The platform draws the bar, so the floating pill, radius, border and shadow from the design system are not possible and are deferred. What we apply from `app-tabs.tsx`:
   - `tintColor` pink500 and `iconColor` `{ default: ink-soft, selected: pink500 }`;
   - `labelStyle` in Outfit (`Outfit_600SemiBold`, 12 for default and selected), selected label pink700 for text contrast;
   - Android `indicatorColor` pink100 and `rippleColor` pink100;
   - `backgroundColor` surface (no effect on iOS 26+, where the system draws the bar);
   - filled icon for the active tab and outline for the others: SF Symbols on iOS (`house.fill` vs `house`), Material on Android (filled vs outlined variants), chosen per tab;
   - iOS 26 `minimizeBehavior` left at the system default.
   The design system's SVG `Icon` cannot be used in the bar (icons must be SF Symbols, drawables or image files). Exporting the set as PNGs for `src` is a possible later step. *Alternative:* a custom `tabBar` on the JS `Tabs` navigator: matches the design but loses native tab behaviour; deferred by the user.
7. **BottomSheet** stays a React Native `Modal` with a slide animation and dimmed backdrop. No sheet library is added without asking.
8. **AppBar** uses `useSafeAreaInsets().top`, switches from large to scrolled title from an `Animated` scroll value, and has an overlay variant over a hero.
9. **Domain components** are built from `@padel/ui` pieces and exported from their package: `PlayerRow` in `@padel/players` (the existing `player-card` is reviewed and either replaced or composed with it, not duplicated); `ProfileHeader` and `EditProfileForm` in `@padel/profiles` (the latter composes the existing `profile-form` rather than a second form); `SlotPicker` and `BookingBar` in new `@padel/bookings`.
10. **New package `@padel/bookings`** follows "Adding a domain" in `docs/architecture.md`: `package.json`, `tsconfig.json`, `eslint.config.mjs`, `jest.config.cjs`, `turbo.json` tag and `publicApi` in the package-exports test. `@padel/bookings` is already listed in `DOMAIN_PACKAGES` in `boundaries.js`, so the package takes that name rather than `booking`. It contains `presentation/` only until a booking feature exists; no `composition.ts` or repository.
11. **Shadows:** `shadow-brand` (pink500, 0/10, 0.32, radius 11, elevation 8), `shadow-float` (ink, 0/12, 0.16, radius 16, elevation 10), `shadow-card` (ink, 0/8, 0.05, radius 12, elevation 2). Android will look different (elevation is grey); this is reported in the apply summary rather than worked around.
12. **Artifact update** happens last: a diff of proposed edits (shared/domain marking, mismatches such as the TabBar organism, which the app cannot build while it uses native tabs) is shown to the user before anything is published.

## Risks / Trade-offs

- Whole-app visual change at once → migrate component by component with tests green at each step; run the app on iOS and Android before finishing.
- Outfit not loaded for a weight → fall back to system font; tests assert the font map covers all five weights.
- Tab bar will not match the floating design → accepted for now (decision 6); the artifact update records it as a platform limit.
- Artifact written without the codebase may specify things the app cannot do (e.g. `:has()` CSS, web-only focus rings, a floating tab bar) → translated per the rules in tasks; mismatches recorded for the artifact update.
- `react-native-svg` adds a native dependency → install via `expo install` to get the SDK-matched version; needs a dev build if Expo Go lacks it (Expo Go bundles it).

## Migration Plan

1. Land tokens and fonts, with old names removed and call sites fixed, so the app runs green-free.
2. Atoms, then molecules, then organisms, deleting each old component as its call sites move.
3. Move domain components and create `@padel/bookings`.
4. Restyle the native tab bar.
5. Update docs, then the artifact.

Rollback: it is one branch; revert the merge. No data or database changes.

## Open Questions

- Whether `@padel/bookings` should be tagged `domain-base` or `domain-feature`. It has no dependencies on other domains now, so `domain-base` is likely; confirm when creating it.
