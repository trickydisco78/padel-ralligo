# Architecture

The monorepo is the main organisational and dependency boundary. Domain logic, data access, hooks and
reusable UI live in workspace packages (`@padel/*`). `apps/mobile` is a thin composition layer: routes,
navigation, providers and platform config.

Background and decisions: `openspec/changes/monorepo-domain-architecture/` (proposal, design, tasks).

## Packages

| Package | Owns |
| --- | --- |
| `@padel/ui` | Design tokens, theme and reusable components (buttons, chip, card, text and date fields, themed text and view, logo, `BottomSheet`). No domain knowledge. |
| `@padel/supabase` | The one Supabase client, secure session storage, generated database types, and a `/testing` fake client. |
| `@padel/query` | The shared TanStack Query client (no retries, refetch on mount), a provider, and a `/testing` provider and `render`. |
| `@padel/core` | Cross-domain primitives only: `IsoDate`, `SkillTier`, `FieldErrors` / `ValidationResult`, date and time helpers. Pure TypeScript. |
| `@padel/auth` | Authentication: session provider and `useSession`, sign-in and sign-up screens, sign-up validation, and guest-first prompting: the typed `AuthIntent`, an in-memory `AuthIntentProvider`, `useRequireAuth`, the contextual `AuthPromptSheet`, and `AccountActions` / `SignInPrompt` (the one place Create account and Sign in are offered). |
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

## Guest-first authentication

Browsing needs no account. When a guest attempts an action that needs one, `useRequireAuth()` returns whether to go ahead: `true` when signed in, `false` while the session is loading, and for a guest it records an `AuthIntent` and opens the contextual sheet.

- An `AuthIntent` is a fixed union (`joinMatch` with a match id, `createMatch`, `openMessages`, `openPersonalMatches`, `openProfile`), held in memory only. It never holds a callback or a route, and `parseAuthIntent` rejects anything malformed.
- `@padel/auth` knows no routes and imports no other domain. `AccountActions` is the only code that navigates to sign-in and sign-up (it records the intent first). `apps/mobile` owns the mapping from an intent to a route and resumes it once the user is signed in with a complete profile.
- The sheet lives in `@padel/auth` because its content depends only on the intent kind. It is built on `@padel/ui`'s `BottomSheet`, which handles the accessible title, focus, backdrop and Android back.
- Whatever is pending is dropped when the sheet is dismissed, the user leaves the auth screens, or they sign out.

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
3. Give it a `turbo.json` (`{ "extends": ["//"], "tags": ["domain-base" | "domain-feature"] }`) so `turbo boundaries` covers it. Add the package to `publicApi` in `packages/eslint-config/tests/package-exports.test.mjs`, and to
   `DOMAIN_PACKAGES` in `packages/eslint-config/boundaries.js` so `@padel/ui` cannot import it.
4. Consume it from `apps/mobile` (a route re-export or a composed screen).

## Enforcement

Two tools, covering different things:

- **`turbo boundaries`** (package level; `pnpm boundaries`, also run by `pnpm lint`). It reports a package that
  imports something it does not list in its `package.json`, and a file that imports from outside its package.
  Packages are tagged in their own `turbo.json`, and the root `turbo.json` denies edges between tags:
  `shared` (`ui`, `supabase`, `query`, `core`) may not depend on a domain; `domain-base` (`auth`, `destinations`)
  may not depend on a `domain-feature`; `domain-feature` (`profiles`, `listings`) may not depend on another
  `domain-feature`. It is experimental in Turborepo, and tags work on `package.json` dependencies, not on the
  import graph, so one bad edge can produce several errors.
- **ESLint** (`pnpm lint`) enforces what turbo does not: deep imports (`@padel/x/src/...`) and the layer rules
  inside a package.

- CI (`.github/workflows/ci.yml`) runs `pnpm check-types`, `pnpm lint` (which includes `turbo boundaries`) and `pnpm test` on every pull request and on pushes to `main`. It needs no secrets. `pnpm test:rls` is not part of it, because it needs a dev database.
- `pnpm lint` fails on boundary violations. `pnpm test` runs `packages/eslint-config/tests`, which check that the
  lint rules fire and that each package exposes only its intended entry points.
- Supabase row-level security is tested separately with `pnpm test:rls` (needs a dev database).

## Copy and translations

All user-facing text lives in JSON, not in components. `@padel/i18n` wraps i18next and react-i18next (`createI18n`, `buildResources`, `useTranslation`, `translateFieldErrors`, `getDeviceLanguage`) and is a shared package.

- **Per-package copy:** each package owns `src/locales/en.json` and exports `<name>Locales` (`authLocales`, `uiLocales`, `listingsLocales`, `profilesLocales`, `destinationsLocales`). The app's own copy is `apps/mobile/src/locales/en.json` (namespace `app`). The namespace is the package name.
- **Wiring:** `apps/mobile/src/i18n.ts` combines every package's locales with `buildResources` and picks the device language, falling back to English. `_layout.tsx` provides it with `I18nextProvider`.
- **Using it:** `const { t } = useTranslation('auth')`, then `t('signIn.title')`. Placeholders are `{{name}}` and plurals are `key_one` / `key_other` with `{ count }`. Never build a sentence by joining translated fragments.
- **Validation:** domain validators stay React-free and return translation keys (for example `validation.email`). Forms translate them with `translateFieldErrors(t, errors, params)`. Each validator's doc comment names the params its keys take.
- **Tests:** each package has `tests/setup-i18n.ts` that registers real English copy with `initTestI18n`, so tests assert on the actual text.
- **Adding a language:** add `es.json` (for example) beside each `en.json`, add it to that package's `locales/index.ts`, and it is picked up automatically. Missing keys fall back to English.
- **Not translated yet:** dates and numbers use `Intl` with `en-GB`; skill tier names come from `@padel/core`; server error messages and user-entered data (venues, names) are shown as they arrive.

## Player directory

The Players list on Discover is the `@padel/players` package (`domain-feature`). It imports only shared packages and `@padel/auth` (for the session in its cache key), never `profiles` or `listings`; the app puts the Players and Open matches lists side by side.

- **One public read, a function not a view.** `public.search_players` is `SECURITY DEFINER`, granted to `anon` and `authenticated`, and returns first name plus last initial, home destination, skill tier and a count. It enforces what a view cannot: at most 50 rows per call and nothing from offset 100 onwards. Guests get a null `player_id`; signed-in callers get ids and never see their own row. Search matches destination or country text only, never names. The base tables keep no `anon` grants, and `supabase/tests/rls.mjs` asserts this function is the only non-trigger function `anon` can execute.
- **Opt-in.** A player appears only when `profiles.discoverable_at` is set, they chose a home destination, and they have a skill tier. Everyone starts not listed. The profile form (`@padel/profiles`) has the switch and the home destination picker.
- **Client.** `usePlayers(filters)` pages offsets 0 and 50 only, keyed by session so a guest's results never serve a member. `PlayerCard` is not pressable as a whole (there is no profile page) and `PlayersStatus` covers loading, empty and error; Discover owns the scrolling list.
- **Connect.** Not active yet. A guest gets the contextual sheet through a `connectPlayer` intent, which carries no player id and returns them to `/discover?view=players`. A signed-in member sees a disabled button with an explanation.
- **View state.** Discover holds a `players | matches` view (default matches), settable with a `view` route parameter that is cleared once applied. The destination chips, level chips and search text are shared by both views; the date fields only apply to matches.
