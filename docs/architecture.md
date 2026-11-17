# Architecture

The monorepo is the main organisational and dependency boundary. Domain logic, data access, hooks and
reusable UI live in workspace packages (`@padel/*`). `apps/mobile` is a thin composition layer: routes,
navigation, providers and platform config.

Background and decisions: `openspec/changes/monorepo-domain-architecture/` (proposal, design, tasks).

## Packages

| Package | Owns |
| --- | --- |
| `@padel/ui` | Design tokens, theme and reusable components (button, chip, card, text and date fields, themed text and view, logo). No domain knowledge. |
| `@padel/supabase` | The one Supabase client, secure session storage, generated database types, and a `/testing` fake client. |
| `@padel/query` | The shared TanStack Query client (no retries, refetch on mount), a provider, and a `/testing` provider and `render`. |
| `@padel/core` | Cross-domain primitives only: `IsoDate`, `SkillTier`, `FieldErrors` / `ValidationResult`, date and time helpers. Pure TypeScript. |
| `@padel/auth` | Authentication: session provider and `useSession`, sign-in and sign-up screens, sign-in prompt, sign-up validation. |
| `@padel/destinations` | Destinations and their open-game counts, `useDestinations`, `DestinationPicker`. |
| `@padel/profiles` | Profiles, skill tier and saved trips: rules, repositories, hooks, `ProfileForm`, `TripSection`, `ProfileSetupScreen`. |
| `@padel/listings` | Listings: rules and filters, repository, hooks, `ListingForm`, `ListingCard`, `MyListings`. |
| `@padel/eslint-config`, `@padel/typescript-config`, `@padel/jest-config` | Shared tooling presets. `@padel/eslint-config/boundaries` enforces the rules below. |

`apps/mobile` owns Expo Router routes, `RootStack` (the route guard), the tab navigator, root providers, and
screens that combine several domains (Home, Discover, Profile tab).

## Dependency rules

```
apps/mobile ──► domains, ui, query, supabase
profiles    ──► auth, destinations     listings ──► auth, destinations
domains     ──► ui, supabase, core, @tanstack/react-query (directly; @padel/query is for the app and tests)
ui, supabase, query, core ──► (no other @padel package; ui may use core)
```

- A package is used only through its public entry point (`package.json` `exports`). Deep imports such as
  `@padel/destinations/src/...` are lint errors. Only `.` is exported, plus `/testing` on `supabase` and `query`.
- `@padel/ui` must not depend on a domain package.
- No cycles. `auth` knows authentication only. Whether a signed-in user still needs a profile is decided in
  the app (`useAppStatus`), by combining `useSession` with `useProfileComplete`.
- Inside a domain package: `domain` depends on nothing in the package; `application` may use `domain`;
  `infrastructure` may use `domain`; `presentation` may use `application` and `domain` but never
  `infrastructure`. `src/composition.ts` is the one place that wires a Supabase repository into the package.
- Not every domain has every layer. Add `application/` only when there is logic beyond calling a repository.

## Conventions

- **Repositories:** one interface per aggregate in `domain/`, implemented in `infrastructure/` against
  `TypedSupabaseClient`, with row-to-model mappers. No generic base repository. The database types live only in
  `@padel/supabase`.
- **Queries:** query keys and hooks live in the owning domain (`['destinations']`, `['profile', userId]`,
  `['listings', ...]`). Mutations return after invalidating what they changed.
- **Public API:** export hooks, screens, components and domain types. Do not export repositories, mappers,
  composition or database types.
- **Tests:** next to the package (`tests/` or `src`). Test domain rules and mappers directly, repositories against
  `@padel/supabase/testing`, and components with `render` from `@padel/query/testing`. Use
  `jest.mock('@padel/supabase', () => jest.requireActual('@padel/supabase/testing'))`. No live Supabase in unit tests.
- **Jest in tests:** use the test provider, not the real one. It disables cache clean-up timers that would
  otherwise keep Jest running for minutes.

## Adding a domain

1. Create `packages/<name>` with `package.json` (`main` and `exports` set to `src/index.ts`), `tsconfig.json`,
   `eslint.config.mjs` and `jest.config.cjs`, copied from a small existing domain such as `destinations`.
2. Add `src/{domain,infrastructure,presentation}` as needed, plus `src/composition.ts` and `src/index.ts`.
3. Add the package to `publicApi` in `packages/eslint-config/tests/package-exports.test.mjs`, and to
   `DOMAIN_PACKAGES` in `packages/eslint-config/boundaries.js` so `@padel/ui` cannot import it.
4. Consume it from `apps/mobile` (a route re-export or a composed screen).

## Enforcement

- `pnpm lint` fails on boundary violations. `pnpm test` runs `packages/eslint-config/tests`, which check that the
  lint rules fire and that each package exposes only its intended entry points.
- Supabase row-level security is tested separately with `pnpm test:rls` (needs a dev database).
