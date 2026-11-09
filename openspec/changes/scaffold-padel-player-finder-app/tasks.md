# Tasks

## 1. Monorepo scaffold

- [x] 1.1 Run `pnpm dlx create-turbo@latest` with pnpm in the scratchpad directory, and verify the output has `turbo.json`, `pnpm-workspace.yaml` and shared config packages
- [x] 1.2 Copy the root config and `packages/typescript-config` and `packages/eslint-config` into the repo (dropping template `web`/`docs` apps and `ui`) without overwriting `openspec/` or `.claude/`; rename the root package to `padel-ralligo`, pin `packageManager`, and verify `pnpm install` succeeds at the root
- [x] 1.3 Run `pnpm dlx create-expo-app@latest` (default template) in the scratchpad, move the result to `apps/mobile`, and verify its `package.json` lists the latest `expo` SDK
- [x] 1.4 Strip template demo content from `apps/mobile` (example tabs, parallax/themed demo components, reset script), point it at the shared tsconfig and eslint packages, and verify `pnpm install` plus `pnpm --filter mobile exec tsc --noEmit` pass
- [x] 1.5 Add `.npmrc`, define `build`, `lint`, `check-types` and `test` in `turbo.json` with matching root scripts, add a `start` script for the mobile app, and verify `pnpm turbo run check-types` runs in the workspaces that define it

## 2. Shared core package

- [x] 2.1 Create `packages/core` (TS source consumed directly, `main`/`types` at `src/index.ts`) with jest set up, and verify `pnpm --filter @repo/core test` runs
- [x] 2.2 Define the `Player` type and `players` mock data with at least one player per skill level; verify a unit test checks level coverage and required fields
- [x] 2.3 Implement pure `filterPlayers(players, level)` supporting an "All" option; verify unit tests for each level, "All", and no-match
- [x] 2.4 Add `packages/core` as a dependency of `apps/mobile`, import `players` in the app, and verify `pnpm start` bundles successfully (this is the early check of Metro with pnpm and workspace TS; apply the `node-linker=hoisted` fallback if it fails)

## 3. Mobile app shell

- [x] 3.1 Set app name/slug to `padel-ralligo` in `apps/mobile/app.json`; verify `pnpm start` from the root launches the dev server
- [x] 3.2 Set up `jest-expo` and `@testing-library/react-native` in `apps/mobile` with a `test` script; verify `pnpm --filter mobile test` runs and passes
- [ ] 3.3 Create the `(tabs)` layout with "Find players", "Matches" and "Profile" tabs and icons; verify by running the app and switching between all three tabs
- [x] 3.4 Add placeholder Matches and Profile screens with title and "coming soon" text; verify with render tests that each shows its title

## 4. Player discovery UI

- [x] 4.1 Build the player list item and "Find players" screen using `filterPlayers`, with skill-level filter chips and an empty state; verify render tests cover the list, filtering, "All" reset and the empty message
- [ ] 4.2 Run the app on the iOS simulator and verify filtering behaves as specified

## 5. Integration checks

- [x] 5.1 Document the repo layout and commands in the root `README.md` and verify each documented command runs as written
- [x] 5.2 From a clean state (`pnpm install`), run root `check-types`, `lint` and `test` through Turborepo and verify all exit 0

## Workflow follow-up

- Archive the change after review.
