# Design

## Context

Greenfield repo: it contains only `openspec/` and `.claude/`. See proposal.md for motivation. Latest Expo SDK is `expo@58.x` and `create-expo-app@5` (checked via npm); Node 24 is installed. `create-expo-app` and `create-turbo` refuse or struggle to write into a non-empty directory, so scaffolding happens in the scratchpad and results are copied in.

## Goals / Non-Goals

**Goals:**
- A pnpm + Turborepo workspace with a runnable, typed, linted and tested Expo app on the latest SDK.
- Player logic in a shared package so a web app can reuse it later.
- Filter logic is pure and separate from UI so it is unit-testable.

**Non-Goals:**
- The web app, backend, auth, geolocation, state management libraries, EAS/store config, styling libraries.
- A build step or publishing for shared packages.

## Decisions

- **Layout: `apps/mobile`, `packages/core`, `packages/typescript-config`, `packages/eslint-config`.** Mirrors the standard Turborepo layout so `apps/web` can be added later with no restructure. Alternative: single app at the root now and migrate later — rejected as a costlier move once code exists.
- **Scaffold the workspace with `pnpm dlx create-turbo@latest` (pnpm) in the scratchpad, keep only the root config and shared config packages, delete the template `web`/`docs` apps and `ui` package, then copy into the repo root.** Alternative: hand-write all workspace files — more error-prone. Copy excludes `openspec/` and `.claude/`.
- **Generate `apps/mobile` with `create-expo-app@latest` (default template) in the scratchpad, then move it into `apps/mobile`** and strip the demo content (example tabs, parallax/themed components, reset script). It is then wired to the shared tsconfig and eslint packages.
- **Expo Router (file-based) with a `(tabs)` group.** Default in the Expo template and gives deep linking. Alternative: React Navigation by hand — more boilerplate.
- **`packages/core` is plain TypeScript consumed as source (no build step)**: `package.json` `main`/`types` point at `src/index.ts`. Exports the `Player` type, `players` mock data and pure `filterPlayers(players, level)`. Metro and a future Next.js app (via `transpilePackages`) can consume TS source directly. Alternative: compile to `dist` — adds a build graph with no payoff yet.
- **pnpm pinned via the root `packageManager` field.** Turborepo tasks (`build`, `lint`, `check-types`, `test`) are defined in `turbo.json`; root scripts call `turbo run`.
- **Plain `StyleSheet` styling, no UI library.** Fewest dependencies for a scaffold; a shared `packages/ui` is deferred until the web app exists.
- **Tests: jest.** `packages/core` uses plain jest with ts support for unit tests (filter, data coverage). `apps/mobile` uses `jest-expo` and `@testing-library/react-native` for render tests (placeholder screens, list, filter, empty state). ESLint via the shared `eslint-config` package.

## Risks / Trade-offs

- [Metro and pnpm's symlinked `node_modules` may fail to resolve workspace packages or Expo dependencies] → Verify early with a `packages/core` import in the app. If resolution fails, set `node-linker=hoisted` in the root `.npmrc` and configure `metro.config.js` for the monorepo.
- [Expo and Metro consuming TypeScript source from `packages/core`] → Metro compiles workspace TS via Babel; verify with the early bundle check. Fall back to emitting JS if it does not.
- [Template contents change between SDK and `create-turbo` versions] → Inspect the generated projects before stripping files and adapt tasks to what is actually generated.
- [Copying from the scratchpad could overwrite `.claude/` or `openspec/`] → Exclude those paths and check for conflicts before copying.
- [Expo Go may lag the newest SDK] → If Expo Go does not support SDK 58, use a development build or simulator; noted as a verification caveat.
- [Mock data shape may not match a future API] → Keep the `Player` type small and isolated in `packages/core`.
