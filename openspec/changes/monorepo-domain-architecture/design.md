# Design

## Context

Observed state (see proposal.md for motivation):

- pnpm workspaces + Turborepo already configured (`apps/*`, `packages/*`) with `check-types`, `lint` and `test` tasks.
- Existing packages: `@repo/core` (pure TS source package: `types`, `validation`, `filters`; own `@swc/jest` setup), `@repo/eslint-config`, `@repo/typescript-config`.
- `apps/mobile`: Expo SDK 58, Expo Router under `src/app` (`(auth)`, `(tabs)`), alias `@/* → src/*`, Jest via `jest-expo`.
- Data access is in `src/data/{destinations,listings,profile,trip,discover}.ts`, calling a singleton `supabase` client directly. Hooks use `useEffect`/`useState`; TanStack Query is not installed.
- Real domains today: destinations, profiles, listings (+ discover/trip read models), auth (session provider). No bookings code.

## Goals / Non-Goals

**Goals:**
- Domain logic, repositories, hooks and domain components live in workspace packages; `apps/mobile` is a thin composition layer.
- Each package has one explicit public entry point; internals are unreachable from consumers.
- Use cases are unit-testable with mock repositories, with no live Supabase.
- The app stays runnable and its tests green after every phase.

**Non-Goals:**
- No behaviour or visual changes, no new features, no schema changes.
- No per-package build step, no DI framework, no generic base repository, no separate backend.
- No speculative packages or empty layer directories.

## Decisions

1. **Source-only TypeScript packages** (`main`/`exports` → `src/index.ts`), as `@repo/core` already does. Metro (Expo SDK 58) resolves workspace packages natively. *Alternative:* build each package to `dist`, rejected as extra tooling for no gain here.
2. **Scope `@padel/*`**, done as an isolated mechanical Phase 0 so later diffs are about structure, not renames.
3. **Package set:** `ui`, `supabase`, `query`, then `destinations`, `profiles`, `listings`, `auth`. `@padel/core` is absorbed into domains; `utils`, `types` and `bookings` are not created until needed. `format.ts` goes to the domain or package that uses it.
4. **Public API via `exports`:** only `"."` by default (subpaths such as `@padel/ui/theme` only if justified). Infrastructure, mappers and DB types are not exported. `database.types.ts` lives only in `@padel/supabase` (never duplicated).
5. **Layering inside a domain** (created only where non-trivial): `domain/` → `application/` → `presentation/`, with `infrastructure/` depending on `domain/`. A package-level composition module wires the Supabase repository into use cases and hooks, so presentation never imports infrastructure. Thin CRUD domains (destinations, profiles) skip `application/` and DTOs until real logic appears; `listings` may warrant them for the create flow and filters.
6. **Repository contract** = one interface per aggregate in `domain/`, implemented in `infrastructure/` against `@padel/supabase`. Mappers translate DB rows to domain models. Use cases are plain functions taking a repository.
7. **TanStack Query:** `@padel/query` exports only a QueryClient factory. Query keys and hooks live in each domain package, with no global key registry. The root provider is added in `apps/mobile`. Introduced with `destinations` (Phase 3) and extended per domain.
8. **Boundary enforcement:** `eslint-plugin-boundaries` (or `no-restricted-imports` patterns) in the shared ESLint config enforces layer direction, `ui` ↛ domains, and bans `@padel/*/src/**` deep imports. Warnings first (Phase 1), errors in Phase 5. `package.json` `exports` is the second line of defence.
9. **Testing:** tests live in `<package>/tests` (or colocated for components), using `jest-expo` for packages with React Native code and the existing `@swc/jest` setup for pure TS. The `mock-supabase` helper moves into `@padel/supabase` (test export) or each package's tests.
10. **Auth is migrated first, and owns authentication only.** `profiles` and `listings` need the signed-in user, while the old session also decided "needs profile" by reading profiles, which would make `auth` and `profiles` depend on each other. `@padel/auth` therefore exposes `loading | signedOut | signedIn` and a minimal `AuthUser`; the app combines that with a profile-complete query into the route-guard status (`useAppStatus`). *Alternatives:* injecting a profile check into `SessionProvider` (auth keeps a concept it does not own), or an orchestration package importing both domains (an extra package for a single seam; revisit if more cross-domain flows appear). Phase 4 therefore runs `auth`, then `profiles`, then `listings`, one PR each.
11. **`@padel/core` remains**, shrunk to cross-domain primitives (`IsoDate`, `SkillTier`, `LevelWanted`, `FieldErrors`/`ValidationResult`, date helpers). Domain rules move to their owning domain (sign-up validation to `auth`; profile/trip rules to `profiles`; listing rules and filters to `listings`).
12. **Routes stay in `apps/mobile/src/app`.** Route files re-export screens or compose package components. Alias `@/*` remains for app-local code only.

## Risks / Trade-offs

- [Metro resolves duplicate `react`/`react-native` from package `node_modules`] → Phase 1 verifies a single copy; declare them as `peerDependencies` in packages; adjust `metro.config.js` only if needed.
- [TanStack Query changes loading/error/caching behaviour] → Introduce per domain, keep existing component tests green, and compare against the current screens' states.
- [Jest setup differs per package (swc vs jest-expo)] → Provide a shared Jest preset for RN packages in the shared config.
- [Over-abstraction in thin CRUD domains] → Skip `application/` and DTOs until logic exists; review at the end of each domain phase.
- [Conflict with in-progress `add-accounts-profiles-listings`] → Land or pause it before Phase 3; Phases 0 to 2 touch mostly moves and imports.
- [Large PRs] → One PR per phase, each independently shippable and revertible.

## Migration Plan

Phases (each ends with types, lint and tests green, and an app launch on a simulator):

0. Rename `@repo/*` → `@padel/*`.
1. Foundations: shared TS/ESLint/Jest presets, Metro/duplicate-React check, boundary rules as warnings.
2. Extract `@padel/supabase` and `@padel/ui`; no behaviour change.
3. Add `@padel/query`; migrate `destinations` as the reference domain.
4. Migrate `profiles`, `listings`, `auth` (in that order).
5. Promote boundary rules to errors, add architecture docs, delete leftovers in `apps/mobile/src/{data,lib,auth,components}`.

Rollback: each phase is its own PR and reverts independently; no data or schema changes are involved.
