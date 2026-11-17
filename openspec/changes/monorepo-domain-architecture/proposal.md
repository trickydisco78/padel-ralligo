# Proposal

## Why

`apps/mobile` currently owns everything: about 900 lines of data access, Supabase setup and auth under `src/{data,lib,auth}`, plus roughly 25 components under `src/components`. Domain logic, persistence and UI are intermixed and fetched with ad-hoc `useEffect` hooks, with no enforced boundaries. Moving them into workspace packages with explicit public APIs makes ownership clear, makes use cases testable without Supabase, and keeps the Expo app a thin composition layer as the product grows (messaging, matches).

## What Changes

This is a pure refactor: **no user-visible behaviour changes** (hence `skip_specs`).

- Rename the workspace scope `@repo/*` → `@padel/*` (`core`, `eslint-config`, `typescript-config`).
- Extract `@padel/supabase` (client, secure storage, config, generated `database.types.ts`) from `apps/mobile/src/lib`.
- Extract `@padel/ui` (design tokens, theme, primitives such as button, chip, card, text field, themed text/view, logo) from `apps/mobile/src/components` and `constants/theme.ts`. It must not depend on any domain package.
- Add TanStack Query via a small `@padel/query` package (QueryClient factory only) and replace `useEffect` data fetching with query hooks as each domain migrates. **This is a behaviour-sensitive dependency change** (loading, error and caching behaviour); it is applied per domain, not globally.
- Create domain packages, migrated in order: `@padel/destinations` (reference implementation), then `@padel/profiles`, `@padel/listings`, `@padel/auth`. Each owns its model, repository contract, Supabase repository, mapper, hooks and domain components, and exposes a single public entry point via `package.json` `exports`.
- Fold `@padel/core` (formerly `@repo/core`) into the domains as they migrate. It is removed, or left only if cross-domain pure types remain.
- Add boundary enforcement: ESLint rules for layer direction and a ban on deep imports (`@padel/*/src/**`), initially as warnings and promoted to errors in the final phase.
- Reduce `apps/mobile/src` to Expo Router routes, root providers, assets and platform config.
- **Out of scope:** a `bookings` domain (no code exists yet), a separate backend or API, a DI framework, generic base repositories, `@padel/utils` and `@padel/types` packages (created only if a real need appears), renaming `src/app` to `app`.

## Capabilities

### New Capabilities

None. No requirement-level behaviour changes.

### Modified Capabilities

None.

## Impact

- **Code:** `apps/mobile/src/**` (moved out), `packages/*` (new and renamed), root `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `tsconfig`/ESLint presets, `apps/mobile/metro.config.js` (if needed), Jest configs (per-package `jest-expo` presets).
- **Dependencies:** adds `@tanstack/react-query`; no other new runtime dependencies.
- **Tests:** existing tests in `apps/mobile/src/__tests__` move into the package that owns the code; the shared `mock-supabase` helper is re-homed.
- **Other changes:** `add-accounts-profiles-listings` is still in progress (25/33 tasks) and touches the same files. Land or pause it before Phase 3 starts to avoid conflicts.
- **Unchanged:** `supabase/` migrations and RLS tests.
