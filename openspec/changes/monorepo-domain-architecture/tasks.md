# Tasks

## 1. Phase 0: Rename scope

- [x] 1.1 Rename `@repo/core`, `@repo/eslint-config`, `@repo/typescript-config` to `@padel/*` in package manifests and all imports/configs
- [x] 1.2 Reinstall, then run check-types, lint and tests; launch the app on a simulator

## 2. Phase 1: Workspace foundations

- [ ] 2.1 Standardise shared tsconfig presets (strict, `verbatimModuleSyntax`/type-only imports) and ESLint flat config across packages
- [ ] 2.2 Add a shared Jest preset for React Native packages alongside the pure-TS setup
- [ ] 2.3 Verify Metro resolves workspace packages and that only one `react`/`react-native` is installed; add `metro.config.js` changes only if needed
- [ ] 2.4 Add boundary lint rules (layer direction, `ui` ↛ domains, no `@padel/*/src/**` deep imports) as warnings

## 3. Phase 2: Shared packages

- [ ] 3.1 Create `@padel/supabase`: move `supabase.ts`, `secure-storage`, `supabase-config`, `database.types.ts` and their tests; expose via a single entry point
- [ ] 3.2 Create `@padel/ui`: move tokens/theme, `global.css` and primitives (button, chip, card, text field, themed text/view, check row, logo) and their tests
- [ ] 3.3 Update `apps/mobile` imports to the package entry points; confirm `ui` has no domain imports
- [ ] 3.4 Run check-types, lint and tests; launch the app and compare screens before/after

## 4. Phase 3: Query and destinations (reference domain)

- [ ] 4.1 Create `@padel/query` (QueryClient factory) and wire the provider in `apps/mobile` root layout
- [ ] 4.2 Create `@padel/destinations`: domain model, repository contract, Supabase repository, mapper, `useDestinations` query hook, `destination-picker`
- [ ] 4.3 Write mapper and use-case/repository tests with a mock repository (no live Supabase)
- [ ] 4.4 Point existing routes/screens at the package; remove `data/destinations.ts` and `data/use-destinations.ts`
- [ ] 4.5 Verify loading/error states match prior behaviour; run all checks and launch the app

## 5. Phase 4: Remaining domains

- [ ] 5.1 Migrate `@padel/profiles` (model, validation, repository, hooks, `profile-form`, `skill-tier-picker`) with tests
- [ ] 5.2 Migrate `@padel/listings` (model, filters, repository, hooks, `listing-form`, `listing-card`, `my-listings`, `trip-section`, discover/trip read models) with tests; add `application/` and DTOs only where logic warrants
- [ ] 5.3 Migrate `@padel/auth` (session provider, sign-in/sign-up forms, `sign-in-prompt`, route-guard helpers) preserving auth and navigation behaviour
- [ ] 5.4 Fold remaining `@padel/core` content into its owning domains and remove the package (or document why it remains)
- [ ] 5.5 Re-home `mock-supabase` and move tests next to the code they cover; run Supabase RLS tests unchanged

## 6. Phase 5: Enforcement and cleanup

- [ ] 6.1 Promote boundary lint rules to errors and confirm a deliberate violating import fails lint
- [ ] 6.2 Confirm each package's `exports` exposes only its public API (no infrastructure, mappers or DB types)
- [ ] 6.3 Delete obsolete code in `apps/mobile/src/{data,lib,auth,components}`; confirm `apps/mobile/src` holds only routes, providers and assets
- [ ] 6.4 Document the architecture and package conventions (README/docs) and record the conventions for future domains
- [ ] 6.5 Final run: check-types, lint, tests, RLS tests and app launch on iOS and Android
