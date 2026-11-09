# padel-ralligo

A padel player finding app. pnpm + Turborepo monorepo.

## Layout

| Path | What it is |
| --- | --- |
| `apps/mobile` | Expo (React Native) app using Expo Router: opens on Home, with Home / Discover / Create / Matches / Profile tabs. Home, Discover and destinations can be browsed without an account; Create, Matches and Profile need sign in |
| `packages/core` | Shared domain rules in TypeScript source (no build step): listing, trip, profile and sign-up validation, date and filter logic |
| `supabase` | Database migrations, row-level security and security tests for the hosted Supabase project |
| `packages/typescript-config` | Shared `tsconfig` bases |
| `packages/eslint-config` | Shared ESLint configs |

A web app is planned; it will live in `apps/web` and can reuse `@repo/core`.

Product background and design references are in [`docs/`](docs/): `product-vision.md`, `first-pass-prototype.md` and `design-reference.md`.

## Setup

1. `pnpm install`
2. Set up the backend: follow [`supabase/README.md`](supabase/README.md) (create a dev project, link it, push migrations).
3. Copy `apps/mobile/.env.example` to `apps/mobile/.env.local` and fill in the project URL and publishable key.
4. `pnpm start`, then press `i` for the iOS simulator. Expo Go must match the SDK; if the simulator has an older version, `expo start --ios` offers to install the right one.

## Commands

Run from the repository root (requires Node 24+; pnpm is pinned via `packageManager`).

```bash
pnpm install        # install every workspace
pnpm start          # start the Expo dev server for apps/mobile
pnpm check-types    # type check all workspaces
pnpm lint           # lint all workspaces
pnpm test           # run unit tests in all workspaces
pnpm test:rls       # security checks against the dev database (see supabase/README.md)
```

If Metro cannot resolve packages through pnpm's symlinked `node_modules`, add `node-linker=hoisted` to `.npmrc` and reinstall.
