# Proposal

## Why

There is no app yet for `padel-ralligo`. We want a mobile app that helps padel players find other players to match with, and we expect to add a web app later. A pnpm + Turborepo monorepo with a runnable Expo app and shared packages lets feature work start from a known-good baseline and lets the web app reuse player logic without a later restructure.

## What Changes

- Turn the repository into a pnpm workspace orchestrated by Turborepo.
- Add `apps/mobile`: an Expo (React Native, TypeScript) app on the latest stable SDK (currently `expo@58.x`) using Expo Router with a bottom-tab shell.
- Add `packages/core`: the shared `Player` type, local mock player data and skill-level filter logic, written so a future web app can import it.
- Add `packages/typescript-config` and `packages/eslint-config` as shared tooling configs.
- Add a "Find players" tab listing players from mock data (name, skill level, location, preferred side) with a skill-level filter, plus placeholder "Matches" and "Profile" tabs.
- Add root scripts (`build`, `lint`, `check-types`, `test`) that run across workspaces via Turborepo, and a unit test runner (jest) for `packages/core` and `apps/mobile`.
- Out of scope: the web app (only the `apps/` layout leaves room for it), backend/API, authentication, real geolocation, chat/messaging, push notifications, payments, EAS/store builds.

## Capabilities

### New Capabilities
- `app-shell`: The monorepo workspace, the runnable mobile app and its tab navigation (Find players, Matches, Profile), and the project-wide quality checks.
- `player-discovery`: Browsing a list of players and filtering them by skill level, backed by shared mock data.

### Modified Capabilities
<!-- None: the repository has no existing specs. -->

## Impact

- New files at the repo root: `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `.npmrc`, plus `apps/mobile/`, `packages/core/`, `packages/typescript-config/`, `packages/eslint-config/`.
- New dependencies: `turbo`, `expo`, `react-native`, `expo-router` and related Expo packages, ESLint and jest tooling. pnpm is the package manager (pinned through `packageManager`).
- No existing code is affected; `openspec/` and `.claude/` are preserved.
- Assumptions: the user will run the app on an iOS simulator or Expo Go; no backend exists yet; `apps/web` is added in a later change.
